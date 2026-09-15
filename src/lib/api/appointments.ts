import { supabase } from '../supabase';
import type { Appointment } from '../../types';

export const getAppointments = async (userId: string, role: 'customer' | 'broker'): Promise<Appointment[]> => {
  let query = supabase.from('appointments').select('*, brokers(name, users(avatar))');
  
  if (role === 'customer') {
    query = query.eq('customer_id', userId);
  } else if (role === 'broker') {
    query = query.eq('broker_id', userId);
  }
  
  const { data, error } = await query;
    
  if (error) {
    console.error('Error fetching appointments:', error);
    return [];
  }
  
  return data.map((a: any) => ({
    id: a.id,
    brokerName: a.brokers?.name || 'Unknown Broker',
    brokerAvatar: a.brokers?.users?.avatar,
    date: a.date,
    time: a.time,
    type: a.type,
    status: a.status,
    notes: a.notes,
  }));
};
