import React, { createContext, useContext, useEffect, useState } from 'react';
import type { User as SupabaseUser } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import type { User } from '../types';
import { resolveUserDisplayName } from '../lib/userUtils';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password?: string) => Promise<{ error: any }>;
  signUp: (email: string, password?: string) => Promise<{ data?: any, error: any }>;
  signInWithGoogle: (role?: 'customer' | 'broker') => Promise<void>;
  signOut: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  signIn: async () => ({ error: null }),
  signUp: async () => ({ data: null, error: null }),
  signInWithGoogle: async () => {},
  signOut: async () => {},
  refreshUser: async () => {},
});

const GOOGLE_ROLE_KEY = 'brokerhub_google_role';

/** Provisions a user profile in public.users (and public.brokers if needed) */
async function provisionProfile(authUser: SupabaseUser, role: 'customer' | 'broker' = 'customer') {
  const { data: existing } = await supabase
    .from('users')
    .select('id')
    .eq('id', authUser.id)
    .single();

  if (existing) return; // Already provisioned

  const rawName = authUser.user_metadata?.full_name || authUser.user_metadata?.name;
  const fullName = resolveUserDisplayName(rawName, authUser.email);

  const avatar =
    authUser.user_metadata?.avatar_url ||
    authUser.user_metadata?.picture ||
    null;

  const { error } = await supabase.from('users').insert([{
    id: authUser.id,
    full_name: fullName,
    email: authUser.email,
    phone: authUser.user_metadata?.phone || null,
    avatar,
    role,
  }]);

  if (error) {
    console.error('Error provisioning user profile:', error);
    return;
  }

  if (role === 'broker') {
    await supabase.from('brokers').insert([{
      id: authUser.id,
      name: fullName,
      specialty: '',
      company: '',
    }]);
  }
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchUserProfile = async (authUser: SupabaseUser) => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', authUser.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching user profile:', error);
      }

      if (data) {
        const resolvedName = resolveUserDisplayName(data.full_name, data.email || authUser.email);
        setUser({
          id: data.id,
          fullName: resolvedName,
          email: data.email || authUser.email || '',
          phone: data.phone || '',
          avatar: data.avatar,
          role: data.role || 'customer',
        });
      } else if (authUser) {
        // No users row yet — check if they exist in the brokers table
        const { data: brokerRow } = await supabase
          .from('brokers')
          .select('id')
          .eq('id', authUser.id)
          .single();

        const detectedRole: 'customer' | 'broker' = brokerRow ? 'broker' : 'customer';

        const resolvedName = resolveUserDisplayName(
          authUser.user_metadata?.full_name || authUser.user_metadata?.name,
          authUser.email
        );
        setUser({
          id: authUser.id,
          fullName: resolvedName,
          email: authUser.email || '',
          phone: authUser.user_metadata?.phone || '',
          avatar: authUser.user_metadata?.avatar_url || null,
          role: detectedRole,
        });
      }
    } catch (err) {
      console.error('Exception fetching profile:', err);
    }
  };

  const refreshUser = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user) {
      await fetchUserProfile(session.user);
    } else {
      setUser(null);
    }
  };

  useEffect(() => {
    let cleanup: (() => void) | undefined;

    const initializeAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        await fetchUserProfile(session.user);
      }
      setLoading(false);

      const { data: { subscription } } = supabase.auth.onAuthStateChange(
        async (event, session) => {
          if (session?.user) {
            // If this is a new Google sign-in, provision the profile first
            if (event === 'SIGNED_IN') {
              const storedRole = (localStorage.getItem(GOOGLE_ROLE_KEY) as 'customer' | 'broker') || 'customer';
              await provisionProfile(session.user, storedRole);
              localStorage.removeItem(GOOGLE_ROLE_KEY);
            }
            await fetchUserProfile(session.user);
          } else {
            setUser(null);
          }
          setLoading(false);
        }
      );

      cleanup = () => subscription.unsubscribe();
    };

    initializeAuth();
    return () => cleanup?.();
  }, []);

  const signIn = async (email: string, password?: string) => {
    if (password) {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      return { error };
    } else {
      const { error } = await supabase.auth.signInWithOtp({ email });
      return { error };
    }
  };

  const signUp = async (email: string, password?: string) => {
    if (password) {
      const { data, error } = await supabase.auth.signUp({ email, password });
      return { data, error };
    }
    return { data: null, error: new Error('Password required for sign up') };
  };

  const signInWithGoogle = async (role: 'customer' | 'broker' = 'customer') => {
    // Store role before redirect so we can provision profile on return
    localStorage.setItem(GOOGLE_ROLE_KEY, role);
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
  };

  const signOut = async () => {
    // scope: 'global' signs out from ALL sessions on all devices
    await supabase.auth.signOut({ scope: 'global' });
    setUser(null);
    // Clear any persisted state from localStorage
    localStorage.removeItem('brokerhub_google_role');
  };

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signUp, signInWithGoogle, signOut, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
