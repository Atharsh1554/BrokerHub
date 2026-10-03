export interface ShippingAddress {
  fullName?: string;
  phone?: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  pincode: string;
  landmark?: string;
}

export type UserRole = 'customer' | 'broker' | 'admin' | 'super_admin' | 'moderator';

export interface User {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  addressLine1?: string;
  addressLine2?: string;
  city?: string;
  state?: string;
  pincode?: string;
  landmark?: string;
  address?: string;
  avatar?: string;
  role: UserRole;
  status?: 'active' | 'inactive' | 'suspended';
  createdAt?: string;
}

export interface Broker {
  id: string;
  name: string;
  specialty: string;
  company: string;
  avatar?: string;
  location?: string;
  status: 'Connected' | 'Under Review' | 'Pending Match' | 'Verified' | 'Suspended' | 'Rejected';
  rating: number;
  reviewCount: number;
  description?: string;
  email?: string;
  phone?: string;
  totalProducts?: number;
  totalOrders?: number;
  totalSales?: number;
  createdAt?: string;
}

export interface Product {
  id: string;
  name: string;
  price: number;
  image: string;
  images?: string[];
  category: string;
  stock: number;
  status: 'In Stock' | 'Out of Stock' | 'Low Stock';
  description?: string;
  brokerId?: string;
  brokerName?: string;
  rating?: number;
  reviewCount?: number;
  specifications?: Record<string, string>;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface CartItem {
  productId: string;
  productName: string;
  productImage: string;
  brokerId: string;
  brokerName: string;
  price: number;
  quantity: number;
  totalPrice?: number;
}

export interface ProductReview {
  id: string;
  customerId: string;
  customerName: string;
  customerAvatar?: string;
  rating: number;
  comment: string;
  createdAt: string;
}

export interface OrderItem {
  id?: string;
  productId?: string;
  productName: string;
  productImage?: string;
  quantity: number;
  unitPrice: number;
  totalPrice?: number;
  brokerId?: string;
  brokerName?: string;
}

export interface Order {
  id: string;
  customerId: string;
  customerName: string;
  customerEmail?: string;
  customerPhone?: string;
  brokerId?: string;
  brokerName?: string;
  product?: string;
  productName?: string;
  productImage?: string;
  quantity?: number;
  price?: number;
  amount?: number;
  totalAmount?: number;
  paymentStatus?: 'Pending' | 'Successful' | 'Failed' | 'Refunded' | string;
  paymentMethod?: string;
  transactionId?: string;
  deliveryAddress?: string;
  shippingAddress?: ShippingAddress;
  customerRequirements?: string;
  items?: OrderItem[];
  date: string;
  createdAt?: string;
  updatedAt?: string;
  status: 'Delivered' | 'In Transit' | 'Pending' | 'Cancelled' | 'Processing' | 'Shipped' | 'ACCEPTED' | 'COMPLETED' | 'REFUNDED' | 'Confirmed' | string;
}

export interface Notification {
  id: string;
  type: 'call_request' | 'order_alert' | 'general' | 'broker_request' | 'meeting' | 'message';
  title: string;
  description: string;
  timestamp: string;
  read: boolean;
  sender?: string;
  receiver?: string;
  actions?: { label: string; variant: 'primary' | 'secondary' }[];
}

export type BrokerNotificationType = 
  | 'call_request' 
  | 'message' 
  | 'order' 
  | 'meeting' 
  | 'profile_request' 
  | 'reverse_auction'
  | 'general';

export type NotificationStatus = 'pending' | 'accepted' | 'rejected' | 'completed' | 'handled';

export interface BrokerNotification {
  id: string;
  broker_id: string;
  customer_id: string;
  customer_name: string;
  customer_avatar?: string;
  type: BrokerNotificationType;
  title: string;
  description?: string;
  related_order_id?: string;
  related_meeting_id?: string;
  related_product_id?: string;
  related_conversation_id?: string;
  is_read: boolean;
  status: NotificationStatus;
  metadata?: Record<string, any>;
  created_at: string;
}

export type ReverseAuctionStatus = 'OPEN' | 'ACCEPTED' | 'IN_PROGRESS' | 'LEVEL_1' | 'LEVEL_2' | 'LEVEL_3' | 'READY' | 'DELIVERED' | 'COMPLETED' | 'CANCELLED' | 'Active' | 'Ending Soon' | 'Broker approved' | 'Completed' | 'Cancelled' | 'Draft' | 'DRAFT' | (string & {});

export interface ReverseAuction {
  id: string;
  customerId: string;
  customerName: string;
  customerCompany?: string;
  customerEmail?: string;
  customerPhone?: string;
  contactName?: string;
  deliveryLocation?: string;
  title: string;
  category: string;
  productId?: string;
  productName?: string;
  productImage?: string;
  photos?: string[];
  quantity: number;
  description: string;
  specifications?: Record<string, string>;
  startingPrice: number;
  budgetText?: string;
  deadlineDate?: string;
  activityText?: string;
  currentLowestBid?: number;
  lowestBidderId?: string;
  lowestBidderName?: string;
  bidCount: number;
  startTime: string;
  endTime: string;
  status: ReverseAuctionStatus;
  statusPill?: string;
  currentLevel?: string;
  assignedBrokerId?: string;
  assignedBrokerName?: string;
  winningBidId?: string;
  winningBrokerId?: string;
  winningBrokerName?: string;
  deliveryProofPhotos?: string[];
  deliveryConfirmedText?: string;
  completedAt?: string;
  cancelledAt?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface ReverseAuctionBid {
  id: string;
  auctionId: string;
  brokerId: string;
  brokerName: string;
  brokerCompany?: string;
  brokerAvatar?: string;
  bidAmount: number;
  bidAmountText?: string;
  leadTimeDays?: number;
  leadTimeText?: string;
  offerNote?: string;
  notes?: string;
  status: 'Active' | 'Lowest' | 'Outbid' | 'Accepted' | 'Rejected' | 'Approved' | 'Reviewed' | 'Received';
  createdAt: string;
  updatedAt?: string;
}

export interface CustomerProfile {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  avatar?: string;
  location?: string;
  joinedDate?: string;
  totalOrders?: number;
  totalSpent?: number;
  brokerConnectionsCount?: number;
  notes?: string;
  status?: 'active' | 'inactive' | 'suspended' | string;
  lastActive?: string;
}

export interface Message {
  id: string;
  senderId: string;
  senderName: string;
  senderAvatar?: string;
  content: string;
  timestamp: string;
  isOwn: boolean;
}

export interface Conversation {
  id: string;
  contactName: string;
  contactAvatar?: string;
  lastMessage: string;
  timestamp: string;
  unread: number;
  online: boolean;
  lastUpdated?: number;
}

export interface Appointment {
  id: string;
  customerId?: string;
  customerName?: string;
  brokerId?: string;
  brokerName: string;
  brokerAvatar?: string;
  date: string;
  time: string;
  type: string;
  status: 'Confirmed' | 'Pending' | 'Cancelled' | 'Requested' | 'Accepted' | 'Rejected' | 'Completed';
  notes?: string;
  createdAt?: string;
}

export interface StatCardData {
  label: string;
  value: string | number;
  change?: number;
  changeLabel?: string;
  icon?: React.ReactNode;
  color?: string;
}

export interface ActivityItem {
  id: string;
  text: string;
  timestamp: string;
  type: 'broker_match' | 'message' | 'appointment' | 'order' | 'general';
}

// Admin Specific Types
export interface AdminKpis {
  totalCustomers: number;
  totalBrokers: number;
  activeBrokers: number;
  pendingBrokerApprovals: number;
  totalProducts: number;
  activeProducts: number;
  totalOrders: number;
  pendingOrders: number;
  completedOrders: number;
  cancelledOrders: number;
  totalRevenue: number;
  pendingPayments: number;
  completedPayments: number;
  totalMeetings: number;
  totalMessages: number;
  pendingRequests: number;
}

export interface PaymentRecord {
  id: string;
  transactionId: string;
  orderId: string;
  customerId: string;
  customerName: string;
  brokerId: string;
  brokerName: string;
  amount: number;
  paymentMethod: 'Razorpay' | 'UPI' | 'Card' | 'NetBanking' | 'Wallet';
  status: 'Successful' | 'Pending' | 'Failed' | 'Refunded';
  refundStatus?: 'None' | 'Requested' | 'Processed' | 'Failed';
  createdAt: string;
}

export interface BrokerCustomerConnection {
  id: string;
  customerId: string;
  customerName: string;
  customerEmail: string;
  brokerId: string;
  brokerName: string;
  brokerCompany: string;
  status: 'Pending' | 'Accepted' | 'Rejected';
  requestDate: string;
  responseDate?: string;
}

export interface AdminReviewItem {
  id: string;
  customerId: string;
  customerName: string;
  brokerId?: string;
  brokerName?: string;
  productId?: string;
  productName?: string;
  rating: number;
  comment: string;
  createdAt: string;
  status: 'Published' | 'Hidden' | 'Reported';
}

export interface AdminActivityLog {
  id: string;
  adminName: string;
  adminEmail: string;
  action: string;
  target: string;
  timestamp: string;
  ipAddress?: string;
  device?: string;
}

export type AnalyticsDateFilter = 'today' | '7days' | '30days' | '3months' | '1year' | 'custom';

