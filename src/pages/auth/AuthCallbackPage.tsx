import React, { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';

/**
 * OAuth callback handler.
 *
 * With detectSessionInUrl=false on the Supabase client, auto-detection is
 * disabled. This page explicitly:
 *  1. Reads the ?code= parameter from the URL (PKCE flow)
 *  2. Calls exchangeCodeForSession — fires SIGNED_IN in onAuthStateChange
 *  3. AuthContext handles SIGNED_IN: provisions profile + sets user state
 *  4. We then navigate to the correct dashboard once user is confirmed
 */
export const AuthCallbackPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const exchangeAttempted = useRef(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Step 1: Exchange the PKCE code exactly once
  useEffect(() => {
    if (exchangeAttempted.current) return;
    exchangeAttempted.current = true;

    const run = async () => {
      const params = new URLSearchParams(window.location.search);
      const code = params.get('code');

      if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(code);
        if (error) {
          console.error('PKCE exchange failed:', error.message);
          navigate('/login', { replace: true });
          return;
        }
        // On success, onAuthStateChange(SIGNED_IN) fires in AuthContext
        // which sets the user. Step 2 below will then navigate.
      } else {
        // No code — try reading session directly (e.g. existing session)
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          // Nothing to do, timeout below will redirect
          console.warn('No auth code and no session found on callback');
        }
      }
    };

    run();

    // Safety: if user never gets set after 12s, go to login
    timeoutRef.current = setTimeout(() => {
      navigate('/login', { replace: true });
    }, 12000);

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [navigate]);

  // Step 2: Navigate once AuthContext confirms the user
  useEffect(() => {
    if (!loading && user) {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      const destination =
        user.role === 'broker' ? '/broker/dashboard'
        : user.role === 'admin' ? '/admin/dashboard'
        : '/customer/dashboard';
      navigate(destination, { replace: true });
    }
  }, [user, loading, navigate]);

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
