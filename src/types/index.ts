export interface User {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  avatar?: string;
  role: 'customer' | 'broker';
}

export interface Broker {
  id: string;
  name: string;
  specialty: string;
  company: string;
  avatar?: string;
  status: 'Connected' | 'Under Review' | 'Pending Match';
  rating: number;
  reviewCount: number;
  description?: string;
}

export interface Product {
  id: string;
  name: string;
  price: number;
  image: string;
  category: string;
  stock: number;
  status: 'In Stock' | 'Out of Stock' | 'Low Stock';
  description?: string;
}

export interface OrderItem {
  productName: string;
  quantity: number;
  unitPrice: number;
}

export interface Order {
  id: string;
  customerId: string;
  customerName: string;
  product?: string;
  quantity?: number;
  amount?: number;
  totalAmount?: number;
  items?: OrderItem[];
  date: string;
  status: 'Delivered' | 'In Transit' | 'Pending' | 'Cancelled' | 'Processing' | 'Shipped' | string;
}

export interface Notification {
  id: string;
  type: 'call_request' | 'order_alert' | 'general';
  title: string;
  description: string;
  timestamp: string;
  read: boolean;
  actions?: { label: string; variant: 'primary' | 'secondary' }[];
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
}

export interface Appointment {
  id: string;
  brokerName: string;
  brokerAvatar?: string;
  date: string;
  time: string;
  type: string;
  status: 'Confirmed' | 'Pending' | 'Cancelled';
  notes?: string;
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
