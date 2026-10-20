import { supabase } from '../supabase';

export interface MarketplaceStats {
  sellersCount: number;
  customersCount: number;
  lastUpdated: string;
}

/**
 * Fetches accurate, aggregate statistics directly from the Supabase database.
 * 
 * Strict Privacy & RLS Compliance:
 * - Uses `head: true` with `count: 'exact'` so NO private rows, personal names,
 *   emails, passwords, or profile records are downloaded to the client.
 * - Only counts active registered accounts according to role.
 * - Never returns fake or fallback mock counts if the query fails.
 */
export async function getLiveMarketplaceStats(): Promise<{
  data: MarketplaceStats | null;
  error: string | null;
}> {
  try {
    // 1. Try secure database function RPC first if configured
    try {
      const { data: rpcData, error: rpcErr } = await supabase.rpc('get_marketplace_stats');
      if (!rpcErr && rpcData && typeof rpcData.sellers_count === 'number') {
        return {
          data: {
            sellersCount: rpcData.sellers_count,
            customersCount: rpcData.customers_count ?? 0,
            lastUpdated: rpcData.updated_at || new Date().toISOString(),
          },
          error: null,
        };
      }
    } catch {
      // RPC not yet deployed or error; fallback directly to count queries below
    }

    // 2. Direct aggregate count queries via Supabase client (HEAD only, zero row data transferred)
    const sellerPromise = supabase
      .from('users')
      .select('*', { count: 'exact', head: true })
      .eq('role', 'broker')
      .eq('status', 'active');

    const customerPromise = supabase
      .from('users')
      .select('*', { count: 'exact', head: true })
      .eq('role', 'customer')
      .eq('status', 'active');

    const [sellerRes, customerRes] = await Promise.all([sellerPromise, customerPromise]);

    if (sellerRes.error) {
      console.error('Error fetching seller count from Supabase:', sellerRes.error.message);
      return { data: null, error: sellerRes.error.message };
    }

    if (customerRes.error) {
      console.error('Error fetching customer count from Supabase:', customerRes.error.message);
      return { data: null, error: customerRes.error.message };
    }

    const sellersCount = sellerRes.count ?? 0;
    const customersCount = customerRes.count ?? 0;

    return {
      data: {
        sellersCount,
        customersCount,
        lastUpdated: new Date().toISOString(),
      },
      error: null,
    };
  } catch (err: any) {
    console.error('Exception fetching live marketplace stats:', err);
    return {
      data: null,
      error: err?.message || 'Failed to retrieve marketplace statistics',
    };
  }
}
