import React, { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

/**
 * OAuth callback handler.
 *
 * With detectSessionInUrl=true on the Supabase client, auto-detection is
 * enabled. Supabase will automatically:
 *  1. Read the ?code= parameter from the URL (PKCE flow)
 *  2. Exchange it for a session and fire SIGNED_IN in onAuthStateChange
 *  3. AuthContext handles SIGNED_IN: provisions profile + sets user state
 *  4. We then navigate to the correct dashboard once user is confirmed
 */
export const AuthCallbackPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    // With detectSessionInUrl=true, Supabase automatically exchanges the PKCE code.
    // We just wait for the AuthContext to set the user or timeout if it fails.
    
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
