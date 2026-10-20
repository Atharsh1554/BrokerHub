import { supabase } from '../supabase';
import type { Product } from '../../types';

export const mapProduct = (p: any): Product => {
  const primaryImage = p.image || (Array.isArray(p.images) && p.images[0]) || '';
  const imagesList = Array.isArray(p.images) && p.images.length > 0 
    ? p.images 
    : (primaryImage ? [primaryImage] : []);

  return {
    id: p.id,
    name: p.name || 'Untitled Product',
    price: Number(p.price) || 0,
    image: primaryImage,
    images: imagesList,
    category: p.category || 'General',
    stock: p.stock ?? 0,
    status: p.status || (p.stock === 0 ? 'Out of Stock' : p.stock < 10 ? 'Low Stock' : 'In Stock'),
    description: p.description || '',
    brokerId: p.broker_id || p.brokerId || undefined,
    brokerName: p.broker_name || p.brokerName || undefined,
    rating: (p.review_count ?? 0) > 0 ? (p.rating ?? 0) : 0,
    reviewCount: p.review_count ?? 0,
    specifications: p.specifications || {},
    isActive: p.is_active ?? true,
    createdAt: p.created_at,
    updatedAt: p.updated_at,
  };
};

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

  // Combine DB products & broker-isolated local products (deduplicated)
  const seenIds = new Set<string>();
  const combined: Product[] = [];

  for (const p of [...dbProducts, ...brokerLocalProducts]) {
    if (!seenIds.has(p.id)) {
      seenIds.add(p.id);
      combined.push(p);
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

  // Exclude deleted product IDs for this broker and global admin deleted IDs
  let deletedIds: string[] = [];
  try {
    const savedDeleted = localStorage.getItem(`brokerhub_deleted_products_${brokerId}`);
    if (savedDeleted) {
      deletedIds = JSON.parse(savedDeleted);
    }
    const globalDeleted: string[] = JSON.parse(localStorage.getItem('brokerhub_deleted_products') || '[]');
    deletedIds.push(...globalDeleted);
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

    // Treat NULL is_active as active (older products may not have the field set)
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

  // Load globally deleted product IDs (admin deletions)
  let globalDeleted: string[] = [];
  try {
    globalDeleted = JSON.parse(localStorage.getItem('brokerhub_deleted_products') || '[]');
  } catch {}

  // Combine DB products and broker custom products (deduplicated)
  const seenIds = new Set<string>();
  const combined: Product[] = [];

  for (const p of [...dbProducts, ...allCustomProducts]) {
    if (!seenIds.has(p.id)) {
      seenIds.add(p.id);
      combined.push(p);
    }
  }

  return combined
    .filter((p) => !globalDeleted.includes(p.id))
    .filter((p) => includeInactive || p.isActive !== false);
};

export const getProductById = async (id: string): Promise<Product | null> => {
  // Check if product was deleted by admin
  try {
    const globalDeleted: string[] = JSON.parse(localStorage.getItem('brokerhub_deleted_products') || '[]');
    if (globalDeleted.includes(id)) {
      return null;
    }
  } catch {}

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

/**
 * Fetch all published/active products for a broker's public profile or shareable shop page.
 */
export const getProductsByBrokerId = async (brokerId: string): Promise<Product[]> => {
  if (!brokerId) return [];

  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(brokerId);
  let dbProducts: Product[] = [];

  if (isUuid) {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('broker_id', brokerId)
        .or('is_active.eq.true,is_active.is.null')
        .order('created_at', { ascending: false });

      if (!error && data) {
        dbProducts = data.map(mapProduct);
      } else if (error) {
        console.warn('Error querying broker profile products from Supabase:', error.message);
      }
    } catch (err) {
      console.error('Exception fetching broker profile products:', err);
    }
  }

  // Load custom products stored specifically for this broker ID in localStorage
  let brokerLocalProducts: Product[] = [];
  try {
    const savedCustom = localStorage.getItem(`brokerhub_custom_products_${brokerId}`);
    if (savedCustom) {
      brokerLocalProducts = JSON.parse(savedCustom);
    }
  } catch {
    // ignore
  }

  // Exclude deleted product IDs
  let deletedIds: string[] = [];
  try {
    const brokerDel = JSON.parse(localStorage.getItem(`brokerhub_deleted_products_${brokerId}`) || '[]');
    const globalDel = JSON.parse(localStorage.getItem('brokerhub_deleted_products') || '[]');
    deletedIds = [...brokerDel, ...globalDel];
  } catch {}

  const seenIds = new Set<string>();
  const combined: Product[] = [];

  for (const p of [...dbProducts, ...brokerLocalProducts]) {
    if (!seenIds.has(p.id) && !deletedIds.includes(p.id) && p.isActive !== false) {
      seenIds.add(p.id);
      combined.push(p);
    }
  }

  if (combined.length > 0) {
    return combined;
  }

  // Fallback to searching all active marketplace products
  const all = await getProducts();
  return all.filter((p) => p.brokerId === brokerId && p.isActive !== false);
};

/**
 * Creates a product in Supabase with automatic broker_id assignment.
 * Resilient to database column schema differences (e.g. presence or absence of 'images' array column).
 */
export const createBrokerProduct = async (
  prodData: Omit<Product, 'id'>,
  brokerId: string,
  brokerName?: string
): Promise<Product> => {
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(brokerId);
  const tempId = `p_${Date.now()}`;

  const primaryImage = prodData.image || (prodData.images && prodData.images[0]) || '';
  const stockNum = typeof prodData.stock === 'number' ? prodData.stock : parseInt(String(prodData.stock)) || 0;
  const statusVal = prodData.status || (stockNum === 0 ? 'Out of Stock' : stockNum < 10 ? 'Low Stock' : 'In Stock');

  let newProd: Product = {
    ...prodData,
    id: tempId,
    image: primaryImage,
    images: prodData.images && prodData.images.length > 0 ? prodData.images : (primaryImage ? [primaryImage] : []),
    brokerId: brokerId,
    brokerName: brokerName || 'Broker',
    stock: stockNum,
    status: statusVal,
    rating: 0,
    reviewCount: 0,
    isActive: prodData.isActive !== false,
  };

  if (isUuid) {
    try {
      const basePayload: any = {
        name: prodData.name,
        price: Number(prodData.price) || 0,
        image: primaryImage,
        category: prodData.category || 'General',
        stock: stockNum,
        status: statusVal,
        description: prodData.description || '',
        broker_id: brokerId,
        is_active: prodData.isActive !== false,
      };

      // Try inserting with 'images' column if images array is provided
      let insertPayload = { ...basePayload };
      if (prodData.images && prodData.images.length > 0) {
        insertPayload.images = prodData.images;
      }

      let { data, error } = await supabase
        .from('products')
        .insert([insertPayload])
        .select()
        .single();

      // If column 'images' does not exist (PostgreSQL error 42703), retry cleanly with basePayload
      if (error && error.code === '42703') {
        const retry = await supabase
          .from('products')
          .insert([basePayload])
          .select()
          .single();
        data = retry.data;
        error = retry.error;
      }

      if (!error && data) {
        newProd = mapProduct(data);
        if (!newProd.brokerName && brokerName) newProd.brokerName = brokerName;
        if ((!newProd.images || newProd.images.length === 0) && prodData.images?.length) {
          newProd.images = prodData.images;
        }
      } else if (error) {
        console.error('Supabase product insert error:', error.message, error.details || error);
      }
    } catch (err) {
      console.error('Supabase product insert exception:', err);
    }
  }

  // Persist locally under this broker's specific storage key as reliable fallback/cache
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
      if (updatedFields.price !== undefined) payload.price = Number(updatedFields.price);
      if (updatedFields.image !== undefined) payload.image = updatedFields.image;
      if (updatedFields.category !== undefined) payload.category = updatedFields.category;
      if (updatedFields.stock !== undefined) payload.stock = Number(updatedFields.stock);
      if (updatedFields.status !== undefined) payload.status = updatedFields.status;
      if (updatedFields.description !== undefined) payload.description = updatedFields.description;
      if (updatedFields.isActive !== undefined) payload.is_active = updatedFields.isActive;

      // Try with images if provided
      let updatePayload = { ...payload };
      if (updatedFields.images !== undefined) {
        updatePayload.images = updatedFields.images;
      }

      let { error } = await supabase
        .from('products')
        .update(updatePayload)
        .eq('id', id)
        .eq('broker_id', brokerId);

      // If column 'images' does not exist in DB (code 42703), retry without images
      if (error && error.code === '42703') {
        const retry = await supabase
          .from('products')
          .update(payload)
          .eq('id', id)
          .eq('broker_id', brokerId);
        error = retry.error;
      }

      if (error) {
        console.error('Supabase product update error:', error.message);
      }
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
    } catch (err) {
      console.error('Exception deleting product from Supabase:', err);
    }
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

/**
 * Synchronizes any locally created products that failed to insert into Supabase
 * (e.g. products with temporary IDs starting with 'p_').
 */
export const syncUnsyncedBrokerProducts = async (brokerId: string, brokerName?: string): Promise<Product[]> => {
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(brokerId);
  if (!isUuid) return [];

  const key = `brokerhub_custom_products_${brokerId}`;
  let localProds: Product[] = [];
  try {
    const raw = localStorage.getItem(key);
    if (raw) localProds = JSON.parse(raw);
  } catch {
    return [];
  }

  const unsynced = localProds.filter((p) => p.id && p.id.startsWith('p_'));
  if (unsynced.length === 0) return localProds;

  const updatedList = [...localProds];
  let hasChanges = false;

  for (const p of unsynced) {
    try {
      const primaryImage = p.image || (p.images && p.images[0]) || '';
      const stockNum = typeof p.stock === 'number' ? p.stock : parseInt(String(p.stock)) || 0;
      const statusVal = p.status || (stockNum === 0 ? 'Out of Stock' : stockNum < 10 ? 'Low Stock' : 'In Stock');

      const basePayload: any = {
        name: p.name,
        price: Number(p.price) || 0,
        image: primaryImage,
        category: p.category || 'General',
        stock: stockNum,
        status: statusVal,
        description: p.description || '',
        broker_id: brokerId,
        is_active: p.isActive !== false,
      };

      let insertPayload = { ...basePayload };
      if (p.images && p.images.length > 0) {
        insertPayload.images = p.images;
      }

      let { data, error } = await supabase
        .from('products')
        .insert([insertPayload])
        .select()
        .single();

      if (error && error.code === '42703') {
        const retry = await supabase
          .from('products')
          .insert([basePayload])
          .select()
          .single();
        data = retry.data;
        error = retry.error;
      }

      if (!error && data) {
        const syncedProd = mapProduct(data);
        syncedProd.brokerName = brokerName || p.brokerName;
        syncedProd.images = p.images && p.images.length > 0 ? p.images : (primaryImage ? [primaryImage] : []);

        const idx = updatedList.findIndex((item) => item.id === p.id);
        if (idx >= 0) {
          updatedList[idx] = syncedProd;
          hasChanges = true;
        }
      } else if (error) {
        console.warn('Failed to sync product to Supabase:', p.name, error.message);
      }
    } catch (err) {
      console.warn('Exception syncing product to Supabase:', err);
    }
  }

  if (hasChanges) {
    try {
      localStorage.setItem(key, JSON.stringify(updatedList));
    } catch {}
  }

  return updatedList;
};

