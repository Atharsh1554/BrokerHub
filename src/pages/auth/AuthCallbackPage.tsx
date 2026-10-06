import React, { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';

/**
 * Handles the OAuth redirect from Google/other providers.
 * With PKCE flow, Supabase sends ?code= to this page.
 * We exchange the code, then wait for AuthContext to update
 * with the user profile before navigating to the dashboard.
 * This avoids the race condition where CustomerLayout sees
 * user=null before AuthContext has hydrated.
 */
export const AuthCallbackPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const exchangeAttempted = useRef(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Step 1: Exchange the PKCE code on mount (run once)
  useEffect(() => {
    if (exchangeAttempted.current) return;
    exchangeAttempted.current = true;

    const params = new URLSearchParams(window.location.search);
    const code = params.get('code');

    if (code) {
      // PKCE flow: exchange code for session
      // This triggers onAuthStateChange(SIGNED_IN) in AuthContext
      supabase.auth.exchangeCodeForSession(code).catch((err) => {
        console.error('PKCE code exchange failed:', err);
      });
    }
    // If no code, AuthContext will detect any existing session on its own

    // Safety net: if still here after 8s with no user, redirect to login
    timeoutRef.current = setTimeout(() => {
      navigate('/login', { replace: true });
    }, 8000);

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [navigate]);

  // Step 2: React to AuthContext user state — navigate once user is set
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
