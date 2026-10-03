import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';

const GOOGLE_ROLE_KEY = 'brokerhub_google_role';

/**
 * This page handles the OAuth redirect from Google/other providers.
 * Supabase automatically exchanges the code for a session; we just wait
 * for the session to be ready then route the user to the right dashboard.
 * If no profile exists in public.users yet, it creates one automatically.
 */
export const AuthCallbackPage: React.FC = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const provisionAndNavigate = async (user: any) => {
      // Check if user profile already exists in public.users
      const { data: existingProfile } = await supabase
        .from('users')
        .select('role')
        .eq('id', user.id)
        .single();

      if (existingProfile) {
        // Profile exists — route to correct dashboard
        const role = existingProfile.role;
        navigate(
          role === 'broker' ? '/broker/dashboard'
          : role === 'admin' ? '/admin/dashboard'
          : '/customer/dashboard',
          { replace: true }
        );
        return;
      }

      // Profile doesn't exist — create one now (first Google sign-in)
      const savedRole = (localStorage.getItem(GOOGLE_ROLE_KEY) as 'customer' | 'broker') || 'customer';
      localStorage.removeItem(GOOGLE_ROLE_KEY);

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
        role: savedRole,
        status: 'active',
      });

      if (insertError) {
        console.error('Failed to create user profile:', insertError.message);
        // Navigate anyway — profile can be created later
      }

      navigate(
        savedRole === 'broker' ? '/broker/dashboard' : '/customer/dashboard',
        { replace: true }
      );
    };

    const handleCallback = async () => {
      // Small delay to allow Supabase to finish exchanging the auth code
      await new Promise((res) => setTimeout(res, 500));

      const { data: { session }, error } = await supabase.auth.getSession();

      if (error) {
        console.error('OAuth callback error:', error.message);
        navigate('/login');
        return;
      }

      if (session?.user) {
        await provisionAndNavigate(session.user);
      } else {
        // No session yet — listen for auth state change
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
