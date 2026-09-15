import React, { createContext, useContext, useEffect, useState } from 'react';
import type { User as SupabaseUser } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import type { User } from '../types';

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

  const fullName =
    authUser.user_metadata?.full_name ||
    authUser.user_metadata?.name ||
    authUser.email?.split('@')[0] ||
    'User';

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

      if (error) {
        console.error('Error fetching user profile:', error);
        return;
      }

      if (data) {
        setUser({
          id: data.id,
          fullName: data.full_name,
          email: data.email,
          phone: data.phone || '',
          avatar: data.avatar,
          role: data.role,
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
    await supabase.auth.signOut();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signUp, signInWithGoogle, signOut, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
