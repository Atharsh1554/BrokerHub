import type { Product, Broker } from '../../types';
import type {
  RankingConfig,
  RankedProduct,
  RankingResult,
  ScoreBreakdown,
} from './types';

export const DEFAULT_RANKING_CONFIG: RankingConfig = {
  discoveryWeights: {
    relevance: 0.0,
    freshness: 0.45,
    quality: 0.35,
    stock: 0.20,
  },
  searchWeights: {
    relevance: 0.60,
    freshness: 0.20,
    quality: 0.15,
    stock: 0.05,
  },
  freshnessHalfLifeDays: 14,
  maxPerSellerPerWindow: 2,
  bayesianPriorMean: 4.0,
  bayesianConfidenceWeight: 3,
};

/**
 * Checks whether a product satisfies published/active and availability criteria.
 * Excludes soft-deleted, inactive, and mock products.
 */
export function isProductEligible(
  product: Product,
  deletedIds: string[] = []
): boolean {
  if (!product || !product.id) return false;
  if (product.isActive === false) return false;
  if (deletedIds.includes(product.id)) return false;

  // Guard against any sample/mock products flagged in data
  const anyProd = product as any;
  if (anyProd.isMock === true || anyProd.isSample === true) return false;

  return true;
}

/**
 * Computes a search relevance score in [0, 1].
 * Returns 1.0 when no search query is present (neutral discovery).
 * When search query is present, computes match strength across name, category, broker, and description.
 */
export function computeSearchRelevance(
  product: Product,
  query: string,
  brokerName?: string
): number {
  const q = query.trim().toLowerCase();
  if (!q) {
    return 1.0; // No query -> neutral
  }

  const name = (product.name || '').toLowerCase();
  const category = (product.category || '').toLowerCase();
  const description = (product.description || '').toLowerCase();
  const seller = (product.brokerName || brokerName || '').toLowerCase();

  // 1. Exact match on product title
  if (name === q) {
    return 1.0;
  }

  // 2. Exact phrase included in title
  if (name.includes(q)) {
    return 0.85;
  }

  // 3. Token-based analysis for multi-word queries
  const tokens = q.split(/\s+/).filter((t) => t.length > 1);
  if (tokens.length === 0) {
    return name.includes(q) ? 0.8 : 0;
  }

  let matchedTokensInName = 0;
  let matchedTokensInDesc = 0;
  let matchedTokensInCategory = 0;
  let matchedTokensInSeller = 0;

  for (const token of tokens) {
    if (name.includes(token)) matchedTokensInName++;
    if (category.includes(token)) matchedTokensInCategory++;
    if (seller.includes(token)) matchedTokensInSeller++;
    if (description.includes(token)) matchedTokensInDesc++;
  }

  const nameRatio = matchedTokensInName / tokens.length;
  const descRatio = matchedTokensInDesc / tokens.length;
  const categoryRatio = matchedTokensInCategory / tokens.length;
  const sellerRatio = matchedTokensInSeller / tokens.length;

  if (nameRatio === 1) {
    return 0.75;
  }

  let compositeScore = 0;
  if (nameRatio > 0) {
    compositeScore += nameRatio * 0.50;
  }
  if (categoryRatio > 0) {
    compositeScore += categoryRatio * 0.25;
  }
  if (sellerRatio > 0) {
    compositeScore += sellerRatio * 0.20;
  }
  if (descRatio > 0) {
    compositeScore += descRatio * 0.15;
  }

  return Math.min(1.0, Math.round(compositeScore * 100) / 100);
}

/**
 * Computes product freshness score in [0, 1] using exponential half-life decay.
 * Newly listed products receive a boost that gradually decays without permanently dominating.
 */
export function computeFreshnessScore(
  createdAt?: string,
  halfLifeDays: number = 14
): { score: number; isNew: boolean } {
  if (!createdAt) {
    // Neutral fallback for products without explicit creation timestamp
    return { score: 0.5, isNew: false };
  }

  const createdTime = Date.parse(createdAt);
  if (isNaN(createdTime)) {
    return { score: 0.5, isNew: false };
  }

  const now = Date.now();
  const ageMs = Math.max(0, now - createdTime);
  const ageDays = ageMs / (1000 * 60 * 60 * 24);

  // Smooth decay: 1 / (1 + (ageDays / halfLife)^1.5)
  const score = 1 / (1 + Math.pow(ageDays / Math.max(1, halfLifeDays), 1.5));
  const isNew = ageDays <= 7;

  return {
    score: Math.min(1.0, Math.max(0.01, Math.round(score * 1000) / 1000)),
    isNew,
  };
}

/**
 * Computes quality score in [0, 1] using Bayesian damped average.
 * Avoids giving an unfair advantage to products with only a single 5-star review.
 * If ratings are unavailable, returns neutral 0.50 baseline without inventing fake values.
 */
export function computeQualityScore(
  rating?: number,
  reviewCount?: number,
  priorMean: number = 4.0,
  confidenceWeight: number = 3
): { score: number; isTopRated: boolean } {
  const count = reviewCount ?? 0;
  const rawRating = rating ?? 0;

  if (count <= 0 || rawRating <= 0) {
    // Skip factor cleanly with neutral baseline
    return { score: 0.50, isTopRated: false };
  }

  // Bayesian damped formula: (C * m + v * r) / (C + v)
  const dampedRating =
    (confidenceWeight * priorMean + count * rawRating) /
    (confidenceWeight + count);

  // Normalize from [1, 5] range to [0, 1]
  const normalized = (dampedRating - 1.0) / 4.0;
  const score = Math.min(1.0, Math.max(0.0, Math.round(normalized * 1000) / 1000));
  const isTopRated = rawRating >= 4.5 && count >= 3;

  return { score, isTopRated };
}

/**
 * Computes availability score in [0, 1].
 */
export function computeStockScore(status?: string, stock?: number): number {
  const numStock = stock ?? 0;
  if (status === 'Out of Stock' || numStock <= 0) {
    return 0.10;
  }
  if (status === 'Low Stock' || numStock < 5) {
    return 0.75;
  }
  return 1.0;
}


/**
 * Ranks all eligible products and applies fair seller exposure diversity.
 *
 * Steps:
 * 1. Filter out deleted, inactive, or invalid products.
 * 2. Calculate Search, Freshness, Quality, and Stock scores for each product.
 * 3. Calculate composite base score using configurable weights.
 * 4. Sort by base score descending (deterministic tie-breaker: createdAt desc, id asc).
 * 5. Apply Fair Seller Exposure windowed interleaving:
 *    - In each 12-item discovery window, prevent any single seller from taking more than
 *      `maxPerSellerPerWindow` slots if other eligible sellers are waiting.
 *    - Remaining items flow into subsequent windows without losing rank order.
 * 6. Return paginated / batched results.
 */
export function rankProducts(
  products: Product[],
  options: {
    query?: string;
    brokers?: Broker[];
    config?: Partial<RankingConfig>;
    page?: number;
    pageSize?: number;
    deletedIds?: string[];
    selectedCategory?: string;
  } = {}
): RankingResult {
  const {
    query = '',
    brokers = [],
    config: userConfig,
    page = 1,
    pageSize = 12,
    deletedIds = [],
    selectedCategory = 'All',
  } = options;

  const config: RankingConfig = {
    ...DEFAULT_RANKING_CONFIG,
    ...userConfig,
    discoveryWeights: {
      ...DEFAULT_RANKING_CONFIG.discoveryWeights,
      ...userConfig?.discoveryWeights,
    },
    searchWeights: {
      ...DEFAULT_RANKING_CONFIG.searchWeights,
      ...userConfig?.searchWeights,
    },
  };

  const isSearchMode = query.trim().length > 0;
  const weights = isSearchMode ? config.searchWeights : config.discoveryWeights;

  // Helper map for broker names
  const brokerMap = new Map<string, Broker>();
  brokers.forEach((b) => brokerMap.set(b.id, b));

  // 1. Filter eligible products
  const eligibleProducts = products.filter((p) => {
    if (!isProductEligible(p, deletedIds)) return false;
    if (selectedCategory && selectedCategory !== 'All' && p.category !== selectedCategory) {
      return false;
    }
    return true;
  });

  // 2. Score each product
  interface ScoredCandidate {
    product: Product;
    breakdown: ScoreBreakdown;
  }

  const scoredCandidates: ScoredCandidate[] = [];

  for (const product of eligibleProducts) {
    const broker = product.brokerId ? brokerMap.get(product.brokerId) : undefined;
    const brokerName = product.brokerName || broker?.name;

    // Search relevance
    const searchRelevance = computeSearchRelevance(product, query, brokerName);

    // If searching and this product has 0 relevance, exclude from search results
    if (isSearchMode && searchRelevance === 0) {
      continue;
    }

    // Freshness
    const { score: freshness, isNew } = computeFreshnessScore(
      product.createdAt,
      config.freshnessHalfLifeDays
    );

    // Quality (ratings)
    const ratingVal = product.rating ?? broker?.rating;
    const reviewCountVal = product.reviewCount ?? broker?.reviewCount;
    const { score: quality, isTopRated } = computeQualityScore(
      ratingVal,
      reviewCountVal,
      config.bayesianPriorMean,
      config.bayesianConfidenceWeight
    );

    // Availability / Stock
    const stockScore = computeStockScore(product.status, product.stock);

    // Calculate composite base score
    const baseScore =
      weights.relevance * searchRelevance +
      weights.freshness * freshness +
      weights.quality * quality +
      weights.stock * stockScore;

    const tags: string[] = [];
    if (isNew) tags.push('New Arrival');
    if (isTopRated) tags.push('Top Rated');
    if (broker?.status === 'Verified') tags.push('Verified Broker');

    scoredCandidates.push({
      product,
      breakdown: {
        searchRelevance,
        freshness,
        quality,
        stock: stockScore,
        baseScore: Math.round(baseScore * 1000) / 1000,
        finalRank: 0,
        tags,
      },
    });
  }

  // 3. Sort by base score descending with deterministic tie-breaker
  scoredCandidates.sort((a, b) => {
    // Primary: Base score
    const scoreDiff = b.breakdown.baseScore - a.breakdown.baseScore;
    if (Math.abs(scoreDiff) > 0.0001) {
      return scoreDiff;
    }

    // Secondary: Recency
    const timeA = a.product.createdAt ? Date.parse(a.product.createdAt) : 0;
    const timeB = b.product.createdAt ? Date.parse(b.product.createdAt) : 0;
    if (timeA !== timeB) {
      return timeB - timeA;
    }

    // Tertiary: Stable deterministic tie-breaker on ID
    return a.product.id.localeCompare(b.product.id);
  });

  // 4. Fair Seller Exposure Windowed Interleaving
  // In discovery mode, distribute exposure so no single seller takes all top 12 spots
  // when other sellers have products available.
  const windowSize = 12;
  const maxPerSeller = Math.max(1, config.maxPerSellerPerWindow);

  const finalRanked: RankedProduct[] = [];
  const remainingPool = [...scoredCandidates];

  while (remainingPool.length > 0) {
    const currentWindowSellersCount = new Map<string, number>();
    const deferredInThisWindow: ScoredCandidate[] = [];
    let slotsAvailable = windowSize;

    let index = 0;
    while (index < remainingPool.length && slotsAvailable > 0) {
      const candidate = remainingPool[index];
      const sellerId = candidate.product.brokerId || 'unassigned';
      const count = currentWindowSellersCount.get(sellerId) || 0;

      // Check if this seller has other competing sellers with pending products in this pool
      const hasOtherCompetingSellers = remainingPool
        .slice(index + 1)
        .some((c) => (c.product.brokerId || 'unassigned') !== sellerId);

      if (count >= maxPerSeller && hasOtherCompetingSellers) {
        // Defer this product to the next window/batch to give another seller a chance
        deferredInThisWindow.push(candidate);
        remainingPool.splice(index, 1);
      } else {
        // Place candidate into output
        currentWindowSellersCount.set(sellerId, count + 1);
        finalRanked.push({
          product: candidate.product,
          scoreBreakdown: {
            ...candidate.breakdown,
            finalRank: finalRanked.length + 1,
          },
        });
        remainingPool.splice(index, 1);
        slotsAvailable--;
      }
    }

    // Put deferred items back at the head of the remaining pool for subsequent windows
    remainingPool.unshift(...deferredInThisWindow);

    // If remainingPool still has items but slotsAvailable > 0 (meaning deferred items exist
    // and no more competing sellers exist), allow the deferred items to fill the remaining slots
    if (slotsAvailable > 0 && remainingPool.length > 0) {
      const fillItems = remainingPool.splice(0, slotsAvailable);
      for (const candidate of fillItems) {
        finalRanked.push({
          product: candidate.product,
          scoreBreakdown: {
            ...candidate.breakdown,
            finalRank: finalRanked.length + 1,
          },
        });
      }
    }
  }

  // 5. Paginate results
  const totalEligible = finalRanked.length;
  const safePageSize = Math.max(1, pageSize);
  const totalAvailablePages = Math.ceil(totalEligible / safePageSize) || 1;
  const safePage = Math.min(Math.max(1, page), totalAvailablePages);

  const startIndex = (safePage - 1) * safePageSize;
  const paginatedItems = finalRanked.slice(startIndex, startIndex + safePageSize);
  const hasMore = safePage < totalAvailablePages;

  return {
    items: paginatedItems,
    totalEligible,
    page: safePage,
    pageSize: safePageSize,
    hasMore,
    totalAvailablePages,
  };
}
