import { supabase } from '../supabase';
import type { Broker } from '../../types';

export const getBrokers = async (): Promise<Broker[]> => {
  const { data, error } = await supabase
    .from('brokers')
    .select('*, users(full_name, avatar)');
    
  if (error) {
    console.error('Error fetching brokers:', error);
    return [];
  }
  
  return data.map((b: any) => ({
    id: b.id,
    name: b.name || b.users?.full_name,
    specialty: b.specialty,
    company: b.company,
    avatar: b.users?.avatar,
    status: b.status,
    rating: b.rating,
    reviewCount: b.review_count,
    description: b.description,
  }));
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
  
  return {
    id: data.id,
    name: data.name || data.users?.full_name,
    specialty: data.specialty,
    company: data.company,
    avatar: data.users?.avatar,
    status: data.status,
    rating: data.rating,
    reviewCount: data.review_count,
    description: data.description,
  };
};
