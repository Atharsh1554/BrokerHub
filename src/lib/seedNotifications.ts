import type { BrokerNotification, CustomerProfile } from '../types';

export const INITIAL_NOTIFICATIONS: BrokerNotification[] = [
  {
    id: 'n-1',
    broker_id: 'broker_alex',
    customer_id: 'cust-sarah',
    customer_name: 'Sarah Jenkins',
    customer_avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150',
    type: 'call_request',
    title: 'Incoming Call Request',
    description: 'Requested an immediate consultation regarding bulk industrial gear acquisition.',
    is_read: false,
    status: 'pending',
    metadata: {
      phone: '+1 (555) 234-5678',
      requestedTime: 'Immediate (Next 15 mins)',
      topic: 'Bulk Purchase Inquiry'
    },
    created_at: new Date(Date.now() - 1000 * 60 * 12).toISOString(), // 12 mins ago
  },
  {
    id: 'n-2',
    broker_id: 'broker_alex',
    customer_id: 'cust-michael',
    customer_name: 'Michael Chen',
    customer_avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
    type: 'order',
    title: 'New Product Order Placed',
    description: 'Placed an order for 25x Heavy-Duty Hydraulic Valves ($4,750 total).',
    related_order_id: 'ORD-9821',
    is_read: false,
    status: 'pending',
    metadata: {
      orderId: 'ORD-9821',
      itemsCount: 25,
      totalAmount: 4750,
      itemSummary: 'Heavy-Duty Hydraulic Valves'
    },
    created_at: new Date(Date.now() - 1000 * 60 * 45).toISOString(), // 45 mins ago
  },
  {
    id: 'n-3',
    broker_id: 'broker_alex',
    customer_id: 'cust-elena',
    customer_name: 'Elena Rodriguez',
    customer_avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
    type: 'message',
    title: 'New Direct Message',
    description: '"Hi Alex, can you send the technical specification sheet for the turbine pump?"',
    related_conversation_id: 'conv-elena',
    is_read: false,
    status: 'pending',
    metadata: {
      preview: 'Hi Alex, can you send the technical specification sheet for the turbine pump?',
    },
    created_at: new Date(Date.now() - 1000 * 60 * 120).toISOString(), // 2 hours ago
  },
  {
    id: 'n-4',
    broker_id: 'broker_alex',
    customer_id: 'cust-david',
    customer_name: 'David Kim',
    customer_avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150',
    type: 'meeting',
    title: 'Meeting Schedule Request',
    description: 'Requested a 30-minute Zoom meeting for product demonstration and pricing negotiation.',
    related_meeting_id: 'meet-771',
    is_read: true,
    status: 'pending',
    metadata: {
      proposedDate: 'Tomorrow, 2:30 PM EST',
      duration: '30 mins',
      meetingType: 'Virtual Demo & Negotiation'
    },
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(), // 5 hours ago
  },
  {
    id: 'n-5',
    broker_id: 'broker_alex',
    customer_id: 'cust-amanda',
    customer_name: 'Amanda Brooks',
    customer_avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150',
    type: 'profile_request',
    title: 'Customer Profile Access Request',
    description: 'Amanda Brooks from Apex Logistics requested to connect and view your verified broker catalog.',
    is_read: true,
    status: 'accepted',
    metadata: {
      company: 'Apex Logistics Inc.',
      industry: 'Supply Chain & Logistics',
      connectionType: 'Full Broker Portfolio Access'
    },
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(), // 1 day ago
  },
  {
    id: 'n-6',
    broker_id: 'broker_alex',
    customer_id: 'cust-sarah',
    customer_name: 'Sarah Jenkins',
    customer_avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150',
    type: 'order',
    title: 'Order Status Update',
    description: 'Custom Order #ORD-9740 has been marked as Shipped.',
    related_order_id: 'ORD-9740',
    is_read: true,
    status: 'completed',
    metadata: {
      orderId: 'ORD-9740',
      totalAmount: 1890,
      itemSummary: 'Precision Steel Fasteners (500x)'
    },
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 36).toISOString(), // 1.5 days ago
  },
  {
    id: 'n-7',
    broker_id: 'broker_alex',
    customer_id: 'system',
    customer_name: 'BrokerHub System',
    type: 'general',
    title: 'Weekly Performance Digest Ready',
    description: 'Your listing visibility grew by +18.4% this week with 42 customer inquiries.',
    is_read: true,
    status: 'handled',
    metadata: {
      systemNotice: true,
      category: 'Analytics'
    },
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 72).toISOString(), // 3 days ago
  }
];

export const MOCK_CUSTOMER_PROFILES: Record<string, CustomerProfile> = {
  'cust-sarah': {
    id: 'cust-sarah',
    fullName: 'Sarah Jenkins',
    email: 'sarah.jenkins@novatech.io',
    phone: '+1 (555) 234-5678',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150',
    location: 'Chicago, IL, United States',
    joinedDate: 'Jan 2025',
    totalOrders: 6,
    totalSpent: 12450,
    status: 'Verified VIP Buyer',
    notes: 'Key decision maker for NovaTech procurement. Prefers direct calls.'
  },
  'cust-michael': {
    id: 'cust-michael',
    fullName: 'Michael Chen',
    email: 'm.chen@apexindustrial.com',
    phone: '+1 (555) 876-5432',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
    location: 'Austin, TX, United States',
    joinedDate: 'Nov 2024',
    totalOrders: 14,
    totalSpent: 38900,
    status: 'Enterprise Buyer',
    notes: 'Orders hydraulic parts in high volume quarterly.'
  },
  'cust-elena': {
    id: 'cust-elena',
    fullName: 'Elena Rodriguez',
    email: 'elena@solarpulse.org',
    phone: '+1 (555) 432-1098',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
    location: 'San Francisco, CA, United States',
    joinedDate: 'Feb 2025',
    totalOrders: 2,
    totalSpent: 4200,
    status: 'Active Customer',
    notes: 'Interested in renewable energy components and turbine assemblies.'
  },
  'cust-david': {
    id: 'cust-david',
    fullName: 'David Kim',
    email: 'david.kim@vanguardmfg.com',
    phone: '+1 (555) 901-2345',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150',
    location: 'Seattle, WA, United States',
    joinedDate: 'Dec 2024',
    totalOrders: 8,
    totalSpent: 21600,
    status: 'High Volume Buyer',
    notes: 'Looking for long-term supply agreements and scheduled deliveries.'
  },
  'cust-amanda': {
    id: 'cust-amanda',
    fullName: 'Amanda Brooks',
    email: 'abrooks@apexlogistics.com',
    phone: '+1 (555) 678-9012',
    avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150',
    location: 'Atlanta, GA, United States',
    joinedDate: 'Mar 2025',
    totalOrders: 1,
    totalSpent: 950,
    status: 'New Partner',
    notes: 'Evaluating our broker inventory for fleet maintenance.'
  }
};
