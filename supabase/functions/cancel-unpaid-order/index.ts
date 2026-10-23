import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"
import Razorpay from "npm:razorpay"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  )

  const razorpayKeyId = Deno.env.get('RAZORPAY_KEY_ID')
  const razorpayKeySecret = Deno.env.get('RAZORPAY_KEY_SECRET')
  let razorpay: any = null
  if (razorpayKeyId && razorpayKeySecret) {
    try {
      razorpay = new Razorpay({
        key_id: razorpayKeyId,
        key_secret: razorpayKeySecret,
      })
    } catch (rzpInitErr) {
      console.warn('[cancel-unpaid-order] Razorpay client initialization error:', rzpInitErr)
    }
  }

  // Helper to safely notify brokers when a late payment is confirmed
  const notifyBrokersForOrder = async (orderId: string) => {
    try {
      const { data: existingNotifs } = await supabase
        .from('broker_notifications')
        .select('id')
        .eq('related_order_id', orderId)
        .limit(1)

      if (existingNotifs && existingNotifs.length > 0) return

      const { data: orderData } = await supabase
        .from('orders')
        .select('id, customer_id, customer_name, total_amount, broker_id, broker_name, order_items(id, product_name, quantity, broker_id, broker_name)')
        .eq('id', orderId)
        .single()

      if (!orderData) return

      const uniqueBrokers = new Map<string, string>()
      if (orderData.broker_id) uniqueBrokers.set(orderData.broker_id, orderData.broker_name || 'Verified Broker')
      if (orderData.order_items) {
        for (const it of orderData.order_items) {
          if (it.broker_id) uniqueBrokers.set(it.broker_id, it.broker_name || 'Verified Broker')
        }
      }

      const itemsSummary = (orderData.order_items || [])
        .slice(0, 2)
        .map((i: any) => `${i.product_name} (x${i.quantity})`)
        .join(', ')

      const notifRows = Array.from(uniqueBrokers.entries()).map(([bId]) => ({
        broker_id: bId,
        customer_id: orderData.customer_id,
        customer_name: orderData.customer_name || 'Customer',
        type: 'order',
        title: `New Order #${orderData.id.slice(0, 8)} received`,
        description: `${orderData.customer_name} placed an order: ${itemsSummary}. Total: ₹${Number(orderData.total_amount).toLocaleString('en-IN')}`,
        related_order_id: orderData.id,
        is_read: false,
        status: 'pending',
      }))

      if (notifRows.length > 0) {
        await supabase.from('broker_notifications').insert(notifRows)
      }
    } catch (err) {
      console.warn('[cancel-unpaid-order] Error notifying brokers:', err)
    }
  }

  // Helper to cancel a single order and restore stock
  const processCancellation = async (order: any, reason: string) => {
    // 1. Prevent incorrect cancellations: verify against Razorpay if order has razorpay_order_id
    if (razorpay && order.razorpay_order_id) {
      try {
        const payments = await razorpay.orders.fetchPayments(order.razorpay_order_id)
        const captured = (payments?.items || []).find(
          (p: any) => p.status === 'captured' || p.status === 'authorized'
        )

        if (captured) {
          // Payment ACTUALLY succeeded! Do not cancel!
          await supabase
            .from('orders')
            .update({
              payment_status: 'Successful',
              status: 'Processing',
              razorpay_payment_id: captured.id,
              settlement_status: 'Pending Admin Settlement',
              updated_at: new Date().toISOString(),
            })
            .eq('id', order.id)

          await notifyBrokersForOrder(order.id)
          return { status: 'confirmed_paid', order_id: order.id }
        }
      } catch (rzpErr) {
        console.warn(`[cancel-unpaid-order] Razorpay check failed for ${order.id}:`, rzpErr)
      }
    }

    // 2. Mark order as Cancelled and payment_status as Failed
    const { error: cancelErr } = await supabase
      .from('orders')
      .update({
        status: 'Cancelled',
        payment_status: 'Failed',
        updated_at: new Date().toISOString(),
      })
      .eq('id', order.id)

    if (cancelErr) {
      console.error(`[cancel-unpaid-order] Failed to update order status for ${order.id}:`, cancelErr)
      return { status: 'error', error: cancelErr.message }
    }

    // 3. Restore product inventory
    try {
      const { data: items } = await supabase
        .from('order_items')
        .select('product_id, quantity')
        .eq('order_id', order.id)

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
      console.warn(`[cancel-unpaid-order] Stock restoration warning for ${order.id}:`, stockErr)
    }

    // 4. Remove or cancel any false broker notifications linked to this order
    try {
      await supabase
        .from('broker_notifications')
        .delete()
        .eq('related_order_id', order.id)

      // Also clean up by title pattern if related_order_id wasn't populated
      const orderShortId = order.id.slice(0, 8)
      await supabase
        .from('broker_notifications')
        .delete()
        .ilike('title', `%#${orderShortId}%`)
    } catch (notifErr) {
      console.warn(`[cancel-unpaid-order] Notification cleanup warning for ${order.id}:`, notifErr)
    }

    console.log(`[cancel-unpaid-order] Order ${order.id} cancelled successfully. Reason: ${reason}`)
    return { status: 'cancelled', order_id: order.id }
  }

  try {
    let body: any = {}
    if (req.method === 'POST') {
      try {
        body = await req.json()
      } catch {
        body = {}
      }
    }

    const { order_db_id, reason, sweep_abandoned, timeout_minutes } = body

    // -----------------------------------------------------------------
    // Mode A: Sweep abandoned unpaid orders after timeout (server-side)
    // -----------------------------------------------------------------
    if (sweep_abandoned || req.method === 'GET') {
      const timeoutMin = typeof timeout_minutes === 'number' && timeout_minutes > 0 ? timeout_minutes : 15
      const cutoffTime = new Date(Date.now() - timeoutMin * 60 * 1000).toISOString()

      // Find abandoned pending orders created before the timeout cutoff
      const { data: abandonedOrders, error: fetchErr } = await supabase
        .from('orders')
        .select('id, payment_status, status, razorpay_order_id, payment_method, created_at')
        .eq('status', 'Pending')
        .in('payment_status', ['Pending', 'Processing'])
        .not('payment_method', 'ilike', '%cod%')
        .lte('created_at', cutoffTime)

      if (fetchErr) throw fetchErr

      const results = {
        cancelled: [] as string[],
        confirmed_paid: [] as string[],
        errors: [] as any[],
      }

      if (abandonedOrders && abandonedOrders.length > 0) {
        for (const ord of abandonedOrders) {
          const res = await processCancellation(ord, `Abandoned payment timeout (${timeoutMin}m)`)
          if (res.status === 'cancelled') results.cancelled.push(ord.id)
          else if (res.status === 'confirmed_paid') results.confirmed_paid.push(ord.id)
          else results.errors.push(res)
        }
      }

      return new Response(JSON.stringify({
        success: true,
        sweep: true,
        timeout_minutes: timeoutMin,
        processed_count: (abandonedOrders || []).length,
        ...results,
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      })
    }

    // -----------------------------------------------------------------
    // Mode B: Cancel specific order (checkout exit, dismiss, failed)
    // -----------------------------------------------------------------
    if (!order_db_id) {
      throw new Error('order_db_id is required or specify sweep_abandoned: true')
    }

    const { data: orderRow, error: orderFetchErr } = await supabase
      .from('orders')
      .select('id, payment_status, status, razorpay_order_id, payment_method')
      .eq('id', order_db_id)
      .single()

    if (orderFetchErr || !orderRow) {
      return new Response(JSON.stringify({ error: 'Order not found', success: false }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 404,
      })
    }

    // Never cancel an order if payment has already succeeded
    const isPaid = orderRow.payment_status === 'paid' || orderRow.payment_status === 'Successful'
    if (isPaid) {
      return new Response(JSON.stringify({
        success: false,
        already_paid: true,
        message: 'Order is already marked as paid. Cancellation rejected.',
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      })
    }

    // Cancel order safely
    const cancelRes = await processCancellation(orderRow, reason || 'Customer exited checkout')

    return new Response(JSON.stringify({
      success: cancelRes.status === 'cancelled' || cancelRes.status === 'confirmed_paid',
      result: cancelRes,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })

  } catch (error: any) {
    console.error('[cancel-unpaid-order] Error:', error)
    return new Response(JSON.stringify({ error: error.message, success: false }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})
