import { supabase } from '../supabase';
import type { Product } from '../../types';

const mapProduct = (p: any): Product => ({
  id: p.id,
  name: p.name,
  price: p.price,
  image: p.image || '',
  images: p.images || [],
  category: p.category || 'General',
  stock: p.stock ?? 0,
  status: p.status || (p.stock === 0 ? 'Out of Stock' : p.stock < 10 ? 'Low Stock' : 'In Stock'),
  description: p.description || '',
  brokerId: p.broker_id || p.brokerId || undefined,
  brokerName: p.broker_name || p.brokerName || undefined,
  rating: p.rating ?? 4.8,
  reviewCount: p.review_count ?? 0,
  specifications: p.specifications || {},
  isActive: p.is_active ?? true,
  createdAt: p.created_at,
  updatedAt: p.updated_at,
});

/**
 * Fetch ONLY products belonging to the specified broker from the database.
 * Used for the private Broker "My Products" page.
 * Strictly queries `WHERE broker_id = brokerId`.
 */
export const getBrokerProducts = async (brokerId: string): Promise<Product[]> => {
  if (!brokerId) return [];

  let dbProducts: Product[] = [];
  try {
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(brokerId);
    
    if (isUuid) {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('broker_id', brokerId)
        .order('created_at', { ascending: false });

      if (!error && data) {
        dbProducts = data.map(mapProduct);
      } else if (error) {
        console.warn('Error querying broker products from Supabase:', error.message);
      }
    }
  } catch (err) {
    console.error('Exception fetching broker products:', err);
  }

  // Load custom products stored specifically for THIS broker ID in localStorage
  let brokerLocalProducts: Product[] = [];
  try {
    const savedCustom = localStorage.getItem(`brokerhub_custom_products_${brokerId}`);
    if (savedCustom) {
      brokerLocalProducts = JSON.parse(savedCustom);
    }
  } catch {
    // ignore
  }

  // Combine DB products & broker-isolated local products
  const combined = [...dbProducts];
  for (const bp of brokerLocalProducts) {
    if (!combined.some((p) => p.id === bp.id)) {
      combined.push(bp);
    }
  }

  // Apply stored product overrides for this broker
  let overrides: Record<string, Partial<Product>> = {};
  try {
    const savedOverrides = localStorage.getItem(`brokerhub_product_overrides_${brokerId}`);
    if (savedOverrides) {
      overrides = JSON.parse(savedOverrides);
    }
  } catch {
    // ignore
  }

  // Exclude deleted product IDs for this broker
  let deletedIds: string[] = [];
  try {
    const savedDeleted = localStorage.getItem(`brokerhub_deleted_products_${brokerId}`);
    if (savedDeleted) {
      deletedIds = JSON.parse(savedDeleted);
    }
  } catch {
    // ignore
  }

  return combined
    .map((p) => (overrides[p.id] ? { ...p, ...overrides[p.id] } : p))
    .filter((p) => !deletedIds.includes(p.id) && p.brokerId === brokerId);
};

/**
 * Fetch marketplace products visible to customers (all published/active products).
 */
export const getProducts = async (includeInactive: boolean = false): Promise<Product[]> => {
  let dbProducts: Product[] = [];
  try {
    // Build base query
    let query = supabase
      .from('products')
      .select('*')
      .order('created_at', { ascending: false });

    // IMPORTANT: must reassign — Supabase builder is immutable/chainable
    // Also treat NULL is_active as active (older products may not have the field set)
    if (!includeInactive) {
      query = query.or('is_active.eq.true,is_active.is.null');
    }

    const { data, error } = await query;
    if (!error && data) {
      dbProducts = data.map(mapProduct);
    } else if (error) {
      console.error('Error fetching marketplace products from DB:', error.message);
    }
  } catch (err) {
    console.error('Error fetching marketplace products from DB:', err);
  }

  // Load all broker custom products for the public marketplace
  let allCustomProducts: Product[] = [];
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('brokerhub_custom_products_')) {
        const raw = localStorage.getItem(key);
        if (raw) {
          const list: Product[] = JSON.parse(raw);
          allCustomProducts.push(...list);
        }
      }
    }
  } catch {
    // ignore
  }

  // Combine DB products and broker custom products for the public marketplace
  const combined = [...allCustomProducts, ...dbProducts];
  return combined.filter((p) => includeInactive || p.isActive !== false);
};

export const getProductById = async (id: string): Promise<Product | null> => {
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
  if (isUuid) {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('id', id)
        .single();

      if (!error && data) {
        return mapProduct(data);
      }
    } catch {
      // fallback
    }
  }

  const all = await getProducts(true);
  return all.find((p) => p.id === id) || null;
};

export const getProductsByBrokerId = async (brokerId: string): Promise<Product[]> => {
  if (!brokerId) return [];
  const brokerOnly = await getBrokerProducts(brokerId);
  if (brokerOnly.length > 0) {
    return brokerOnly;
  }

  const all = await getProducts();
  return all.filter((p) => p.brokerId === brokerId);
};

/**
 * Creates a product with automatic broker_id assignment.
 */
export const createBrokerProduct = async (
  prodData: Omit<Product, 'id'>,
  brokerId: string,
  brokerName?: string
): Promise<Product> => {
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(brokerId);
  const tempId = `p_${Date.now()}`;

  let newProd: Product = {
    ...prodData,
    id: tempId,
    brokerId: brokerId,
    brokerName: brokerName || 'Broker',
    rating: 4.8,
    reviewCount: 1,
    isActive: true,
  };

  if (isUuid) {
    try {
      const { data, error } = await supabase
        .from('products')
        .insert([{
          name: prodData.name,
          price: prodData.price,
          image: prodData.image,
          category: prodData.category,
          stock: prodData.stock,
          status: prodData.status,
          description: prodData.description,
          broker_id: brokerId,
          is_active: true,
        }])
        .select()
        .single();

      if (!error && data) {
        newProd = mapProduct(data);
      }
    } catch (err) {
      console.warn('Supabase product insert notice:', err);
    }
  }

  // Persist locally under this broker's specific storage key
  try {
    const key = `brokerhub_custom_products_${brokerId}`;
    const customProds: Product[] = JSON.parse(localStorage.getItem(key) || '[]');
    const filtered = customProds.filter((p) => p.id !== newProd.id);
    localStorage.setItem(key, JSON.stringify([newProd, ...filtered]));
  } catch {}

  return newProd;
};

/**
 * Updates a product, enforcing broker ownership check in the database query.
 */
export const updateBrokerProduct = async (
  id: string,
  updatedFields: Partial<Product>,
  brokerId: string
): Promise<boolean> => {
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
  const isBrokerUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(brokerId);

  if (isUuid && isBrokerUuid) {
    try {
      const payload: any = {
        updated_at: new Date().toISOString(),
      };
      if (updatedFields.name !== undefined) payload.name = updatedFields.name;
      if (updatedFields.price !== undefined) payload.price = updatedFields.price;
      if (updatedFields.image !== undefined) payload.image = updatedFields.image;
      if (updatedFields.category !== undefined) payload.category = updatedFields.category;
      if (updatedFields.stock !== undefined) payload.stock = updatedFields.stock;
      if (updatedFields.status !== undefined) payload.status = updatedFields.status;
      if (updatedFields.description !== undefined) payload.description = updatedFields.description;
      if (updatedFields.isActive !== undefined) payload.is_active = updatedFields.isActive;

      await supabase
        .from('products')
        .update(payload)
        .eq('id', id)
        .eq('broker_id', brokerId);
    } catch (err) {
      console.warn('Supabase update product error:', err);
    }
  }

  // Save override to broker-specific storage
  try {
    const key = `brokerhub_product_overrides_${brokerId}`;
    const overrides: Record<string, Partial<Product>> = JSON.parse(localStorage.getItem(key) || '{}');
    overrides[id] = { ...(overrides[id] || {}), ...updatedFields };
    localStorage.setItem(key, JSON.stringify(overrides));

    const customKey = `brokerhub_custom_products_${brokerId}`;
    const customProds: Product[] = JSON.parse(localStorage.getItem(customKey) || '[]');
    const updatedCustom = customProds.map((p) => (p.id === id ? { ...p, ...updatedFields } : p));
    localStorage.setItem(customKey, JSON.stringify(updatedCustom));
  } catch {}

  return true;
};

/**
 * Deletes a product, enforcing broker ownership in the database query.
 */
export const deleteBrokerProduct = async (id: string, brokerId: string): Promise<boolean> => {
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
  const isBrokerUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(brokerId);

  if (isUuid && isBrokerUuid) {
    try {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', id)
        .eq('broker_id', brokerId);

      if (error) {
        console.error('Error deleting product from Supabase:', error);
      }
    } catch {}
  }

  // Record deleted ID in broker-specific storage
  try {
    const delKey = `brokerhub_deleted_products_${brokerId}`;
    const deleted: string[] = JSON.parse(localStorage.getItem(delKey) || '[]');
    if (!deleted.includes(id)) {
      localStorage.setItem(delKey, JSON.stringify([...deleted, id]));
    }

    const customKey = `brokerhub_custom_products_${brokerId}`;
    const customProds: Product[] = JSON.parse(localStorage.getItem(customKey) || '[]');
    const updatedCustom = customProds.filter((p) => p.id !== id);
    localStorage.setItem(customKey, JSON.stringify(updatedCustom));
  } catch {}

  return true;
};
