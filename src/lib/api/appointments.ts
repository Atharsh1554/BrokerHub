import { supabase } from '../supabase';
import type { Appointment } from '../../types';

export const getAppointments = async (userId: string, role: 'customer' | 'broker'): Promise<Appointment[]> => {
  // appointments.broker_id → brokers(id) which shares PK with users(id)
  // Join brokers for name, and users (via broker_id = users.id) for avatar
  let query = supabase
    .from('appointments')
    .select('*, brokers!appointments_broker_id_fkey(name), users!appointments_broker_id_fkey(avatar)');

  if (role === 'customer') {
    query = query.eq('customer_id', userId);
  } else if (role === 'broker') {
    query = query.eq('broker_id', userId);
  }

  const { data, error } = await query;

  if (error) {
    // Fallback: fetch without joins if the join hint fails
    console.warn('Appointments join failed, retrying without join:', error.message);
    return getAppointmentsFallback(userId, role);
  }

  return data.map((a: any) => ({
    id: a.id,
    brokerName: a.brokers?.name || 'Unknown Broker',
    brokerAvatar: a.users?.avatar ?? null,
    date: a.date,
    time: a.time,
    type: a.type,
    status: a.status,
    notes: a.notes,
  }));
};

/** Fallback: fetch appointments without relational join, then enrich broker name separately */
const getAppointmentsFallback = async (userId: string, role: 'customer' | 'broker'): Promise<Appointment[]> => {
  let q = supabase.from('appointments').select('*');

  if (role === 'customer') {
    q = q.eq('customer_id', userId);
  } else if (role === 'broker') {
    q = q.eq('broker_id', userId);
  }

  const { data, error } = await q;

  if (error) {
    console.error('Error fetching appointments:', error);
    return [];
  }

  if (!data || data.length === 0) return [];

  // Collect unique broker IDs and fetch their details from users table
  const brokerIds = [...new Set(data.map((a: any) => a.broker_id).filter(Boolean))];
  let brokerMap: Record<string, { name: string; avatar: string | null }> = {};

  if (brokerIds.length > 0) {
    const { data: brokerRows } = await supabase
      .from('brokers')
      .select('id, name')
      .in('id', brokerIds);

    const { data: userRows } = await supabase
      .from('users')
      .select('id, avatar')
      .in('id', brokerIds);

    brokerIds.forEach((bid) => {
      const broker = brokerRows?.find((b: any) => b.id === bid);
      const user = userRows?.find((u: any) => u.id === bid);
      brokerMap[bid as string] = {
        name: broker?.name || 'Unknown Broker',
        avatar: user?.avatar ?? null,
      };
    });
  }

  return data.map((a: any) => ({
    id: a.id,
    brokerName: brokerMap[a.broker_id]?.name || 'Unknown Broker',
    brokerAvatar: brokerMap[a.broker_id]?.avatar ?? null,
    date: a.date,
    time: a.time,
    type: a.type,
    status: a.status,
    notes: a.notes,
  }));
};
