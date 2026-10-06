import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';

const GOOGLE_ROLE_KEY = 'brokerhub_google_role';

/**
 * Handles the OAuth redirect from Google/other providers.
 * Reads the requested role saved before redirect (e.g. 'broker' or 'customer'),
 * provisions or updates the user profile in public.users and public.brokers accordingly,
 * then routes to the correct dashboard.
 */
export const AuthCallbackPage: React.FC = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const provisionAndNavigate = async (user: any) => {
      const savedRole = (localStorage.getItem(GOOGLE_ROLE_KEY) as 'customer' | 'broker') || 'customer';
      localStorage.removeItem(GOOGLE_ROLE_KEY);

      // Check if user profile already exists in public.users
      const { data: existingProfile } = await supabase
        .from('users')
        .select('role')
        .eq('id', user.id)
        .maybeSingle();

      let targetRole: 'customer' | 'broker' | 'admin' = existingProfile?.role || savedRole;

      // If user explicitly initiated sign-in/up as a broker (from broker auth page or broker tab),
      // update or set their role in users table to 'broker'
      if (savedRole === 'broker' && existingProfile?.role !== 'broker') {
        targetRole = 'broker';
        if (existingProfile) {
          await supabase.from('users').update({ role: 'broker' }).eq('id', user.id);
        }
      }

      // If profile doesn't exist yet, insert new user record
      if (!existingProfile) {
        const fullName =
          user.user_metadata?.full_name ||
          user.user_metadata?.name ||
          user.email?.split('@')[0] ||
          'User';

        const { error: insertError } = await supabase.from('users').insert({
          id: user.id,
          email: user.email,
          full_name: fullName,
          avatar: user.user_metadata?.avatar_url || user.user_metadata?.picture || null,
          role: targetRole,
          status: 'active',
        });

        if (insertError) {
          console.error('Failed to create user profile:', insertError.message);
        }
      }

      // If targetRole is broker, ensure a corresponding record exists in public.brokers table
      if (targetRole === 'broker') {
        const { data: brokerRow } = await supabase
          .from('brokers')
          .select('id')
          .eq('id', user.id)
          .maybeSingle();

        if (!brokerRow) {
          const fullName =
            user.user_metadata?.full_name ||
            user.user_metadata?.name ||
            user.email?.split('@')[0] ||
            'Broker Partner';

          await supabase.from('brokers').insert([{
            id: user.id,
            name: fullName,
            specialty: 'General Brokerage',
            company: 'Independent Broker',
          }]);
        }
      }

      // Navigate to destination dashboard
      const destination =
        targetRole === 'broker' ? '/broker/dashboard'
        : targetRole === 'admin' ? '/admin/dashboard'
        : '/customer/dashboard';

      navigate(destination, { replace: true });
    };

    const handleCallback = async () => {
      try {
        // PKCE flow: Supabase sends ?code= in the URL — exchange it for a session
        const params = new URLSearchParams(window.location.search);
        const code = params.get('code');

        if (code) {
          const { data: { session }, error } = await supabase.auth.exchangeCodeForSession(code);
          if (error) {
            console.error('PKCE code exchange error:', error.message);
            navigate('/login', { replace: true });
            return;
          }
          if (session?.user) {
            await provisionAndNavigate(session.user);
            return;
          }
        }

        // Fallback: implicit/existing session (small delay to allow Supabase to hydrate)
        await new Promise((res) => setTimeout(res, 800));
        const { data: { session }, error } = await supabase.auth.getSession();

        if (error) {
          console.error('OAuth callback error:', error.message);
          navigate('/login', { replace: true });
          return;
        }

        if (session?.user) {
          await provisionAndNavigate(session.user);
        } else {
          // Final fallback: listen for auth state change
          const { data: { subscription } } = supabase.auth.onAuthStateChange(
            async (_event, sess) => {
              subscription.unsubscribe();
              if (sess?.user) {
                await provisionAndNavigate(sess.user);
              } else {
                navigate('/login', { replace: true });
              }
            }
          );
          // Safety timeout — if no auth state after 5s, send to login
          setTimeout(() => {
            navigate('/login', { replace: true });
          }, 5000);
        }
      } catch (err) {
        console.error('Auth callback unexpected error:', err);
        navigate('/login', { replace: true });
      }
    };

    handleCallback();
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-bg">
      <div className="text-center">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-text-primary font-medium">Signing you in...</p>
        <p className="text-sm text-gray-text mt-1">Please wait while we set up your account</p>
      </div>
    </div>
  );
};
