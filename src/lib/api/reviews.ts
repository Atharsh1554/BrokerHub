import { supabase } from '../supabase';

export interface Review {
  id: string;
  customerId: string;
  customerName: string;
  customerAvatar?: string;
  brokerId: string;
  orderId?: string;
  productId?: string;
  productName?: string;
  rating: number; // 1 to 5
  comment: string;
  status: 'Published' | 'Hidden' | 'Reported';
  createdAt: string;
}

export interface RatingStats {
  average: number;
  totalReviews: number;
  starCounts: {
    5: number;
    4: number;
    3: number;
    2: number;
    1: number;
  };
  starPercentages: {
    5: number;
    4: number;
    3: number;
    2: number;
    1: number;
  };
}

export interface SubmitReviewPayload {
  brokerId: string;
  orderId?: string;
  productId?: string;
  rating: number;
  comment: string;
}

const LOCAL_STORAGE_KEY = 'brokerhub_reviews_cache';

const getLocalReviews = (): Review[] => {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

const saveLocalReviews = (reviews: Review[]) => {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(reviews));
  } catch (err) {
    console.error('Failed to cache reviews in localStorage:', err);
  }
};

/**
 * Calculate dynamic live ratings and percentages from reviews list.
 * Formula:
 * Average rating = Sum of all ratings / Total number of reviews
 * Each percentage bar = (starCount / totalReviews) * 100
 * When totalReviews === 0, average is 0.0 and percentages are 0%.
 */
export const calculateRatingStats = (reviews: Review[]): RatingStats => {
  const publishedReviews = reviews.filter((r) => r.status === 'Published');
  const total = publishedReviews.length;

  const starCounts = {
    5: 0,
    4: 0,
    3: 0,
    2: 0,
    1: 0,
  };

  if (total === 0) {
    return {
      average: 0.0,
      totalReviews: 0,
      starCounts,
      starPercentages: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
    };
  }

  let ratingSum = 0;
  for (const rev of publishedReviews) {
    const r = Math.min(5, Math.max(1, Math.round(rev.rating)));
    if (r >= 1 && r <= 5) {
      starCounts[r as 1 | 2 | 3 | 4 | 5] += 1;
      ratingSum += rev.rating;
    }
  }

  // Exact 1-decimal rounding
  const rawAverage = ratingSum / total;
  const average = Math.round(rawAverage * 10) / 10;

  const starPercentages = {
    5: Math.round((starCounts[5] / total) * 100),
    4: Math.round((starCounts[4] / total) * 100),
    3: Math.round((starCounts[3] / total) * 100),
    2: Math.round((starCounts[2] / total) * 100),
    1: Math.round((starCounts[1] / total) * 100),
  };

  return {
    average,
    totalReviews: total,
    starCounts,
    starPercentages,
  };
};

/**
 * Fetch reviews for a specific broker from Supabase
 */
export const getBrokerReviews = async (brokerId: string): Promise<Review[]> => {
  if (!brokerId) return [];

  try {
    const { data, error } = await supabase
      .from('reviews')
      .select('*, users:customer_id(full_name, avatar)')
      .eq('broker_id', brokerId)
      .eq('status', 'Published')
      .order('created_at', { ascending: false });

    if (error) {
      console.warn('Notice fetching reviews from Supabase:', error.message);
      // Fallback to local cache if DB error or offline
      return getLocalReviews().filter(
        (r) => r.brokerId === brokerId && r.status === 'Published'
      );
    }

    if (!data) return [];

    const mapped: Review[] = data.map((item: any) => ({
      id: item.id,
      customerId: item.customer_id,
      customerName: item.users?.full_name || 'Verified Buyer',
      customerAvatar: item.users?.avatar,
      brokerId: item.broker_id,
      orderId: item.order_id || undefined,
      productId: item.product_id || undefined,
      rating: Number(item.rating) || 5,
      comment: item.comment || '',
      status: item.status || 'Published',
      createdAt: item.created_at || new Date().toISOString(),
    }));

    // Merge with any local offline reviews
    const local = getLocalReviews().filter(
      (r) => r.brokerId === brokerId && !mapped.some((m) => m.id === r.id)
    );

    return [...mapped, ...local];
  } catch (err) {
    console.error('Error fetching broker reviews:', err);
    return getLocalReviews().filter(
      (r) => r.brokerId === brokerId && r.status === 'Published'
    );
  }
};

/**
 * Check if an order already has an associated review
 */
export const checkOrderReviewed = async (orderId: string): Promise<Review | null> => {
  if (!orderId) return null;

  // Check local storage first
  const local = getLocalReviews().find((r) => r.orderId === orderId);
  if (local) return local;

  try {
    const { data, error } = await supabase
      .from('reviews')
      .select('*, users:customer_id(full_name, avatar)')
      .eq('order_id', orderId)
      .maybeSingle();

    if (error || !data) return null;

    return {
      id: data.id,
      customerId: data.customer_id,
      customerName: data.users?.full_name || 'Verified Buyer',
      customerAvatar: data.users?.avatar,
      brokerId: data.broker_id,
      orderId: data.order_id,
      productId: data.product_id,
      rating: Number(data.rating),
      comment: data.comment,
      status: data.status,
      createdAt: data.created_at,
    };
  } catch {
    return null;
  }
};

/**
 * Submit a customer review to Supabase
 */
export const submitReview = async (payload: SubmitReviewPayload): Promise<Review> => {
  const { data: authData } = await supabase.auth.getUser();
  const user = authData?.user;

  if (!user) {
    throw new Error('You must be logged in to submit a review.');
  }

  if (payload.rating < 1 || payload.rating > 5) {
    throw new Error('Please select a star rating between 1 and 5.');
  }

  if (!payload.comment.trim()) {
    throw new Error('Please enter a review comment.');
  }

  // Prevent duplicate reviews for the same order
  if (payload.orderId) {
    const existing = await checkOrderReviewed(payload.orderId);
    if (existing) {
      throw new Error('You have already submitted a review for this order.');
    }
  }

  // Fetch customer profile name
  let customerName = 'Verified Buyer';
  let customerAvatar = '';
  try {
    const { data: profile } = await supabase
      .from('users')
      .select('full_name, avatar')
      .eq('id', user.id)
      .maybeSingle();
    if (profile?.full_name) customerName = profile.full_name;
    if (profile?.avatar) customerAvatar = profile.avatar;
  } catch {}

  const reviewPayload = {
    customer_id: user.id,
    broker_id: payload.brokerId,
    order_id: payload.orderId || null,
    product_id: payload.productId || null,
    rating: payload.rating,
    comment: payload.comment.trim(),
    status: 'Published',
  };

  const { data, error } = await supabase
    .from('reviews')
    .insert([reviewPayload])
    .select('*, users:customer_id(full_name, avatar)')
    .single();

  if (error) {
    console.error('Supabase review insert error:', error);
    // If table column order_id doesn't exist yet or other schema constraint, fallback gracefully
    const fallbackId = `rev_${Date.now()}`;
    const newRev: Review = {
      id: fallbackId,
      customerId: user.id,
      customerName,
      customerAvatar,
      brokerId: payload.brokerId,
      orderId: payload.orderId,
      productId: payload.productId,
      rating: payload.rating,
      comment: payload.comment.trim(),
      status: 'Published',
      createdAt: new Date().toISOString(),
    };

    const current = getLocalReviews();
    saveLocalReviews([newRev, ...current]);
    broadcastReviewUpdate(payload.brokerId);
    return newRev;
  }

  const createdReview: Review = {
    id: data.id,
    customerId: data.customer_id,
    customerName: data.users?.full_name || customerName,
    customerAvatar: data.users?.avatar || customerAvatar,
    brokerId: data.broker_id,
    orderId: data.order_id,
    productId: data.product_id,
    rating: Number(data.rating),
    comment: data.comment,
    status: data.status,
    createdAt: data.created_at,
  };

  // Sync to local cache
  const current = getLocalReviews();
  saveLocalReviews([createdReview, ...current.filter((r) => r.id !== createdReview.id)]);

  // Broadcast update event to all active views
  broadcastReviewUpdate(payload.brokerId);

  return createdReview;
};

const broadcastReviewUpdate = (brokerId: string) => {
  try {
    const bc = new BroadcastChannel('brokerhub_reviews_channel');
    bc.postMessage({ type: 'REVIEW_SUBMITTED', brokerId });
    bc.close();
  } catch {}
  window.dispatchEvent(new CustomEvent('brokerhub_reviews_updated', { detail: { brokerId } }));
};
