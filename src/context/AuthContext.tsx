import React, { createContext, useContext, useEffect, useState } from 'react';
import type { User as SupabaseUser } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import type { User } from '../types';
import { resolveUserDisplayName } from '../lib/userUtils';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password?: string) => Promise<{ error: any }>;
  signUp: (email: string, password?: string, role?: 'customer' | 'broker', fullName?: string) => Promise<{ data?: any, error: any }>;
  signInWithGoogle: (role?: 'customer' | 'broker') => Promise<void>;
  sendPhoneOtp: (phone: string, role: 'customer' | 'broker') => Promise<{ error: any }>;
  verifyPhoneOtp: (phone: string, token: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  refreshUser: () => Promise<void>;
  updateUserLocal: (data: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  signIn: async () => ({ error: null }),
  signUp: async () => ({ data: null, error: null }),
  signInWithGoogle: async () => {},
  sendPhoneOtp: async () => ({ error: null }),
  verifyPhoneOtp: async () => ({ error: null }),
  signOut: async () => {},
  refreshUser: async () => {},
  updateUserLocal: () => {},
});

const GOOGLE_ROLE_KEY = 'brokerhub_google_role';

/** Provisions a user profile in public.users (and public.brokers if needed) */
async function provisionProfile(authUser: SupabaseUser, requestedRole?: 'customer' | 'broker') {
  const metaRole = authUser.user_metadata?.role as 'customer' | 'broker' | undefined;
  const effectiveRequestedRole = requestedRole || metaRole || 'customer';

  const { data: existing } = await supabase
    .from('users')
    .select('id, role')
    .eq('id', authUser.id)
    .maybeSingle();

  const rawName = authUser.user_metadata?.full_name || authUser.user_metadata?.name;
  const fullName = resolveUserDisplayName(rawName, authUser.email);

  const avatar =
    authUser.user_metadata?.avatar_url ||
    authUser.user_metadata?.picture ||
    null;

  let targetRole: 'customer' | 'broker' | 'admin' = effectiveRequestedRole;

  if (existing) {
    targetRole = existing.role || effectiveRequestedRole;
    // Upgrade/update user role to broker if broker role was explicitly requested
    if (effectiveRequestedRole === 'broker' && existing.role !== 'broker') {
      targetRole = 'broker';
      await supabase
        .from('users')
        .update({ role: 'broker' })
        .eq('id', authUser.id);
    }
  } else {
    // New user profile — use upsert so it never fails on duplicate key race conditions
    const { error } = await supabase.from('users').upsert({
      id: authUser.id,
      full_name: fullName,
      email: authUser.email,
      phone: authUser.user_metadata?.phone || null,
      avatar,
      role: targetRole,
      status: 'active',
    }, { onConflict: 'id' });

    if (error) {
      console.error('Error provisioning user profile:', error);
    }
  }

  // Ensure corresponding record in public.brokers exists if targetRole is broker
  if (targetRole === 'broker') {
    const { data: existingBroker } = await supabase
      .from('brokers')
      .select('id')
      .eq('id', authUser.id)
      .maybeSingle();

    if (!existingBroker) {
      await supabase.from('brokers').upsert({
        id: authUser.id,
        name: fullName,
        specialty: 'General Brokerage',
        company: 'Independent Broker',
      }, { onConflict: 'id' });
    }
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

      // Check if there are local overrides saved for this user
      let localOverride: any = null;
      try {
        const raw = localStorage.getItem('brokerhub_broker_overrides');
        if (raw) {
          const overrides = JSON.parse(raw);
          localOverride = overrides[authUser.id];
        }
      } catch {}

      if (data) {
        const resolvedName = resolveUserDisplayName(localOverride?.name || data.full_name, localOverride?.email || data.email || authUser.email);
        setUser({
          id: data.id,
          fullName: resolvedName,
          email: localOverride?.email || data.email || authUser.email || '',
          phone: localOverride?.phone || data.phone || authUser.user_metadata?.phone || '',
          addressLine1: data.address_line_1 || authUser.user_metadata?.address_line_1 || '',
          addressLine2: data.address_line_2 || authUser.user_metadata?.address_line_2 || '',
          city: data.city || authUser.user_metadata?.city || '',
          state: data.state || authUser.user_metadata?.state || '',
          pincode: data.pincode || authUser.user_metadata?.pincode || '',
          landmark: data.landmark || authUser.user_metadata?.landmark || '',
          address: data.address || authUser.user_metadata?.address || '',
          avatar: localOverride?.avatar || data.avatar,
          role: data.role || 'customer',
        });
      } else if (authUser) {
        // No users row yet — check if they exist in the brokers table
        const { data: brokerRow } = await supabase
          .from('brokers')
          .select('id')
          .eq('id', authUser.id)
          .maybeSingle();

        const detectedRole: 'customer' | 'broker' = brokerRow ? 'broker' : 'customer';

        const resolvedName = resolveUserDisplayName(
          localOverride?.name || authUser.user_metadata?.full_name || authUser.user_metadata?.name,
          localOverride?.email || authUser.email
        );
        setUser({
          id: authUser.id,
          fullName: resolvedName,
          email: localOverride?.email || authUser.email || '',
          phone: localOverride?.phone || authUser.user_metadata?.phone || '',
          addressLine1: authUser.user_metadata?.address_line_1 || '',
          addressLine2: authUser.user_metadata?.address_line_2 || '',
          city: authUser.user_metadata?.city || '',
          state: authUser.user_metadata?.state || '',
          pincode: authUser.user_metadata?.pincode || '',
          landmark: authUser.user_metadata?.landmark || '',
          address: authUser.user_metadata?.address || '',
          avatar: localOverride?.avatar || authUser.user_metadata?.avatar_url || null,
          role: detectedRole,
        });
      }
    } catch (err) {
      console.error('Exception fetching profile:', err);
    }
  };

  const updateUserLocal = (data: Partial<User>) => {
    setUser((prev) => (prev ? { ...prev, ...data } : null));
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
            if (event === 'SIGNED_IN') {
              const googleRole = localStorage.getItem(GOOGLE_ROLE_KEY) as 'customer' | 'broker' | null;
              const phoneRole = localStorage.getItem(PHONE_ROLE_KEY) as 'customer' | 'broker' | null;
              const userMetaRole = session.user.user_metadata?.role as 'customer' | 'broker' | undefined;
              const storedRole = googleRole || phoneRole || userMetaRole || 'customer';

              await provisionProfile(session.user, storedRole);
              localStorage.removeItem(GOOGLE_ROLE_KEY);
              localStorage.removeItem(PHONE_ROLE_KEY);
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

  const signUp = async (
    email: string,
    password?: string,
    role: 'customer' | 'broker' = 'customer',
    fullName?: string
  ) => {
    if (password) {
      localStorage.setItem(GOOGLE_ROLE_KEY, role);
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            role,
            full_name: fullName,
          },
        },
      });

      if (!error && data?.user) {
        await provisionProfile(data.user, role);
        await fetchUserProfile(data.user);
      }
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

  const PHONE_ROLE_KEY = 'brokerhub_phone_role';

  const sendPhoneOtp = async (phone: string, role: 'customer' | 'broker') => {
    localStorage.setItem(PHONE_ROLE_KEY, role);
    const { error } = await supabase.auth.signInWithOtp({ phone });
    return { error };
  };

  const verifyPhoneOtp = async (phone: string, token: string) => {
    const { data, error } = await supabase.auth.verifyOtp({ phone, token, type: 'sms' });
    if (!error && data.user) {
      // Check if user profile exists in public.users
      const { data: existingProfile } = await supabase
        .from('users')
        .select('id')
        .eq('id', data.user.id)
        .single();

      if (!existingProfile) {
        // Create profile for first-time phone login
        const savedRole = (localStorage.getItem(PHONE_ROLE_KEY) as 'customer' | 'broker') || 'customer';
        localStorage.removeItem(PHONE_ROLE_KEY);
        await supabase.from('users').insert({
          id: data.user.id,
          email: data.user.email || `${phone.replace('+', '')}@phone.brokerhub.com`,
          full_name: `User ${phone.slice(-4)}`,
          phone: phone,
          role: savedRole,
          status: 'active',
        });
      }
    }
    return { error };
  };

  const signOut = async () => {
    // scope: 'global' signs out from ALL sessions on all devices
    await supabase.auth.signOut({ scope: 'global' });
    setUser(null);
    // Clear any persisted state from localStorage
    localStorage.removeItem('brokerhub_google_role');
  };

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signUp, signInWithGoogle, sendPhoneOtp, verifyPhoneOtp, signOut, refreshUser, updateUserLocal }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
