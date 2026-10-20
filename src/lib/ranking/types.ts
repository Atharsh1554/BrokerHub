import type { Product } from '../../types';

export interface RankingWeights {
  relevance: number;  // Search relevance weight (0 - 1)
  freshness: number;  // Product freshness / recency decay weight (0 - 1)
  quality: number;    // Product quality / review rating weight (0 - 1)
  stock: number;      // Availability / stock status weight (0 - 1)
}

export interface RankingConfig {
  /** Weights used when customer is in discovery mode (no search query) */
  discoveryWeights: RankingWeights;
  /** Weights used when customer is actively searching */
  searchWeights: RankingWeights;
  /** Half-life in days for exponential freshness decay (default: 14 days) */
  freshnessHalfLifeDays: number;
  /** Maximum products a single seller can have in a 12-product window if other sellers exist (default: 2) */
  maxPerSellerPerWindow: number;
  /** Bayesian damped rating prior mean (default: 4.0) */
  bayesianPriorMean: number;
  /** Bayesian damped rating prior confidence weight (default: 3) */
  bayesianConfidenceWeight: number;
  /** Optional session or date seed for deterministic fair rotation */
  sessionSeed?: string;
}

export interface ScoreBreakdown {
  searchRelevance: number; // 0 - 1
  freshness: number;       // 0 - 1
  quality: number;         // 0 - 1
  stock: number;           // 0 - 1
  baseScore: number;       // composite score before diversity interleaving
  finalRank: number;       // 1-based final position after diversity interleaving
  tags: string[];          // UI badge tags e.g. 'New Arrival', 'Top Rated', 'Verified Broker'
}

export interface RankedProduct {
  product: Product;
  scoreBreakdown: ScoreBreakdown;
}

export interface RankingResult {
  items: RankedProduct[];
  totalEligible: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
  totalAvailablePages: number;
}
