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
    // 1. Authenticate broker
    // ---------------------------------------------------------------
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) throw new Error('Missing Authorization header')

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const jwt = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabase.auth.getUser(jwt)
    if (authError || !user) throw new Error('Unauthorized')

    // Ensure user is a broker or admin
    const { data: userRow } = await supabase
      .from('users')
      .select('role, full_name, email, phone')
      .eq('id', user.id)
      .single()

    if (!userRow || !['broker', 'admin', 'super_admin'].includes(userRow.role)) {
      throw new Error('Only brokers can set up payment accounts')
    }

    const action = req.method === 'GET' ? 'status' : (await req.json()).action

    // ---------------------------------------------------------------
    // 2. GET — Return current payment account status
    // ---------------------------------------------------------------
    if (req.method === 'GET' || action === 'status') {
      const { data: payAccRow } = await supabase
        .from('broker_payment_accounts')
        .select('razorpay_linked_account_id, status, onboarding_status, created_at, updated_at')
        .eq('broker_id', user.id)
        .maybeSingle()

      return new Response(JSON.stringify({
        has_account: Boolean(payAccRow?.razorpay_linked_account_id),
        status: payAccRow?.status || 'Not Connected',
        razorpay_linked_account_id: payAccRow?.razorpay_linked_account_id || null,
        onboarding_status: payAccRow?.onboarding_status || {},
      }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 })
    }

    // ---------------------------------------------------------------
    // 3. POST action=create_account — Create Razorpay Linked Account
    //    NOTE: Razorpay Route/Linked Accounts must be enabled on dashboard.
    //    This creates the account programmatically; KYC is done on Razorpay's side.
    // ---------------------------------------------------------------
    if (action === 'create_account') {
      // Check if already connected
      const { data: existing } = await supabase
        .from('broker_payment_accounts')
        .select('razorpay_linked_account_id, status')
        .eq('broker_id', user.id)
        .maybeSingle()

      if (existing?.status === 'Connected' && existing?.razorpay_linked_account_id) {
        return new Response(JSON.stringify({
          success: true,
          already_connected: true,
          razorpay_linked_account_id: existing.razorpay_linked_account_id,
          status: 'Connected',
        }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 })
      }

      const keyId = Deno.env.get('RAZORPAY_KEY_ID')
      const keySecret = Deno.env.get('RAZORPAY_KEY_SECRET')

      if (!keyId || !keySecret) {
        // Store as Pending so broker is tracked for manual settlements
        await supabase
          .from('broker_payment_accounts')
          .upsert({
            broker_id: user.id,
            status: 'Pending',
            onboarding_status: { note: 'Razorpay keys not configured on edge function server. Manual admin settlement active.', attempted_at: new Date().toISOString() },
            updated_at: new Date().toISOString(),
          }, { onConflict: 'broker_id' })

        return new Response(JSON.stringify({
          success: false,
          status: 'Pending',
          error: 'Razorpay API keys not configured on server.',
          note: 'Razorpay keys are missing in edge function environment. Account marked as Pending for manual settlements.',
        }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 })
      }

      const razorpay = new Razorpay({
        key_id: keyId,
        key_secret: keySecret,
      })

      // Create a Razorpay Route Linked Account for this broker
      const accountPayload = {
        email: userRow.email || `${user.id}@brokerhub.app`,
        profile: {
          category: 'ecommerce',
          subcategory: 'marketplace',
          addresses: {
            registered: {
              street1: 'Broker Hub Platform',
              street2: '',
              city: 'Mumbai',
              state: 'MH',
              postal_code: '400001',
              country: 'IN',
            }
          }
        },
        legal_business_name: userRow.full_name || 'Broker Partner',
        business_type: 'individual',
        legal_info: {
          pan: 'AAAAA0000A', // Placeholder — Razorpay will prompt for actual KYC
        },
        type: 'route',
      }

      let razorpayAccount: any
      try {
        razorpayAccount = await (razorpay as any).accounts.create(accountPayload)
      } catch (rzpError: any) {
        const errMsg = rzpError?.error?.description || rzpError?.message || 'Razorpay account creation failed'
        console.error('[broker-payment-onboarding] Razorpay account creation error:', errMsg)

        // Store as Pending so we can track and retry
        await supabase
          .from('broker_payment_accounts')
          .upsert({
            broker_id: user.id,
            status: 'Pending',
            onboarding_status: { error: errMsg, attempted_at: new Date().toISOString() },
            updated_at: new Date().toISOString(),
          }, { onConflict: 'broker_id' })

        return new Response(JSON.stringify({
          success: false,
          error: errMsg,
          note: 'Razorpay Route may not be enabled on this account. Please contact Razorpay support to enable Route/Marketplace feature.',
          status: 'Pending',
        }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 })
      }

      // Save linked account ID
      await supabase
        .from('broker_payment_accounts')
        .upsert({
          broker_id: user.id,
          razorpay_linked_account_id: razorpayAccount.id,
          status: 'Connected',
          onboarding_status: {
            created_at: new Date().toISOString(),
            razorpay_account_id: razorpayAccount.id,
          },
          updated_at: new Date().toISOString(),
        }, { onConflict: 'broker_id' })

      return new Response(JSON.stringify({
        success: true,
        razorpay_linked_account_id: razorpayAccount.id,
        status: 'Connected',
        message: 'Razorpay linked account created successfully. KYC will be requested by Razorpay before settlement.',
      }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 })
    }

    throw new Error(`Unknown action: ${action}`)

  } catch (error: any) {
    console.error('[broker-payment-onboarding] Error:', error)
    return new Response(JSON.stringify({ error: error.message, success: false }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
  }
})
