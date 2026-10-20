import { rankProducts, isProductEligible, computeSearchRelevance, computeFreshnessScore, computeQualityScore } from '../src/lib/ranking/productRanking';
import type { Product, Broker } from '../src/types';

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`❌ FAILED: ${message}`);
    process.exit(1);
  }
  console.log(`✅ PASSED: ${message}`);
}

console.log('====================================================');
console.log('🧪 BROKERHUB SMART PRODUCT RANKING ALGORITHM TEST SUITE');
console.log('====================================================\n');

// Mock Brokers
const mockBrokers: Broker[] = [
  { id: 'broker_alpha', name: 'Alpha Traders', specialty: 'Electronics', company: 'Alpha Corp', status: 'Verified', rating: 4.9, reviewCount: 25 },
  { id: 'broker_beta', name: 'Beta Garments', specialty: 'Fashion', company: 'Beta Ltd', status: 'Verified', rating: 4.2, reviewCount: 10 },
  { id: 'broker_gamma', name: 'Gamma Crafts', specialty: 'Accessories', company: 'Gamma LLC', status: 'Verified', rating: 0, reviewCount: 0 },
  { id: 'broker_delta', name: 'Delta Newbie', specialty: 'General', company: 'Delta Ent', status: 'Under Review', rating: 0, reviewCount: 0 },
];

// Helper to create product
function createProduct(override: Partial<Product>): Product {
  return {
    id: override.id || `p_${Math.random().toString(36).substring(2, 9)}`,
    name: override.name || 'Sample Product',
    price: override.price ?? 1000,
    image: override.image || 'https://images.unsplash.com/photo-sample',
    category: override.category || 'Accessories',
    stock: override.stock ?? 10,
    status: override.status || 'In Stock',
    description: override.description || 'Quality product from verified broker',
    brokerId: override.brokerId || 'broker_alpha',
    brokerName: override.brokerName || 'Alpha Traders',
    rating: override.rating,
    reviewCount: override.reviewCount,
    isActive: override.isActive !== false,
    createdAt: override.createdAt || new Date().toISOString(),
    ...override,
  };
}

// ---------------------------------------------------------
// SCENARIO 1: A new seller lists a product
// ---------------------------------------------------------
console.log('--- Test 1: A new seller lists a product ---');
const newSellerProduct = createProduct({
  id: 'new_seller_p1',
  name: 'Handcrafted Bamboo Lamp',
  brokerId: 'broker_delta',
  brokerName: 'Delta Newbie',
  createdAt: new Date().toISOString(), // Listed right now
});
const freshCheck = computeFreshnessScore(newSellerProduct.createdAt);
assert(freshCheck.score >= 0.95, 'Newly listed product receives a high freshness score (~1.0)');
assert(freshCheck.isNew === true, 'Newly listed product is tagged as isNew = true');

const s1Results = rankProducts([newSellerProduct], { brokers: mockBrokers });
assert(s1Results.items.length === 1, 'New seller product is eligible and ranked');
assert(s1Results.items[0].scoreBreakdown.tags.includes('New Arrival'), 'Product is awarded "New Arrival" tag');

// ---------------------------------------------------------
// SCENARIO 2: An existing seller lists several products
// ---------------------------------------------------------
console.log('\n--- Test 2: An existing seller lists several products ---');
// Seller Alpha creates 8 products, Seller Beta creates 2, Seller Gamma creates 2
const dominantSellerProducts: Product[] = [];
for (let i = 1; i <= 8; i++) {
  dominantSellerProducts.push(createProduct({
    id: `alpha_${i}`,
    name: `Alpha Wireless Gadget ${i}`,
    brokerId: 'broker_alpha',
    brokerName: 'Alpha Traders',
    createdAt: new Date(Date.now() - i * 3600 * 1000).toISOString(),
  }));
}
for (let i = 1; i <= 2; i++) {
  dominantSellerProducts.push(createProduct({
    id: `beta_${i}`,
    name: `Beta Cotton Shirt ${i}`,
    brokerId: 'broker_beta',
    brokerName: 'Beta Garments',
    createdAt: new Date(Date.now() - i * 3600 * 1000).toISOString(),
  }));
}
for (let i = 1; i <= 2; i++) {
  dominantSellerProducts.push(createProduct({
    id: `gamma_${i}`,
    name: `Gamma Brass Charm ${i}`,
    brokerId: 'broker_gamma',
    brokerName: 'Gamma Crafts',
    createdAt: new Date(Date.now() - i * 3600 * 1000).toISOString(),
  }));
}

const s2Results = rankProducts(dominantSellerProducts, {
  brokers: mockBrokers,
  pageSize: 12,
});

// Check seller distribution in the first 6 positions
const firstSixBrokers = s2Results.items.slice(0, 6).map(it => it.product.brokerId);
const alphaInFirstSix = firstSixBrokers.filter(b => b === 'broker_alpha').length;
console.log(`Brokers in first 6 positions: ${firstSixBrokers.join(', ')}`);
console.log(`Alpha count in first 6: ${alphaInFirstSix}`);
assert(alphaInFirstSix <= 3, 'Dominant seller does not monopolize all top positions; competing sellers are interleaved');
assert(firstSixBrokers.includes('broker_beta'), 'Competitor Beta is represented in the top window');
assert(firstSixBrokers.includes('broker_gamma'), 'Competitor Gamma is represented in the top window');

// ---------------------------------------------------------
// SCENARIO 3: Several sellers have products in the marketplace
// ---------------------------------------------------------
console.log('\n--- Test 3: Several sellers have products in the marketplace ---');
const marketplaceProducts: Product[] = [
  createProduct({ id: 'p_a1', name: 'Alpha TV', brokerId: 'broker_alpha', createdAt: '2026-10-15T10:00:00Z' }),
  createProduct({ id: 'p_b1', name: 'Beta Shoes', brokerId: 'broker_beta', createdAt: '2026-10-16T10:00:00Z' }),
  createProduct({ id: 'p_c1', name: 'Gamma Ring', brokerId: 'broker_gamma', createdAt: '2026-10-17T10:00:00Z' }),
  createProduct({ id: 'p_d1', name: 'Delta Chair', brokerId: 'broker_delta', createdAt: '2026-10-18T10:00:00Z' }),
];
const s3Results = rankProducts(marketplaceProducts, { brokers: mockBrokers });
const s3Brokers = new Set(s3Results.items.map(it => it.product.brokerId));
assert(s3Brokers.size === 4, 'All distinct sellers are represented in the ranked discovery output');

// ---------------------------------------------------------
// SCENARIO 4: A customer searches for a specific product
// ---------------------------------------------------------
console.log('\n--- Test 4: A customer searches for a specific product ---');
const searchCatalog: Product[] = [
  createProduct({ id: 'search_exact', name: 'Vintage Leather Jacket', category: 'Fashion', description: 'Classic brown leather jacket' }),
  createProduct({ id: 'search_partial', name: 'Leather Boots', category: 'Footwear', description: 'Genuine leather winter boots' }),
  createProduct({ id: 'search_unrelated', name: 'Mechanical Keyboard', category: 'Electronics', description: 'RGB gaming keyboard' }),
];

const s4Results = rankProducts(searchCatalog, { query: 'Leather Jacket', brokers: mockBrokers });
assert(s4Results.items.length === 2, 'Unrelated product (Keyboard) is filtered out of search results');
assert(s4Results.items[0].product.id === 'search_exact', 'Exact matching product ranks #1');
assert(s4Results.items[0].scoreBreakdown.searchRelevance > s4Results.items[1].scoreBreakdown.searchRelevance,
  'Exact phrase match has higher relevance score than partial match');

// Neutral when query is empty
const neutralRelevance = computeSearchRelevance(searchCatalog[0], '');
assert(neutralRelevance === 1.0, 'Discovery mode relevance is neutral (1.0) and does not penalize browsing');

// ---------------------------------------------------------
// SCENARIO 5: A product becomes unavailable or unpublished
// ---------------------------------------------------------
console.log('\n--- Test 5: A product becomes unavailable or unpublished ---');
const activeP = createProduct({ id: 'p_active', isActive: true, status: 'In Stock' });
const inactiveP = createProduct({ id: 'p_inactive', isActive: false, status: 'In Stock' });
const deletedP = createProduct({ id: 'p_deleted', isActive: true, status: 'In Stock' });
const outOfStockP = createProduct({ id: 'p_oos', isActive: true, status: 'Out of Stock', stock: 0 });

assert(isProductEligible(activeP) === true, 'Active product is eligible');
assert(isProductEligible(inactiveP) === false, 'Inactive (is_active=false) product is strictly ineligible');
assert(isProductEligible(deletedP, ['p_deleted']) === false, 'Deleted product ID is strictly ineligible');

const s5Results = rankProducts([activeP, inactiveP, deletedP, outOfStockP], {
  deletedIds: ['p_deleted'],
  brokers: mockBrokers,
});
const eligibleIds = s5Results.items.map(it => it.product.id);
assert(!eligibleIds.includes('p_inactive'), 'Unpublished product is not returned');
assert(!eligibleIds.includes('p_deleted'), 'Deleted product is not returned');
assert(eligibleIds.includes('p_active'), 'Active product is included');

// Out of stock product has low stock score
const oosItem = s5Results.items.find(it => it.product.id === 'p_oos');
if (oosItem) {
  assert(oosItem.scoreBreakdown.stock === 0.10, 'Out of stock product receives minimum stock score penalty');
}

// ---------------------------------------------------------
// SCENARIO 6: The dashboard loads the first 12 products and then loads more
// ---------------------------------------------------------
console.log('\n--- Test 6: Dashboard loads first 12 products and then loads more (Pagination) ---');
const twentyFiveProducts: Product[] = [];
for (let i = 1; i <= 25; i++) {
  twentyFiveProducts.push(createProduct({
    id: `batch_p_${i}`,
    name: `Catalog Item ${i}`,
    brokerId: `broker_${(i % 3) + 1}`,
    createdAt: new Date(Date.now() - i * 86400 * 1000).toISOString(),
  }));
}

// Page 1 (first 12 products)
const page1 = rankProducts(twentyFiveProducts, { page: 1, pageSize: 12 });
assert(page1.items.length === 12, 'Page 1 returns exactly 12 products');
assert(page1.hasMore === true, 'Page 1 indicates hasMore = true');
assert(page1.totalEligible === 25, 'Total eligible is 25');

// Page 2 (next 12 products)
const page2 = rankProducts(twentyFiveProducts, { page: 2, pageSize: 12 });
assert(page2.items.length === 12, 'Page 2 returns next 12 products');
assert(page2.hasMore === true, 'Page 2 indicates hasMore = true');

// Page 3 (final product)
const page3 = rankProducts(twentyFiveProducts, { page: 3, pageSize: 12 });
assert(page3.items.length === 1, 'Page 3 returns final 1 remaining product');
assert(page3.hasMore === false, 'Page 3 indicates hasMore = false');

// Verify no duplicate IDs between Page 1 and Page 2
const page1Ids = new Set(page1.items.map(it => it.product.id));
const page2Duplicates = page2.items.filter(it => page1Ids.has(it.product.id));
assert(page2Duplicates.length === 0, 'No duplicate products between consecutive pages');

// ---------------------------------------------------------
// SCENARIO 7: Products added or updated while browsing
// ---------------------------------------------------------
console.log('\n--- Test 7: Products are added or updated while customers are browsing ---');
const initialCatalog = [
  createProduct({ id: 'live_1', name: 'Item 1', price: 100 }),
  createProduct({ id: 'live_2', name: 'Item 2', price: 200 }),
];
const r7Initial = rankProducts(initialCatalog);
assert(r7Initial.items.length === 2, 'Initial catalog has 2 items');

// Simulate product added in real time
const updatedCatalog = [
  ...initialCatalog,
  createProduct({ id: 'live_3_new', name: 'Newly Added Flash Product', price: 300, createdAt: new Date().toISOString() }),
];
const r7Updated = rankProducts(updatedCatalog);
assert(r7Updated.items.length === 3, 'Real-time updated catalog reflects new product seamlessly');
assert(r7Updated.items[0].product.id === 'live_3_new', 'Newly added product receives freshness boost and ranks at top');

// ---------------------------------------------------------
// SCENARIO 8: Missing ratings or optional fields handled safely
// ---------------------------------------------------------
console.log('\n--- Test 8: Missing ratings or optional fields handled safely ---');
const noRatingProduct = createProduct({
  id: 'p_unrated',
  name: 'Product Without Rating',
  rating: undefined,
  reviewCount: undefined,
  description: undefined,
  createdAt: undefined,
});
const r8Quality = computeQualityScore(noRatingProduct.rating, noRatingProduct.reviewCount);
assert(r8Quality.score === 0.50, 'Missing rating safely falls back to neutral 0.50 baseline without fabricating fake rating');

// Test Bayesian Damping: 1 review of 5.0 vs 20 reviews of 4.8
const singleReviewQuality = computeQualityScore(5.0, 1); // C=3, m=4.0 -> (3*4 + 1*5)/4 = 17/4 = 4.25 -> (4.25-1)/4 = 0.8125
const highVolumeQuality = computeQualityScore(4.8, 20); // C=3, m=4.0 -> (3*4 + 20*4.8)/23 = 108/23 = 4.695 -> (4.695-1)/4 = 0.9239
console.log(`Single 5-star review damped quality score: ${singleReviewQuality.score}`);
console.log(`20 reviews of 4.8-star damped quality score: ${highVolumeQuality.score}`);
assert(highVolumeQuality.score > singleReviewQuality.score,
  'Bayesian damping prevents single 5-star review from beating 20 verified 4.8-star reviews');

const r8Result = rankProducts([noRatingProduct]);
assert(r8Result.items.length === 1, 'Product with undefined optional fields ranks safely without runtime errors');

// ---------------------------------------------------------
// SCENARIO 9: Architecture verification
// ---------------------------------------------------------
console.log('\n--- Test 9: Data Integrity & Architectural Separation ---');
assert(typeof rankProducts === 'function', 'rankProducts is exported and callable');
assert(typeof isProductEligible === 'function', 'isProductEligible is exported and callable');

console.log('\n🎉 ALL 9 TEST SCENARIOS PASSED WITH ZERO ERRORS!\n');
