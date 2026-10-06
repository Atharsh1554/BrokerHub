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

    await supabase
      .from('orders')
      .update({
        payment_status: 'Failed',
        updated_at: new Date().toISOString(),
      })
      .eq('razorpay_order_id', payment.order_id)

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
