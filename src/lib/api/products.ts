import { supabase } from '../supabase';
import type { Product } from '../../types';

export const getProducts = async (): Promise<Product[]> => {
  const { data, error } = await supabase
    .from('products')
    .select('*');
    
  if (error) {
    console.error('Error fetching products:', error);
    return [];
  }
  
  return data.map((p: any) => ({
    id: p.id,
    name: p.name,
    price: p.price,
    image: p.image,
    category: p.category,
    stock: p.stock,
    status: p.status,
    description: p.description,
  }));
};
