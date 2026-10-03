import { supabase, isSupabaseConfigured } from '../supabase';
import type { ReverseAuction, ReverseAuctionBid, ReverseAuctionStatus } from '../../types';

const LOCAL_AUCTIONS_KEY = 'brokerhub_reverse_auctions_v1';
const LOCAL_BIDS_KEY = 'brokerhub_reverse_auction_bids_v1';

const isUuidStr = (str?: string) =>
  Boolean(str && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str));

export const INITIAL_REVERSE_AUCTIONS: ReverseAuction[] = [
  {
    id: 'RA-2048',
    customerId: 'cust-nordhamn',
    customerName: 'Nordhamn Processing AB',
    customerCompany: 'Nordhamn Processing AB',
    contactName: 'Elin Söder',
    customerEmail: 'elin.soder@nordhamn.se',
    customerPhone: '+46 8 410 286 40',
    deliveryLocation: 'Norrköping, Sweden',
    title: 'Stainless process pump, 18 m³/h',
    category: 'Process equipment',
    productName: 'Stainless process pump, 18 m³/h',
    productImage: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=800&auto=format&fit=crop&q=80',
    photos: [
      'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=800&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1581092335397-9583fe92d232?w=800&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=800&auto=format&fit=crop&q=80',
    ],
    quantity: 1,
    description: '316L stainless steel centrifugal pump for food production. Required duty point: 18 m³/h at 4 bar, 400V motor, IP55. Hygienic fittings, CE declaration and material certificates are mandatory. Quote should include lead time, warranty, freight and optional installation.',
    specifications: {
      'MATERIAL': '316L stainless steel',
      'POWER': '400V · IP55',
      'DOCUMENTATION': 'CE + material certs',
      'DELIVERY LOCATION': 'Norrköping, Sweden',
    },
    startingPrice: 12000,
    budgetText: '€8,000–12,000',
    deadlineDate: '08 Oct 2026',
    activityText: '6 broker responses',
    currentLowestBid: 9980,
    lowestBidderId: 'broker-noric',
    lowestBidderName: 'Noric Flow Systems',
    bidCount: 6,
    startTime: new Date(Date.now() - 3 * 86400000).toISOString(),
    endTime: new Date(Date.now() + 14 * 86400000).toISOString(),
    status: 'Active',
    statusPill: 'Published',
    createdAt: new Date(Date.now() - 3 * 86400000).toISOString(),
  },
  {
    id: 'RA-2045',
    customerId: 'cust-scandi',
    customerName: 'ScandiPack Logistics',
    customerCompany: 'ScandiPack Logistics',
    contactName: 'Lars Berg',
    customerEmail: 'lars.berg@scandipack.se',
    customerPhone: '+46 8 332 9980',
    deliveryLocation: 'Örebro, SE',
    title: 'Automated pallet wrapper',
    category: 'Packaging lines',
    productName: 'Automated pallet wrapper',
    productImage: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=800&auto=format&fit=crop&q=80',
    photos: [
      'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=800&auto=format&fit=crop&q=80',
    ],
    quantity: 1,
    description: 'High speed automatic stretch pallet wrapping machine with top sheet dispenser. Capacity: 40 pallets/hour.',
    specifications: {
      'CAPACITY': '40 pallets / hour',
      'TURNTABLE': '1650 mm diameter',
      'DELIVERY': 'Örebro, SE',
    },
    startingPrice: 14000,
    budgetText: '€14,000 max',
    deadlineDate: '12 Oct · 18 days',
    activityText: '4 broker responses',
    currentLowestBid: 12800,
    lowestBidderId: 'broker-atlas',
    lowestBidderName: 'Atlas Industrial Supply',
    bidCount: 4,
    startTime: new Date(Date.now() - 2 * 86400000).toISOString(),
    endTime: new Date(Date.now() + 18 * 86400000).toISOString(),
    status: 'Active',
    statusPill: 'New today',
    createdAt: new Date(Date.now() - 2 * 86400000).toISOString(),
  },
  {
    id: 'RA-2041',
    customerId: 'cust-lindqvist',
    customerName: 'Lindqvist Foods',
    customerCompany: 'Lindqvist Foods',
    contactName: 'Sofia Lindqvist',
    customerEmail: 'sofia@lindqvistfoods.se',
    customerPhone: '+46 40 120 445',
    deliveryLocation: 'Malmö, SE',
    title: 'Food-grade conveyor belt, 12 m',
    category: 'Process equipment',
    productName: 'Food-grade conveyor belt, 12 m',
    productImage: 'https://images.unsplash.com/photo-1504917599217-d4dc5ebe6122?w=800&auto=format&fit=crop&q=80',
    photos: [
      'https://images.unsplash.com/photo-1504917599217-d4dc5ebe6122?w=800&auto=format&fit=crop&q=80',
    ],
    quantity: 1,
    description: 'Modular plastic food belt conveyor, 12m length, 600mm belt width. Stainless steel frame with adjustable speed drive.',
    specifications: {
      'BELT': 'FDA Approved Modular Plastic',
      'FRAME': '304 Stainless Steel',
      'LENGTH': '12 meters',
    },
    startingPrice: 16500,
    budgetText: '€16,500 max',
    deadlineDate: '02 Oct 2026',
    activityText: 'Atlas Supply approved',
    currentLowestBid: 14500,
    lowestBidderId: 'broker-atlas',
    lowestBidderName: 'Atlas Industrial Supply',
    bidCount: 5,
    startTime: new Date(Date.now() - 5 * 86400000).toISOString(),
    endTime: new Date(Date.now() + 8 * 86400000).toISOString(),
    status: 'Broker approved',
    statusPill: 'Broker approved',
    winningBrokerName: 'Atlas Industrial Supply',
    createdAt: new Date(Date.now() - 5 * 86400000).toISOString(),
  },
  {
    id: 'RA-2042',
    customerId: 'cust-bergstrom',
    customerName: 'Bergström Steelworks',
    customerCompany: 'Bergström Steelworks',
    contactName: 'Johan Bergström',
    customerEmail: 'johan@bergstromsteel.se',
    customerPhone: '+46 26 990 120',
    deliveryLocation: 'Gävle, SE',
    title: 'Hydraulic power unit, 75 kW',
    category: 'Compressed air',
    productName: 'Hydraulic power unit, 75 kW',
    productImage: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=800&auto=format&fit=crop&q=80',
    photos: [
      'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=800&auto=format&fit=crop&q=80',
    ],
    quantity: 1,
    description: 'Heavy duty hydraulic power pack unit 75kW motor with 600L reservoir tank and proportional valves.',
    specifications: {
      'MOTOR': '75 kW 400V',
      'TANK': '600 Liters',
      'PRESSURE': '315 Bar',
    },
    startingPrice: 24000,
    budgetText: '€19,000–24,000',
    deadlineDate: '18 Oct · 24 days',
    activityText: '3 broker responses',
    currentLowestBid: 21500,
    lowestBidderId: 'broker-vektor',
    lowestBidderName: 'Vektor Process AB',
    bidCount: 3,
    startTime: new Date(Date.now() - 4 * 86400000).toISOString(),
    endTime: new Date(Date.now() + 24 * 86400000).toISOString(),
    status: 'Active',
    statusPill: 'Open',
    createdAt: new Date(Date.now() - 4 * 86400000).toISOString(),
  },
  {
    id: 'RA-2029',
    customerId: 'cust-bergstrom',
    customerName: 'Bergström Steelworks',
    customerCompany: 'Bergström Steelworks',
    contactName: 'Johan Bergström',
    customerEmail: 'johan@bergstromsteel.se',
    customerPhone: '+46 26 990 120',
    deliveryLocation: 'Gävle, SE',
    title: 'Rotary screw air compressor',
    category: 'Compressed air',
    productName: 'Rotary screw air compressor',
    productImage: 'https://images.unsplash.com/photo-1504917599217-d4dc5ebe6122?w=800&auto=format&fit=crop&q=80',
    photos: [
      'https://images.unsplash.com/photo-1504917599217-d4dc5ebe6122?w=800&auto=format&fit=crop&q=80',
    ],
    quantity: 1,
    description: '55kW oil-injected rotary screw compressor with integrated dryer and energy recovery unit.',
    specifications: {
      'CAPACITY': '9.5 m³/min',
      'PRESSURE': '8.5 Bar',
    },
    startingPrice: 28000,
    budgetText: '€22,000–28,000',
    deadlineDate: 'Delivered 21 Sep',
    activityText: 'Order completed',
    currentLowestBid: 23500,
    lowestBidderId: 'broker-atlas',
    lowestBidderName: 'Atlas Industrial Supply',
    bidCount: 7,
    startTime: new Date(Date.now() - 30 * 86400000).toISOString(),
    endTime: new Date(Date.now() - 3 * 86400000).toISOString(),
    status: 'Completed',
    statusPill: 'Completed',
    winningBrokerId: 'broker-atlas',
    winningBrokerName: 'Atlas Industrial Supply',
    deliveryConfirmedText: 'Delivery confirmed by Elin Söder · 06 Oct, 14:32',
    deliveryProofPhotos: [
      'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=500&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=500&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1504917599217-d4dc5ebe6122?w=500&auto=format&fit=crop&q=80',
    ],
    createdAt: new Date(Date.now() - 30 * 86400000).toISOString(),
  }
];

export const INITIAL_REVERSE_AUCTION_BIDS: ReverseAuctionBid[] = [
  {
    id: 'bid-atlas-1',
    auctionId: 'RA-2048',
    brokerId: 'broker-atlas',
    brokerName: 'Atlas Industrial Supply',
    brokerCompany: 'Atlas Industrial Supply',
    bidAmount: 10450,
    bidAmountText: '€10,450',
    leadTimeDays: 7,
    leadTimeText: '7 days',
    offerNote: 'In stock with full CE package and commissioning included.',
    notes: 'In stock with full CE package and commissioning included.',
    status: 'Approved',
    createdAt: new Date(Date.now() - 2 * 86400000).toISOString(),
  },
  {
    id: 'bid-vektor-1',
    auctionId: 'RA-2048',
    brokerId: 'broker-vektor',
    brokerName: 'Vektor Process AB',
    brokerCompany: 'Vektor Process AB',
    bidAmount: 11200,
    bidAmountText: '€11,200',
    leadTimeDays: 12,
    leadTimeText: '12 days',
    offerNote: 'Specification matched. Full proposal available.',
    notes: 'Specification matched. Full proposal available.',
    status: 'Reviewed',
    createdAt: new Date(Date.now() - 1 * 86400000).toISOString(),
  },
  {
    id: 'bid-noric-1',
    auctionId: 'RA-2048',
    brokerId: 'broker-noric',
    brokerName: 'Noric Flow Systems',
    brokerCompany: 'Noric Flow Systems',
    bidAmount: 9980,
    bidAmountText: '€9,980',
    leadTimeDays: 18,
    leadTimeText: '18 days',
    offerNote: 'Specification matched. Full proposal available.',
    notes: 'Specification matched. Full proposal available.',
    status: 'Received',
    createdAt: new Date(Date.now() - 4 * 3600000).toISOString(),
  }
];

function getLocalAuctions(): ReverseAuction[] {
  try {
    const raw = localStorage.getItem(LOCAL_AUCTIONS_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  localStorage.setItem(LOCAL_AUCTIONS_KEY, JSON.stringify(INITIAL_REVERSE_AUCTIONS));
  return INITIAL_REVERSE_AUCTIONS;
}

function saveLocalAuctions(auctions: ReverseAuction[]) {
  try {
    localStorage.setItem(LOCAL_AUCTIONS_KEY, JSON.stringify(auctions));
  } catch {}
}

function getLocalBids(): ReverseAuctionBid[] {
  try {
    const raw = localStorage.getItem(LOCAL_BIDS_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  localStorage.setItem(LOCAL_BIDS_KEY, JSON.stringify(INITIAL_REVERSE_AUCTION_BIDS));
  return INITIAL_REVERSE_AUCTION_BIDS;
}

function saveLocalBids(bids: ReverseAuctionBid[]) {
  try {
    localStorage.setItem(LOCAL_BIDS_KEY, JSON.stringify(bids));
  } catch {}
}

export async function getReverseAuctions(): Promise<ReverseAuction[]> {
  if (isSupabaseConfigured) {
    try {
      const { data, error } = await supabase
        .from('reverse_auctions')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && data && data.length > 0) {
        return data.map((a: any) => ({
          id: a.id,
          customerId: a.customer_id,
          customerName: a.customer_name,
          customerCompany: a.customer_company || a.customer_name,
          customerEmail: a.customer_email,
          customerPhone: a.customer_phone,
          contactName: a.contact_name || a.customer_name,
          deliveryLocation: a.delivery_location || 'Sweden',
          title: a.title,
          category: a.category || 'General',
          productId: a.product_id,
          productName: a.product_name,
          productImage: a.product_image,
          photos: a.photos || (a.product_image ? [a.product_image] : []),
          quantity: a.quantity,
          description: a.description,
          specifications: a.specifications || {},
          startingPrice: Number(a.starting_price),
          budgetText: a.budget_text || `€${Number(a.starting_price).toLocaleString()}`,
          deadlineDate: a.deadline_date || '14 days',
          activityText: a.activity_text || `${a.bid_count || 0} broker responses`,
          currentLowestBid: a.current_lowest_bid ? Number(a.current_lowest_bid) : undefined,
          lowestBidderId: a.lowest_bidder_id,
          lowestBidderName: a.lowest_bidder_name,
          bidCount: a.bid_count || 0,
          startTime: a.start_time,
          endTime: a.end_time,
          status: a.status || 'OPEN',
          statusPill: a.status_pill || a.status || 'OPEN',
          currentLevel: a.current_level || 'OPEN',
          assignedBrokerId: a.assigned_broker_id,
          completedAt: a.completed_at,
          cancelledAt: a.cancelled_at,
          winningBidId: a.winning_bid_id,
          winningBrokerId: a.winning_broker_id,
          winningBrokerName: a.winning_broker_name,
          deliveryProofPhotos: a.delivery_proof_photos,
          deliveryConfirmedText: a.delivery_confirmed_text,
          createdAt: a.created_at,
          updatedAt: a.updated_at,
        }));
      }
    } catch (err) {
      console.warn('Supabase fetch auctions fallback to local:', err);
    }
  }

  const local = getLocalAuctions();
  return local.map((a) => ({
    ...a,
    status: calculateAuctionStatus(a.endTime, a.status),
  }));
}

export function calculateAuctionStatus(endTimeStr: string, currentStatus?: string): ReverseAuctionStatus {
  if (currentStatus === 'Completed' || currentStatus === 'Cancelled' || currentStatus === 'Broker approved') {
    return currentStatus as ReverseAuctionStatus;
  }
  const end = new Date(endTimeStr).getTime();
  const now = Date.now();
  if (now >= end) return 'Completed';
  const diffHours = (end - now) / (1000 * 3600);
  if (diffHours <= 24) return 'Ending Soon';
  return 'Active';
}

export async function getAuctionBids(auctionId: string): Promise<ReverseAuctionBid[]> {
  if (isSupabaseConfigured && isUuidStr(auctionId)) {
    try {
      const { data, error } = await supabase
        .from('reverse_auction_bids')
        .select('*')
        .eq('auction_id', auctionId)
        .order('bid_amount', { ascending: true });

      if (!error && data) {
        return data.map((b: any) => ({
          id: b.id,
          auctionId: b.auction_id,
          brokerId: b.broker_id,
          brokerName: b.broker_name,
          brokerCompany: b.broker_company,
          brokerAvatar: b.broker_avatar,
          bidAmount: Number(b.bid_amount),
          bidAmountText: `€${Number(b.bid_amount).toLocaleString()}`,
          leadTimeDays: b.lead_time_days || 7,
          leadTimeText: b.lead_time_text || `${b.lead_time_days || 7} days`,
          offerNote: b.notes || b.offer_note,
          notes: b.notes || b.offer_note,
          status: b.status,
          createdAt: b.created_at,
          updatedAt: b.updated_at,
        }));
      }
    } catch (err) {
      console.warn('Supabase fetch bids error, fallback to local:', err);
    }
  }

  const allBids = getLocalBids();
  return allBids
    .filter((b) => b.auctionId === auctionId)
    .sort((a, b) => a.bidAmount - b.bidAmount);
}

export async function createReverseAuction(payload: {
  customerId: string;
  customerName: string;
  customerCompany?: string;
  contactName?: string;
  customerEmail?: string;
  customerPhone?: string;
  deliveryLocation?: string;
  title: string;
  category: string;
  productName?: string;
  productImage?: string;
  photos?: string[];
  quantity: number;
  description: string;
  specifications?: Record<string, string>;
  startingPrice: number;
  budgetText?: string;
  deadlineDate?: string;
  durationHours?: number;
}): Promise<ReverseAuction> {
  const hours = payload.durationHours || 168; // default 7 days
  const startTime = new Date().toISOString();
  const endTime = new Date(Date.now() + hours * 3600 * 1000).toISOString();

  const newAuction: ReverseAuction = {
    id: `RA-${Math.floor(2000 + Math.random() * 900)}`,
    customerId: payload.customerId,
    customerName: payload.customerName,
    customerCompany: payload.customerCompany || payload.customerName,
    contactName: payload.contactName || payload.customerName,
    customerEmail: payload.customerEmail || '',
    customerPhone: payload.customerPhone || '',
    deliveryLocation: payload.deliveryLocation || 'Sweden',
    title: payload.title,
    category: payload.category,
    productName: payload.productName || payload.title,
    productImage: payload.photos?.[0] || payload.productImage || 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=800&auto=format&fit=crop&q=80',
    photos: payload.photos || (payload.productImage ? [payload.productImage] : []),
    quantity: payload.quantity,
    description: payload.description,
    specifications: payload.specifications || {},
    startingPrice: payload.startingPrice,
    budgetText: payload.budgetText || `€${payload.startingPrice.toLocaleString()}`,
    deadlineDate: payload.deadlineDate || new Date(endTime).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
    activityText: '0 broker responses',
    bidCount: 0,
    startTime,
    endTime,
    status: 'OPEN',
    statusPill: 'Published',
    currentLevel: 'OPEN',
    createdAt: startTime,
  };

  if (isSupabaseConfigured) {
    try {
      const dbPayload: any = {
        customer_id: isUuidStr(payload.customerId) ? payload.customerId : undefined,
        customer_name: payload.customerName,
        customer_company: payload.customerCompany || payload.customerName,
        contact_name: payload.contactName || payload.customerName,
        customer_email: payload.customerEmail,
        customer_phone: payload.customerPhone,
        delivery_location: payload.deliveryLocation || 'Sweden',
        title: payload.title,
        category: payload.category,
        product_name: payload.productName || payload.title,
        product_image: newAuction.productImage,
        photos: payload.photos || [],
        quantity: payload.quantity,
        description: payload.description,
        specifications: payload.specifications || {},
        starting_price: payload.startingPrice,
        start_time: startTime,
        end_time: endTime,
        status: 'OPEN',
        current_level: 'OPEN',
      };

      // Remove undefined customer_id if not a valid UUID to avoid FK constraint failure
      if (!dbPayload.customer_id) delete dbPayload.customer_id;

      const { data, error } = await supabase
        .from('reverse_auctions')
        .insert([dbPayload])
        .select('id, customer_id, created_at');

      if (error) {
        console.error('Supabase insert error:', error);
      } else if (data && data.length > 0) {
        // Capture the real UUID from DB to use for image uploads
        newAuction.id = data[0].id;
        console.log('Auction created in DB with id:', newAuction.id);
      }
    } catch (err) {
      console.error('Failed to create auction in Supabase:', err);
    }
  }

  const local = getLocalAuctions();
  saveLocalAuctions([newAuction, ...local]);

  return newAuction;
}

export async function placeReverseAuctionBid(payload: {
  auctionId: string;
  brokerId: string;
  brokerName: string;
  brokerCompany?: string;
  brokerAvatar?: string;
  bidAmount: number;
  offerNote?: string;
  leadTimeDays?: number;
  notes?: string;
}): Promise<{ success: boolean; error?: string; bid?: ReverseAuctionBid; auction?: ReverseAuction }> {
  const auctions = await getReverseAuctions();
  const auction = auctions.find((a) => a.id === payload.auctionId);

  if (!auction) {
    return { success: false, error: 'Auction not found.' };
  }

  const newBid: ReverseAuctionBid = {
    id: `bid-${Date.now()}`,
    auctionId: payload.auctionId,
    brokerId: payload.brokerId,
    brokerName: payload.brokerName,
    brokerCompany: payload.brokerCompany || 'Verified Broker',
    brokerAvatar: payload.brokerAvatar,
    bidAmount: payload.bidAmount,
    bidAmountText: `€${payload.bidAmount.toLocaleString()}`,
    leadTimeDays: payload.leadTimeDays || 7,
    leadTimeText: `${payload.leadTimeDays || 7} days`,
    offerNote: payload.offerNote || payload.notes || 'In stock with full specification match.',
    notes: payload.offerNote || payload.notes || 'In stock with full specification match.',
    status: 'Approved',
    createdAt: new Date().toISOString(),
  };

  if (isSupabaseConfigured && isUuidStr(payload.auctionId)) {
    try {
      const bidDbObj = {
        auction_id: payload.auctionId,
        broker_id: isUuidStr(payload.brokerId) ? payload.brokerId : '9f0e8795-a2e6-4c11-afba-2dd7b34fc638',
        broker_name: payload.brokerName,
        broker_company: payload.brokerCompany,
        broker_avatar: payload.brokerAvatar,
        bid_amount: payload.bidAmount,
        notes: payload.offerNote || payload.notes,
        status: 'Approved',
      };

      await supabase.from('reverse_auction_bids').insert([bidDbObj]);

      await supabase
        .from('reverse_auctions')
        .update({
          current_lowest_bid: payload.bidAmount,
          lowest_bidder_id: isUuidStr(payload.brokerId) ? payload.brokerId : null,
          lowest_bidder_name: payload.brokerName,
          bid_count: (auction.bidCount || 0) + 1,
          updated_at: new Date().toISOString(),
        })
        .eq('id', payload.auctionId);
    } catch (err) {
      console.warn('Supabase bid insert exception, using local sync:', err);
    }
  }

  const localBids = getLocalBids();
  saveLocalBids([newBid, ...localBids]);

  const localAuctions = getLocalAuctions();
  const updatedAuction: ReverseAuction = {
    ...auction,
    currentLowestBid: payload.bidAmount,
    lowestBidderId: payload.brokerId,
    lowestBidderName: payload.brokerName,
    bidCount: (auction.bidCount || 0) + 1,
    status: 'Broker approved',
    statusPill: 'Broker approved',
    winningBrokerName: payload.brokerName,
    updatedAt: new Date().toISOString(),
  };

  saveLocalAuctions(
    localAuctions.map((a) => (a.id === payload.auctionId ? updatedAuction : a))
  );

  return {
    success: true,
    bid: newBid,
    auction: updatedAuction,
  };
}

export async function acceptBrokerBid(auctionId: string, bidId: string): Promise<boolean> {
  const auctions = await getReverseAuctions();
  const auction = auctions.find((a) => a.id === auctionId);
  const bids = await getAuctionBids(auctionId);
  const winningBid = bids.find((b) => b.id === bidId);

  if (!auction || !winningBid) return false;

  if (isSupabaseConfigured && isUuidStr(auctionId)) {
    try {
      await supabase
        .from('reverse_auctions')
        .update({
          status: 'Broker approved',
          winning_bid_id: isUuidStr(bidId) ? bidId : null,
          winning_broker_id: isUuidStr(winningBid.brokerId) ? winningBid.brokerId : null,
          winning_broker_name: winningBid.brokerName,
          updated_at: new Date().toISOString(),
        })
        .eq('id', auctionId);

      await supabase
        .from('reverse_auction_bids')
        .update({ status: 'Approved' })
        .eq('id', bidId);
    } catch (err) {
      console.warn('Supabase accept bid error:', err);
    }
  }

  const localAuctions = getLocalAuctions();
  saveLocalAuctions(
    localAuctions.map((a) =>
      a.id === auctionId
        ? {
            ...a,
            status: 'Broker approved' as const,
            statusPill: 'Broker approved',
            winningBidId: bidId,
            winningBrokerId: winningBid.brokerId,
            winningBrokerName: winningBid.brokerName,
            updatedAt: new Date().toISOString(),
          }
        : a
    )
  );

  const localBids = getLocalBids();
  saveLocalBids(
    localBids.map((b) => (b.id === bidId ? { ...b, status: 'Approved' as const } : b))
  );

  return true;
}

export async function cancelReverseAuction(auctionId: string): Promise<boolean> {
  if (isSupabaseConfigured && isUuidStr(auctionId)) {
    try {
      await supabase
        .from('reverse_auctions')
        .update({ status: 'Cancelled', updated_at: new Date().toISOString() })
        .eq('id', auctionId);
    } catch (err) {
      console.warn('Supabase cancel auction error:', err);
    }
  }

  const localAuctions = getLocalAuctions();
  saveLocalAuctions(
    localAuctions.map((a) =>
      a.id === auctionId ? { ...a, status: 'CANCELLED' as const } : a
    )
  );
  return true;
}

export async function acceptAuction(auctionId: string, brokerId: string): Promise<{ success: boolean; error?: string }> {
  // Always update local storage first as an optimistic update
  const localAuctions = getLocalAuctions();
  const targetAuction = localAuctions.find(a => a.id === auctionId);
  if (targetAuction && targetAuction.status !== 'OPEN') {
    return { success: false, error: 'This auction is no longer available.' };
  }
  
  if (isSupabaseConfigured && isUuidStr(auctionId) && isUuidStr(brokerId)) {
    try {
      const { data, error } = await supabase
        .from('reverse_auctions')
        .update({
          status: 'ACCEPTED',
          current_level: 'ACCEPTED',
          assigned_broker_id: brokerId,
          updated_at: new Date().toISOString(),
        })
        .eq('id', auctionId)
        .eq('status', 'OPEN') // Prevents race condition: only updates if still OPEN
        .select();

      if (error) throw error;
      if (!data || data.length === 0) return { success: false, error: 'This auction is no longer available.' };

      // Update local cache too
      saveLocalAuctions(
        localAuctions.map(a =>
          a.id === auctionId
            ? { ...a, status: 'ACCEPTED' as any, currentLevel: 'ACCEPTED', assignedBrokerId: brokerId }
            : a
        )
      );
      
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  }
  
  // Fallback: local-only mode (demo / no DB) - still update local storage so UI works
  saveLocalAuctions(
    localAuctions.map(a =>
      a.id === auctionId
        ? { ...a, status: 'ACCEPTED' as any, currentLevel: 'ACCEPTED', assignedBrokerId: brokerId }
        : a
    )
  );
  
  // Only error out if Supabase is configured but IDs are bad
  if (isSupabaseConfigured && (!isUuidStr(auctionId) || !isUuidStr(brokerId))) {
    return { success: true }; // local updated, DB skipped
  }
  
  return { success: true };
}

export async function updateAuctionLevel(auctionId: string, brokerId: string, level: string): Promise<{ success: boolean; error?: string }> {
  if (isSupabaseConfigured && isUuidStr(auctionId)) {
    try {
      const { error } = await supabase
        .from('reverse_auctions')
        .update({
          current_level: level,
          updated_at: new Date().toISOString(),
        })
        .eq('id', auctionId)
        .eq('assigned_broker_id', brokerId);

      if (error) throw error;
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  }
  return { success: false, error: 'Database not configured' };
}

export async function submitDeliveryProof(auctionId: string, brokerId: string, photos: string[], text?: string): Promise<{ success: boolean; error?: string }> {
  if (isSupabaseConfigured && isUuidStr(auctionId)) {
    try {
      const { error } = await supabase
        .from('reverse_auctions')
        .update({
          delivery_proof_photos: photos,
          delivery_confirmed_text: text,
          current_level: 'DELIVERED',
          updated_at: new Date().toISOString(),
        })
        .eq('id', auctionId)
        .eq('assigned_broker_id', brokerId);

      if (error) throw error;
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  }
  return { success: false, error: 'Database not configured' };
}

export async function completeAuction(auctionId: string, brokerId: string): Promise<{ success: boolean; error?: string }> {
  if (isSupabaseConfigured && isUuidStr(auctionId)) {
    try {
      const { error } = await supabase
        .from('reverse_auctions')
        .update({
          status: 'COMPLETED',
          current_level: 'COMPLETED',
          completed_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', auctionId)
        .eq('assigned_broker_id', brokerId);

      if (error) throw error;
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  }
  return { success: false, error: 'Database not configured' };
}

export async function deleteReverseAuction(
  auctionId: string,
  userId?: string
): Promise<{ success: boolean; error?: string }> {
  // 1. Fetch current auctions to verify existence and check ownership
  const auctions = await getReverseAuctions();
  const auction = auctions.find((a) => a.id === auctionId);

  if (!auction) {
    return { success: false, error: 'Auction not found or already deleted.' };
  }

  // 2. Ownership verification at backend/API level
  if (userId) {
    const isOwner =
      auction.customerId === userId ||
      auction.customerId === 'cust-nordhamn' || // Default demo customer fallback
      !isUuidStr(userId); // Non-UUID demo users permitted in demo mode

    if (!isOwner && isUuidStr(userId) && isUuidStr(auction.customerId) && userId !== auction.customerId) {
      return { success: false, error: 'Unauthorized: You can only delete your own auctions.' };
    }
  }

  // 3. Database deletion using Supabase if configured
  if (isSupabaseConfigured && isUuidStr(auctionId)) {
    try {
      // Clean up related bids safely first (if ON DELETE CASCADE isn't active or in DB triggers)
      await supabase
        .from('reverse_auction_bids')
        .delete()
        .eq('auction_id', auctionId);

      // Clean up related notifications referencing this auction
      await supabase
        .from('broker_notifications')
        .delete()
        .eq('metadata->>auction_id', auctionId);

      // Delete the reverse auction record from database by its unique ID
      let query = supabase.from('reverse_auctions').delete().eq('id', auctionId);
      if (userId && isUuidStr(userId)) {
        query = query.eq('customer_id', userId);
      }

      const { error } = await query;
      if (error) {
        console.error('Supabase reverse auction deletion failed:', error);
        return { success: false, error: error.message };
      }
    } catch (err: any) {
      console.error('Database exception during reverse auction deletion:', err);
      return { success: false, error: err?.message || 'Database deletion failed.' };
    }
  }

  // 4. Always update local storage sync (so both Customer & Broker state remain in sync)
  const localAuctions = getLocalAuctions();
  const updatedAuctions = localAuctions.filter((a) => a.id !== auctionId);
  saveLocalAuctions(updatedAuctions);

  const localBids = getLocalBids();
  const updatedBids = localBids.filter((b) => b.auctionId !== auctionId);
  saveLocalBids(updatedBids);

  return { success: true };
}

