import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';

/**
 * This page handles the OAuth redirect from Google/other providers.
 * Supabase automatically exchanges the code for a session; we just wait
 * for the session to be ready then route the user to the right dashboard.
 */
export const AuthCallbackPage: React.FC = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const handleCallback = async () => {
      // Give Supabase a moment to exchange the auth code for a session
      const { data: { session }, error } = await supabase.auth.getSession();

      if (error) {
        console.error('OAuth callback error:', error.message);
        navigate('/login');
        return;
      }

      if (session?.user) {
        // Fetch role from DB to determine where to route
        const { data: profile } = await supabase
          .from('users')
          .select('role')
          .eq('id', session.user.id)
          .single();

        const role = profile?.role;
        navigate(role === 'broker' ? '/broker/dashboard' : '/customer/dashboard', { replace: true });
      } else {
        // No session yet — listen for it
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, sess) => {
          subscription.unsubscribe();
          if (sess?.user) {
            const { data: profile } = await supabase
              .from('users')
              .select('role')
              .eq('id', sess.user.id)
              .single();
            navigate(profile?.role === 'broker' ? '/broker/dashboard' : '/customer/dashboard', { replace: true });
          } else {
            navigate('/login', { replace: true });
          }
        });
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
