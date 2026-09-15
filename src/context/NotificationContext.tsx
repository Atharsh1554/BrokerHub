import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import type { BrokerNotification, NotificationStatus, CustomerProfile } from '../types';
import { INITIAL_NOTIFICATIONS, MOCK_CUSTOMER_PROFILES } from '../lib/seedNotifications';
import { useAuth } from './AuthContext';

interface NotificationContextType {
  notifications: BrokerNotification[];
  unreadCount: number;
  loading: boolean;
  isLiveSupabase: boolean;
  markRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  updateStatus: (id: string, status: NotificationStatus) => Promise<void>;
  deleteNotification: (id: string) => Promise<void>;
  getCustomerProfile: (customerId: string) => CustomerProfile | null;
  refreshNotifications: () => Promise<void>;
  createNotification: (notification: Omit<BrokerNotification, 'id' | 'created_at'>) => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

const LOCAL_STORAGE_KEY = 'brokerhub_notifications_v1';

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<BrokerNotification[]>(() => {
    try {
      const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch {
      // fallback
    }
    return INITIAL_NOTIFICATIONS;
  });
  const [loading, setLoading] = useState(false);

  // Sync to local storage
  useEffect(() => {
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(notifications));
    } catch {
      // ignore
    }
  }, [notifications]);

  // Load from Supabase if configured
  const fetchSupabaseNotifications = useCallback(async () => {
    if (!isSupabaseConfigured) return;

    try {
      setLoading(true);
      let query = supabase.from('broker_notifications').select('*');

      if (user) {
        query = query.or(`broker_id.eq.${user.id},customer_id.eq.${user.id}`);
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) {
        console.warn('Supabase fetch error:', error.message);
        return;
      }

      if (data && data.length > 0) {
        setNotifications(data as BrokerNotification[]);
      } else if (user && user.role === 'broker') {
        // Seed initial notifications into Supabase for this broker
        const seedPayload = INITIAL_NOTIFICATIONS.map(({ id: _, ...rest }) => ({
          ...rest,
          broker_id: user.id,
        }));
        const { data: inserted, error: seedErr } = await supabase
          .from('broker_notifications')
          .insert(seedPayload)
          .select();

        if (!seedErr && inserted) {
          setNotifications(inserted as BrokerNotification[]);
        }
      }
    } catch (err) {
      console.warn('Supabase connection error:', err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchSupabaseNotifications();

    if (isSupabaseConfigured) {
      // Subscribe to Supabase Realtime channel
      const channel = supabase
        .channel('broker_notifications_changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'broker_notifications',
          },
          (payload) => {
            const notif = (payload.new || payload.old) as BrokerNotification;
            if (user && notif && notif.broker_id !== user.id && notif.customer_id !== user.id) {
              return; // Filter out notifications not meant for current user
            }

            if (payload.eventType === 'INSERT') {
              const newNotif = payload.new as BrokerNotification;
              setNotifications((prev) => [newNotif, ...prev.filter((n) => n.id !== newNotif.id)]);
            } else if (payload.eventType === 'UPDATE') {
              const updated = payload.new as BrokerNotification;
              setNotifications((prev) => prev.map((n) => (n.id === updated.id ? updated : n)));
            } else if (payload.eventType === 'DELETE') {
              const deletedId = (payload.old as { id: string }).id;
              setNotifications((prev) => prev.filter((n) => n.id !== deletedId));
            }
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [fetchSupabaseNotifications, user]);

  const markRead = async (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
    );

    if (isSupabaseConfigured) {
      try {
        await supabase
          .from('broker_notifications')
          .update({ is_read: true })
          .eq('id', id);
      } catch (err) {
        console.warn('Failed to mark read in Supabase:', err);
      }
    }
  };

  const markAllAsRead = async () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));

    if (isSupabaseConfigured && user) {
      try {
        await supabase
          .from('broker_notifications')
          .update({ is_read: true })
          .or(`broker_id.eq.${user.id},customer_id.eq.${user.id}`);
      } catch (err) {
        console.warn('Failed to mark all read in Supabase:', err);
      }
    }
  };

  const updateStatus = async (id: string, status: NotificationStatus) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, status, is_read: true } : n))
    );

    if (isSupabaseConfigured) {
      try {
        await supabase
          .from('broker_notifications')
          .update({ status, is_read: true })
          .eq('id', id);
      } catch (err) {
        console.warn('Failed to update notification status in Supabase:', err);
      }
    }
  };

  const deleteNotification = async (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));

    if (isSupabaseConfigured) {
      try {
        await supabase
          .from('broker_notifications')
          .delete()
          .eq('id', id);
      } catch (err) {
        console.warn('Failed to delete notification in Supabase:', err);
      }
    }
  };

  const createNotification = async (
    notificationData: Omit<BrokerNotification, 'id' | 'created_at'>
  ) => {
    const newNotif: BrokerNotification = {
      ...notificationData,
      id: `local-${Date.now()}`,
      created_at: new Date().toISOString(),
    };

    setNotifications((prev) => [newNotif, ...prev]);

    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase
          .from('broker_notifications')
          .insert({
            ...notificationData,
            created_at: new Date().toISOString(),
          })
          .select()
          .single();

        if (!error && data) {
          setNotifications((prev) =>
            prev.map((n) => (n.id === newNotif.id ? (data as BrokerNotification) : n))
          );
        }
      } catch (err) {
        console.warn('Failed to insert notification in Supabase:', err);
      }
    }
  };

  const getCustomerProfile = (customerId: string): CustomerProfile | null => {
    if (MOCK_CUSTOMER_PROFILES[customerId]) {
      return MOCK_CUSTOMER_PROFILES[customerId];
    }
    // Return a synthesized profile if not in map
    return {
      id: customerId,
      fullName: customerId.replace('cust-', '').replace(/^\w/, (c) => c.toUpperCase()) || 'Customer',
      email: `${customerId}@example.com`,
      phone: '+1 (555) 000-1122',
      joinedDate: '2025',
      totalOrders: 1,
      totalSpent: 500,
      status: 'Active Customer',
    };
  };

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        loading,
        isLiveSupabase: isSupabaseConfigured,
        markRead,
        markAllAsRead,
        updateStatus,
        deleteNotification,
        getCustomerProfile,
        refreshNotifications: fetchSupabaseNotifications,
        createNotification,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};

