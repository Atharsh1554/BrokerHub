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

  try {
    // ---------------------------------------------------------------
    // 1. Authenticate the caller via Supabase JWT
    // ---------------------------------------------------------------
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) throw new Error('Missing Authorization header')

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Verify JWT to get the calling user
    const jwt = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabase.auth.getUser(jwt)
    if (authError || !user) throw new Error('Unauthorized: Invalid JWT')

    // ---------------------------------------------------------------
    // 2. Parse ONLY trusted references from frontend — NO amounts
    // ---------------------------------------------------------------
    const { order_db_id } = await req.json()
    if (!order_db_id) throw new Error('order_db_id is required')

    // ---------------------------------------------------------------
    // 3. Securely fetch the order from DB (customer must own it)
    // ---------------------------------------------------------------
    const { data: orderRow, error: orderError } = await supabase
      .from('orders')
      .select(`
        id,
        customer_id,
        total_amount,
        broker_id,
        payment_status,
        razorpay_order_id
      `)
      .eq('id', order_db_id)
      .eq('customer_id', user.id)
      .single()

    if (orderError || !orderRow) throw new Error('Order not found or access denied')
    if (orderRow.payment_status === 'paid' || orderRow.payment_status === 'Successful') throw new Error('Order already paid')
    if (orderRow.razorpay_order_id) {
      // Idempotent: return existing Razorpay order to prevent duplicates
      return new Response(JSON.stringify({
        id: orderRow.razorpay_order_id,
        amount: Math.round(orderRow.total_amount * 100),
        currency: 'INR',
        existing: true,
      }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 })
    }

    // ---------------------------------------------------------------
    // 4. Securely fetch broker commission config from DB
    // ---------------------------------------------------------------
    const brokerId = orderRow.broker_id
    const grossAmount = orderRow.total_amount

    let commissionType = 'NONE'
    let commissionValue = 0

    if (brokerId) {
      const { data: commRow } = await supabase
        .from('broker_commissions')
        .select('commission_type, commission_value')
        .eq('broker_id', brokerId)
        .eq('is_active', true)
        .single()

      if (commRow) {
        commissionType = commRow.commission_type || 'NONE'
        commissionValue = commRow.commission_value || 0
      }
    }

    // ---------------------------------------------------------------
    // 5. Calculate amounts on the BACKEND — platform commission = ₹0
    // ---------------------------------------------------------------
    const platformCommission = 0
    const brokerAmount = grossAmount

    // ---------------------------------------------------------------
    // 6. Initialize Razorpay & create order
    // ---------------------------------------------------------------
    const razorpay = new Razorpay({
      key_id: Deno.env.get('RAZORPAY_KEY_ID'),
      key_secret: Deno.env.get('RAZORPAY_KEY_SECRET'),
    })

    const razorpayOrderOptions: any = {
      amount: Math.round(grossAmount * 100), // paise
      currency: 'INR',
      receipt: order_db_id.slice(0, 40),
    }

    // NOTE: Razorpay Route transfers are disabled as standard Razorpay payment collection is active.
    const razorpayOrder = await razorpay.orders.create(razorpayOrderOptions)

    // ---------------------------------------------------------------
    // 7. Persist payment & settlement snapshot into the orders table
    // ---------------------------------------------------------------
    await supabase
      .from('orders')
      .update({
        razorpay_order_id: razorpayOrder.id,
        platform_commission: 0,
        broker_amount: grossAmount,
        commission_type: 'NONE',
        commission_value: 0,
        payment_status: 'Processing',
        settlement_status: 'Pending Admin Settlement',
        updated_at: new Date().toISOString(),
      })
      .eq('id', order_db_id)

    return new Response(JSON.stringify({
      id: razorpayOrder.id,
      amount: razorpayOrder.amount,
      currency: razorpayOrder.currency,
      // Send breakdown back for UI display
      gross_amount: grossAmount,
      platform_commission: 0,
      broker_amount: grossAmount,
      commission_type: 'NONE',
      route_enabled: false,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })

  } catch (error: any) {
    console.error('[create-razorpay-order] Error:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})
