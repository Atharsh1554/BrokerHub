import { supabase } from '../supabase';
import type { Broker } from '../../types';

const mapBroker = (b: any): Broker => ({
  id: b.id,
  name: b.name || b.users?.full_name || 'Unknown Broker',
  specialty: b.specialty || '',
  company: b.company || '',
  avatar: b.users?.avatar || b.avatar || undefined,
  location: b.location || undefined,
  status: b.status || 'Under Review',
  rating: b.rating ?? 0,
  reviewCount: b.review_count ?? 0,
  description: b.description || '',
});

export const getBrokers = async (): Promise<Broker[]> => {
  const { data, error } = await supabase
    .from('brokers')
    .select('*, users(full_name, avatar)');

  if (error) {
    console.error('Error fetching brokers:', error);
    return [];
  }

  return data.map(mapBroker);
};

export const getBrokerById = async (id: string): Promise<Broker | null> => {
  const { data, error } = await supabase
    .from('brokers')
    .select('*, users(full_name, avatar)')
    .eq('id', id)
    .single();

  if (error || !data) {
    console.error('Error fetching broker:', error);
    return null;
  }

  return mapBroker(data);
};
