/**
 * Product Visibility & Interaction Analytics Module.
 * 
 * Strict architectural separation:
 * 1. Ranking NEVER fabricates or reads unverified impression/view counts.
 * 2. Only real interactions trigger events.
 * 3. Structured to connect seamlessly with Supabase event streams or external analytics sinks.
 */

export interface ProductImpressionEvent {
  productId: string;
  brokerId?: string;
  rankPosition: number;
  timestamp: string;
  source: 'customer_dashboard' | 'products_page' | 'search_results';
  query?: string;
}

export interface ProductInteractionEvent {
  productId: string;
  brokerId?: string;
  action: 'click' | 'view_detail' | 'chat_inquiry' | 'add_to_cart';
  rankPosition?: number;
  timestamp: string;
}

// In-memory buffer for real events prior to flushing
const eventBuffer: {
  impressions: ProductImpressionEvent[];
  interactions: ProductInteractionEvent[];
} = {
  impressions: [],
  interactions: [],
};

/**
 * Record an actual product impression when a product card enters customer view.
 */
export function recordProductImpression(
  productId: string,
  rankPosition: number,
  source: 'customer_dashboard' | 'products_page' | 'search_results' = 'customer_dashboard',
  brokerId?: string,
  query?: string
): void {
  if (!productId) return;

  const event: ProductImpressionEvent = {
    productId,
    brokerId,
    rankPosition,
    timestamp: new Date().toISOString(),
    source,
    query,
  };

  eventBuffer.impressions.push(event);

  // In development, keep a lightweight audit log in sessionStorage for debugging
  try {
    const existing = JSON.parse(sessionStorage.getItem('brokerhub_analytics_impressions') || '[]');
    existing.push(event);
    if (existing.length > 100) existing.shift();
    sessionStorage.setItem('brokerhub_analytics_impressions', JSON.stringify(existing));
  } catch {}
}

/**
 * Record a user interaction (click, detail view, chat inquiry, cart add).
 */
export function recordProductInteraction(
  productId: string,
  action: 'click' | 'view_detail' | 'chat_inquiry' | 'add_to_cart',
  brokerId?: string,
  rankPosition?: number
): void {
  if (!productId) return;

  const event: ProductInteractionEvent = {
    productId,
    brokerId,
    action,
    rankPosition,
    timestamp: new Date().toISOString(),
  };

  eventBuffer.interactions.push(event);

  try {
    const existing = JSON.parse(sessionStorage.getItem('brokerhub_analytics_interactions') || '[]');
    existing.push(event);
    if (existing.length > 100) existing.shift();
    sessionStorage.setItem('brokerhub_analytics_interactions', JSON.stringify(existing));
  } catch {}
}

/**
 * Returns buffered events for telemetry / background flushing.
 */
export function getBufferedEvents() {
  return { ...eventBuffer };
}
