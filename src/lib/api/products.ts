import { supabase } from '../supabase';
import type { Product } from '../../types';
import { products as mockProducts } from '../../data/mockData';

const mapProduct = (p: any): Product => ({
  id: p.id,
  name: p.name,
  price: p.price,
  image: p.image || '',
  images: p.images || [],
  category: p.category || 'General',
  stock: p.stock ?? 0,
  status: p.status || 'In Stock',
  description: p.description || '',
  brokerId: p.broker_id || undefined,
  rating: p.rating ?? 0,
  reviewCount: p.review_count ?? 0,
  specifications: p.specifications || {},
  createdAt: p.created_at,
  updatedAt: p.updated_at,
});

export const getProducts = async (): Promise<Product[]> => {
  let dbProducts: Product[] = [];
  try {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error && data) {
      dbProducts = data.map(mapProduct);
    }
  } catch (err) {
    console.error('Error fetching products from DB:', err);
  }

  // Load custom products stored in localStorage
  let customProducts: Product[] = [];
  try {
    const savedCustom = localStorage.getItem('brokerhub_custom_products');
    if (savedCustom) {
      customProducts = JSON.parse(savedCustom);
    }
  } catch {
    // ignore
  }

  // Combine DB products, custom products, and mock products
  const combined = [...customProducts, ...dbProducts];
  for (const mp of mockProducts) {
    if (!combined.some((p) => p.id === mp.id)) {
      combined.push(mp);
    }
  }

  // Apply stored product overrides (combining broker & admin overrides)
  let overrides: Record<string, Partial<Product>> = {};
  try {
    const savedOverrides = localStorage.getItem('brokerhub_product_overrides');
    const savedAdminOverrides = localStorage.getItem('brokerhub_product_admin_overrides');
    const o1 = savedOverrides ? JSON.parse(savedOverrides) : {};
    const o2 = savedAdminOverrides ? JSON.parse(savedAdminOverrides) : {};
    overrides = { ...o1, ...o2 };
  } catch {
    // ignore
  }

  // Exclude deleted product IDs stored in localStorage
  let deletedIds: string[] = [];
  try {
    const savedDeleted = localStorage.getItem('brokerhub_deleted_products');
    if (savedDeleted) {
      deletedIds = JSON.parse(savedDeleted);
    }
  } catch {
    // ignore
  }

  const demoIds = ['p1', 'p2', 'p3', 'p4', 'p5', 'p6'];

  return combined
    .filter((p) => !deletedIds.includes(p.id) && !demoIds.includes(p.id))
    .map((p) => (overrides[p.id] ? { ...p, ...overrides[p.id] } : p));
};

export const getProductById = async (id: string): Promise<Product | null> => {
  const all = await getProducts();
  return all.find((p) => p.id === id) || null;
};

export const getProductsByBrokerId = async (brokerId: string): Promise<Product[]> => {
  const all = await getProducts();
  return all.filter((p) => p.brokerId === brokerId || p.brokerId === 'b1');
};

export const deleteProductFromDb = async (id: string): Promise<boolean> => {
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
  if (isUuid) {
    const { error } = await supabase.from('products').delete().eq('id', id);
    if (error) {
      console.error('Error deleting product from Supabase:', error);
    }
  }
  return true;
};
