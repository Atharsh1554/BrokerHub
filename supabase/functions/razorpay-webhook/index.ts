import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"
import crypto from "node:crypto"

// Webhook does NOT need CORS headers — it's server-to-server
const jsonHeaders = { 'Content-Type': 'application/json' }

serve(async (req) => {
  // Razorpay sends POST with a Webhook-Signature header
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405, headers: jsonHeaders })
  }

  const webhookSecret = Deno.env.get('RAZORPAY_WEBHOOK_SECRET')
  if (!webhookSecret) {
    console.error('[razorpay-webhook] RAZORPAY_WEBHOOK_SECRET not configured')
    return new Response(JSON.stringify({ error: 'Webhook secret not configured' }), { status: 500, headers: jsonHeaders })
  }

  const rawBody = await req.text()
  const razorpaySignature = req.headers.get('x-razorpay-signature')

  // ---------------------------------------------------------------
  // 1. Verify webhook signature
  // ---------------------------------------------------------------
  const expectedSignature = crypto
    .createHmac('sha256', webhookSecret)
    .update(rawBody)
    .digest('hex')

  if (expectedSignature !== razorpaySignature) {
    console.error('[razorpay-webhook] Invalid webhook signature')
    return new Response(JSON.stringify({ error: 'Invalid signature' }), { status: 401, headers: jsonHeaders })
  }

  let payload: any
  try {
    payload = JSON.parse(rawBody)
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON payload' }), { status: 400, headers: jsonHeaders })
  }

  const event = payload.event

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  )

  // ---------------------------------------------------------------
  // 2. Handle payment.captured — authoritative PAID signal
  // ---------------------------------------------------------------
  if (event === 'payment.captured') {
    const payment = payload.payload?.payment?.entity
    if (!payment) return new Response('ok', { status: 200 })

    const razorpayPaymentId = payment.id
    const razorpayOrderId = payment.order_id

    if (!razorpayOrderId) {
      console.warn('[razorpay-webhook] payment.captured missing order_id')
      return new Response('ok', { status: 200 })
    }

    // Find our DB order by the Razorpay order ID
    const { data: orderRow, error: fetchErr } = await supabase
      .from('orders')
      .select('id, payment_status, broker_id, total_amount')
      .eq('razorpay_order_id', razorpayOrderId)
      .single()

    if (fetchErr || !orderRow) {
      console.warn('[razorpay-webhook] Order not found for razorpay_order_id:', razorpayOrderId)
      return new Response('ok', { status: 200 })
    }

    // Idempotency: don't re-process
    if (orderRow.payment_status === 'paid' || orderRow.payment_status === 'Successful') {
      console.log('[razorpay-webhook] Order already marked paid, skipping:', orderRow.id)
      return new Response('ok', { status: 200 })
    }

    await supabase
      .from('orders')
      .update({
        payment_status: 'Successful',
        razorpay_payment_id: razorpayPaymentId,
        settlement_status: 'Pending Admin Settlement',
        status: 'Processing',
        updated_at: new Date().toISOString(),
      })
      .eq('id', orderRow.id)

    // Upsert into payments table for audit
    await supabase
      .from('payments')
      .upsert({
        transaction_id: razorpayPaymentId,
        order_id: orderRow.id,
        broker_id: orderRow.broker_id,
        amount: orderRow.total_amount,
        payment_method: 'Razorpay',
        status: 'Successful',
      }, { onConflict: 'transaction_id' })

    console.log('[razorpay-webhook] payment.captured processed for order:', orderRow.id)

    // Notify broker(s) of this successfully captured order (idempotent)
    try {
      const { data: existingNotifs } = await supabase
        .from('broker_notifications')
        .select('id')
        .eq('related_order_id', orderRow.id)
        .limit(1)

      if (!existingNotifs || existingNotifs.length === 0) {
        const { data: fullOrder } = await supabase
          .from('orders')
          .select('id, customer_id, customer_name, total_amount, broker_id, broker_name, order_items(id, product_name, quantity, broker_id, broker_name)')
          .eq('id', orderRow.id)
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
      console.warn('[razorpay-webhook] Broker notification warning:', notifErr)
    }
  }

  // ---------------------------------------------------------------
  // 3. Handle transfer.processed — broker settlement completed
  // ---------------------------------------------------------------
  if (event === 'transfer.processed') {
    const transfer = payload.payload?.transfer?.entity
    if (!transfer) return new Response('ok', { status: 200 })

    // The source (source_id) is the Razorpay payment ID associated with the transfer
    const razorpayPaymentId = transfer.source
    const transferAmount = transfer.amount / 100 // convert paise to rupees

    if (!razorpayPaymentId) {
      console.warn('[razorpay-webhook] transfer.processed missing source payment id')
      return new Response('ok', { status: 200 })
    }

    const { data: orderRow } = await supabase
      .from('orders')
      .select('id, settlement_status')
      .eq('razorpay_payment_id', razorpayPaymentId)
      .single()

    if (orderRow) {
      await supabase
        .from('orders')
        .update({
          settlement_status: 'Settled',
          updated_at: new Date().toISOString(),
        })
        .eq('id', orderRow.id)

      console.log('[razorpay-webhook] transfer.processed settled order:', orderRow.id, 'amount:', transferAmount)
    }
  }

  // ---------------------------------------------------------------
  // 4. Handle payment.failed
  // ---------------------------------------------------------------
  if (event === 'payment.failed') {
    const payment = payload.payload?.payment?.entity
    if (!payment?.order_id) return new Response('ok', { status: 200 })

    const { data: orderRow } = await supabase
      .from('orders')
      .select('id, payment_status, status')
      .eq('razorpay_order_id', payment.order_id)
      .single()

    if (orderRow) {
      // Never cancel if the order was already paid by a prior/duplicate callback
      if (orderRow.payment_status !== 'paid' && orderRow.payment_status !== 'Successful') {
        await supabase
          .from('orders')
          .update({
            status: 'Cancelled',
            payment_status: 'Failed',
            updated_at: new Date().toISOString(),
          })
          .eq('id', orderRow.id)

        // Restore product inventory
        try {
          const { data: items } = await supabase
            .from('order_items')
            .select('product_id, quantity')
            .eq('order_id', orderRow.id)

          if (items && items.length > 0) {
            for (const item of items) {
              if (item.product_id) {
                const { data: prod } = await supabase
                  .from('products')
                  .select('stock')
                  .eq('id', item.product_id)
                  .single()

                if (prod && typeof prod.stock === 'number') {
                  const newStock = prod.stock + (item.quantity || 1)
                  const newStatus = newStock === 0 ? 'Out of Stock' : (newStock < 10 ? 'Low Stock' : 'In Stock')
                  await supabase
                    .from('products')
                    .update({ stock: newStock, status: newStatus })
                    .eq('id', item.product_id)
                }
              }
            }
          }
        } catch (stockErr) {
          console.warn('[razorpay-webhook] Stock restoration warning:', stockErr)
        }

        // Clean up any false broker notifications linked to this order
        try {
          await supabase
            .from('broker_notifications')
            .delete()
            .eq('related_order_id', orderRow.id)
        } catch (notifErr) {
          console.warn('[razorpay-webhook] Notification cleanup warning:', notifErr)
        }

        console.log('[razorpay-webhook] Cancelled unpaid order and restored stock for:', orderRow.id)
      }
    }

    console.log('[razorpay-webhook] payment.failed for razorpay order:', payment.order_id)
  }

  // ---------------------------------------------------------------
  // 5. Handle refund.processed
  // ---------------------------------------------------------------
  if (event === 'refund.processed' || event === 'refund.speed_processed') {
    const refund = payload.payload?.refund?.entity
    if (!refund?.payment_id) return new Response('ok', { status: 200 })

    await supabase
      .from('orders')
      .update({
        payment_status: 'Refunded',
        settlement_status: 'Refunded',
        status: 'REFUNDED',
        updated_at: new Date().toISOString(),
      })
      .eq('razorpay_payment_id', refund.payment_id)

    await supabase
      .from('payments')
      .update({ status: 'Refunded', refund_status: 'Processed' })
      .eq('transaction_id', refund.payment_id)

    console.log('[razorpay-webhook] refund processed for payment:', refund.payment_id)
  }

  return new Response(JSON.stringify({ status: 'processed', event }), { status: 200, headers: jsonHeaders })
})
