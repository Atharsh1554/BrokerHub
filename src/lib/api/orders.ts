import { supabase } from '../supabase';
import type { Order } from '../../types';

export const getOrders = async (userId: string, role: 'customer' | 'broker'): Promise<Order[]> => {
  // Simplification: In a real app we would query based on role and link tables
  // Currently orders are customer-centric in our schema
  let query = supabase.from('orders').select('*, order_items(*)');
  
  if (role === 'customer') {
    query = query.eq('customer_id', userId);
  }
  
  const { data, error } = await query;
    
  if (error) {
    console.error('Error fetching orders:', error);
    return [];
  }
  
  return data.map((o: any) => ({
    id: o.id,
    customerId: o.customer_id,
    customerName: o.customer_name,
    totalAmount: o.total_amount,
    date: o.date,
    status: o.status,
    items: o.order_items?.map((i: any) => ({
      productName: i.product_name,
      quantity: i.quantity,
      unitPrice: i.unit_price,
    })) || [],
  }));
};
