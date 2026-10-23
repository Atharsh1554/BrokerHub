import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"
import crypto from "node:crypto"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, order_db_id } = await req.json()

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !order_db_id) {
      throw new Error('Missing required payment verification parameters')
    }

    const secret = Deno.env.get('RAZORPAY_KEY_SECRET')
    if (!secret) throw new Error('Razorpay secret not configured')

    // ---------------------------------------------------------------
    // 1. Verify Razorpay HMAC signature — authoritative server-side check
    // ---------------------------------------------------------------
    const generated_signature = crypto
      .createHmac('sha256', secret)
      .update(razorpay_order_id + '|' + razorpay_payment_id)
      .digest('hex')

    if (generated_signature !== razorpay_signature) {
      throw new Error('Invalid payment signature — verification failed')
    }

    // ---------------------------------------------------------------
    // 2. Connect using Service Role to bypass RLS
    // ---------------------------------------------------------------
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // ---------------------------------------------------------------
    // 3. Fetch the order to prevent duplicate processing
    // ---------------------------------------------------------------
    const { data: orderRow, error: fetchErr } = await supabase
      .from('orders')
      .select('id, payment_status, razorpay_order_id, total_amount, broker_id, platform_commission, broker_amount')
      .eq('id', order_db_id)
      .single()

    if (fetchErr || !orderRow) throw new Error('Order not found')

    // Idempotency: if already paid, return success without re-processing
    if (orderRow.payment_status === 'paid' || orderRow.payment_status === 'Successful') {
      return new Response(JSON.stringify({ success: true, already_processed: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      })
    }

    // ---------------------------------------------------------------
    // 4. Update order to Successful with Razorpay payment ID
    // ---------------------------------------------------------------
    const { error: updateErr } = await supabase
      .from('orders')
      .update({
        payment_status: 'Successful',
        razorpay_payment_id,
        razorpay_order_id: razorpay_order_id, // ensure it's stored even if create-order missed it
        settlement_status: 'Pending Admin Settlement',
        status: 'Processing',
        updated_at: new Date().toISOString(),
      })
      .eq('id', order_db_id)

    if (updateErr) throw updateErr

    // ---------------------------------------------------------------
    // 5. Record in payments table for audit trail (non-blocking)
    // ---------------------------------------------------------------
    try {
      await supabase
        .from('payments')
        .upsert({
          transaction_id: razorpay_payment_id,
          order_id: order_db_id,
          broker_id: orderRow.broker_id,
          amount: orderRow.total_amount,
          payment_method: 'Razorpay',
          status: 'Successful',
        }, { onConflict: 'transaction_id' })
    } catch (paymentsErr) {
      // Non-fatal: payments table audit log failed, but order is already marked paid
      console.warn('[verify-razorpay-payment] Payments table insert skipped:', paymentsErr)
    // ---------------------------------------------------------------
    // 6. Notify the broker(s) of this verified, successfully paid order
    // ---------------------------------------------------------------
    try {
      const { data: existingNotifs } = await supabase
        .from('broker_notifications')
        .select('id')
        .eq('related_order_id', order_db_id)
        .limit(1)

      if (!existingNotifs || existingNotifs.length === 0) {
        const { data: fullOrder } = await supabase
          .from('orders')
          .select('id, customer_id, customer_name, total_amount, broker_id, broker_name, order_items(id, product_name, quantity, broker_id, broker_name)')
          .eq('id', order_db_id)
          .single()

        if (fullOrder) {
          const uniqueBrokers = new Map<string, string>()
          if (fullOrder.broker_id) uniqueBrokers.set(fullOrder.broker_id, fullOrder.broker_name || 'Verified Broker')
          if (fullOrder.order_items) {
            for (const it of fullOrder.order_items) {
              if (it.broker_id) uniqueBrokers.set(it.broker_id, it.broker_name || 'Verified Broker')
            }
          }

          const itemsSummary = (fullOrder.order_items || [])
            .slice(0, 2)
            .map((i: any) => `${i.product_name} (x${i.quantity})`)
            .join(', ')

          const notifRows = Array.from(uniqueBrokers.entries()).map(([bId]) => ({
            broker_id: bId,
            customer_id: fullOrder.customer_id,
            customer_name: fullOrder.customer_name || 'Customer',
            type: 'order',
            title: `New Order #${fullOrder.id.slice(0, 8)} received`,
            description: `${fullOrder.customer_name} placed an order: ${itemsSummary}. Total: ₹${Number(fullOrder.total_amount).toLocaleString('en-IN')}`,
            related_order_id: fullOrder.id,
            is_read: false,
            status: 'pending',
          }))

          if (notifRows.length > 0) {
            await supabase.from('broker_notifications').insert(notifRows)
          }
        }
      }
    } catch (notifErr) {
      console.warn('[verify-razorpay-payment] Broker notification warning:', notifErr)
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })

  } catch (error: any) {
    console.error('[verify-razorpay-payment] Error:', error)
    return new Response(JSON.stringify({ error: error.message, success: false }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})
