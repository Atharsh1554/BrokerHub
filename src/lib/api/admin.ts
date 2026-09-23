import { supabase } from '../supabase';
import type {
  AdminKpis,
  CustomerProfile,
  Broker,
  Product,
  Order,
  PaymentRecord,
  BrokerCustomerConnection,
  AdminReviewItem,
  AdminActivityLog,
} from '../../types';
import { brokers as mockBrokers, orders as mockOrders } from '../../data/mockData';
import { getProducts } from './products';

// Fallback initial data for smooth standalone dev experience
const initialCustomers: CustomerProfile[] = [
  {
    id: 'c1',
    fullName: 'Alice Johnson',
    email: 'alice@example.com',
    phone: '+91 98765 43210',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=150',
    location: 'Mumbai, MH',
    joinedDate: '2026-01-10',
    totalOrders: 4,
    totalSpent: 69297,
    brokerConnectionsCount: 3,
    status: 'active',
    lastActive: '10 mins ago',
  },
  {
    id: 'c2',
    fullName: 'Mark Stevens',
    email: 'mark@example.com',
    phone: '+91 98765 12345',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=150',
    location: 'Bangalore, KA',
    joinedDate: '2026-01-12',
    totalOrders: 2,
    totalSpent: 31800,
    brokerConnectionsCount: 1,
    status: 'active',
    lastActive: '1 hour ago',
  },
  {
    id: 'c3',
    fullName: 'Jenny Lee',
    email: 'jenny@example.com',
    phone: '+91 98123 45678',
    avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&q=80&w=150',
    location: 'Delhi, DL',
    joinedDate: '2026-01-15',
    totalOrders: 1,
    totalSpent: 35000,
    brokerConnectionsCount: 2,
    status: 'active',
    lastActive: '3 hours ago',
  },
  {
    id: 'c4',
    fullName: 'Robert Kim',
    email: 'robert@example.com',
    phone: '+91 97654 32109',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=150',
    location: 'Chennai, TN',
    joinedDate: '2026-01-18',
    totalOrders: 3,
    totalSpent: 12597,
    brokerConnectionsCount: 1,
    status: 'inactive',
    lastActive: '2 days ago',
  },
  {
    id: 'c5',
    fullName: 'Priya Sharma',
    email: 'priya@example.com',
    phone: '+91 91234 56789',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=150',
    location: 'Hyderabad, TS',
    joinedDate: '2026-02-01',
    totalOrders: 1,
    totalSpent: 12500,
    brokerConnectionsCount: 4,
    status: 'active',
    lastActive: 'Just now',
  },
];

const initialPayments: PaymentRecord[] = [
  {
    id: 'pay-101',
    transactionId: 'pay_RZP_9823412',
    orderId: 'ORD-7841',
    customerId: 'c1',
    customerName: 'Alice Johnson',
    brokerId: 'b1',
    brokerName: 'Marcus Chen',
    amount: 24900,
    paymentMethod: 'Razorpay',
    status: 'Successful',
    refundStatus: 'None',
    createdAt: '2026-01-15 14:30',
  },
  {
    id: 'pay-102',
    transactionId: 'pay_RZP_9823413',
    orderId: 'ORD-7842',
    customerId: 'c2',
    customerName: 'Mark Stevens',
    brokerId: 'b2',
    brokerName: 'Sarah Williams',
    amount: 31800,
    paymentMethod: 'Razorpay',
    status: 'Successful',
    refundStatus: 'None',
    createdAt: '2026-01-14 11:20',
  },
  {
    id: 'pay-103',
    transactionId: 'pay_RZP_9823414',
    orderId: 'ORD-7843',
    customerId: 'c3',
    customerName: 'Jenny Lee',
    brokerId: 'b3',
    brokerName: 'David Park',
    amount: 35000,
    paymentMethod: 'UPI',
    status: 'Pending',
    refundStatus: 'None',
    createdAt: '2026-01-13 16:45',
  },
  {
    id: 'pay-104',
    transactionId: 'pay_RZP_9823415',
    orderId: 'ORD-7844',
    customerId: 'c4',
    customerName: 'Robert Kim',
    brokerId: 'b1',
    brokerName: 'Marcus Chen',
    amount: 12597,
    paymentMethod: 'Card',
    status: 'Successful',
    refundStatus: 'None',
    createdAt: '2026-01-12 09:15',
  },
  {
    id: 'pay-105',
    transactionId: 'pay_RZP_9823416',
    orderId: 'ORD-7845',
    customerId: 'c5',
    customerName: 'Priya Sharma',
    brokerId: 'b4',
    brokerName: 'Elena Rodriguez',
    amount: 12500,
    paymentMethod: 'Razorpay',
    status: 'Refunded',
    refundStatus: 'Processed',
    createdAt: '2026-01-11 18:00',
  },
];

const initialConnections: BrokerCustomerConnection[] = [
  {
    id: 'conn-1',
    customerId: 'c1',
    customerName: 'Alice Johnson',
    customerEmail: 'alice@example.com',
    brokerId: 'b1',
    brokerName: 'Marcus Chen',
    brokerCompany: 'Apex Realty Group',
    status: 'Accepted',
    requestDate: '2026-01-10',
    responseDate: '2026-01-10',
  },
  {
    id: 'conn-2',
    customerId: 'c2',
    customerName: 'Mark Stevens',
    customerEmail: 'mark@example.com',
    brokerId: 'b2',
    brokerName: 'Sarah Williams',
    brokerCompany: 'Sterling Advisors',
    status: 'Accepted',
    requestDate: '2026-01-12',
    responseDate: '2026-01-13',
  },
  {
    id: 'conn-3',
    customerId: 'c5',
    customerName: 'Priya Sharma',
    customerEmail: 'priya@example.com',
    brokerId: 'b4',
    brokerName: 'Elena Rodriguez',
    brokerCompany: 'SecureLife Partners',
    status: 'Pending',
    requestDate: '2026-02-01',
  },
];

const initialReviews: AdminReviewItem[] = [
  {
    id: 'rev-1',
    customerId: 'c1',
    customerName: 'Alice Johnson',
    brokerId: 'b1',
    brokerName: 'Marcus Chen',
    productId: 'p1',
    productName: 'Quantum Smart Watch Series X',
    rating: 5,
    comment: 'Outstanding watch! Marcus provided excellent guidance on shipping timelines.',
    createdAt: '2026-01-16',
    status: 'Published',
  },
  {
    id: 'rev-2',
    customerId: 'c2',
    customerName: 'Mark Stevens',
    brokerId: 'b2',
    brokerName: 'Sarah Williams',
    productId: 'p2',
    productName: 'Studio Pro ANC Headphones',
    rating: 4,
    comment: 'Great sound quality and fast delivery. Very professional service.',
    createdAt: '2026-01-15',
    status: 'Published',
  },
  {
    id: 'rev-3',
    customerId: 'c4',
    customerName: 'Robert Kim',
    brokerId: 'b1',
    brokerName: 'Marcus Chen',
    productId: 'p5',
    productName: 'Super-Speed Charging Hub',
    rating: 1,
    comment: 'Package came slightly dented. Customer support was slow to respond.',
    createdAt: '2026-01-13',
    status: 'Reported',
  },
];

const initialActivityLogs: AdminActivityLog[] = [
  {
    id: 'log-1',
    adminName: 'Super Admin',
    adminEmail: 'admin@brokerhub.com',
    action: 'Admin Login',
    target: 'Admin Session',
    timestamp: new Date().toISOString(),
    ipAddress: '192.168.1.1',
    device: 'Chrome / Windows 11',
  },
];

// Helper to log admin activities
export const logAdminActivity = async (action: string, target: string) => {
  const newLog: AdminActivityLog = {
    id: `log-${Date.now()}`,
    adminName: 'Super Admin',
    adminEmail: 'admin@brokerhub.com',
    action,
    target,
    timestamp: new Date().toISOString(),
    ipAddress: '127.0.0.1',
    device: 'Web Client',
  };

  try {
    await supabase.from('admin_activity_logs').insert([{
      admin_name: newLog.adminName,
      admin_email: newLog.adminEmail,
      action: newLog.action,
      target: newLog.target,
      ip_address: newLog.ipAddress,
      device: newLog.device,
    }]);
  } catch {
    // Ignore DB error for local mode
  }

  try {
    const existing = JSON.parse(localStorage.getItem('brokerhub_admin_logs') || '[]');
    localStorage.setItem('brokerhub_admin_logs', JSON.stringify([newLog, ...existing]));
  } catch {
    // Ignore
  }
};

// 1. Fetch Admin KPIs
export const getAdminKpis = async (): Promise<AdminKpis> => {
  let customersCount = initialCustomers.length;
  let brokersList = [...mockBrokers];
  let productsList = await getAdminProducts();
  let ordersList = [...mockOrders];

  // Try DB counts if available
  try {
    const { count: cCount } = await supabase.from('users').select('*', { count: 'exact', head: true }).eq('role', 'customer');
    if (typeof cCount === 'number') customersCount = Math.max(customersCount, cCount);

    const { data: bData } = await supabase.from('brokers').select('*');
    if (bData && bData.length > 0) brokersList = bData;

    const { data: pData } = await supabase.from('products').select('*');
    if (pData && pData.length > 0) productsList = pData;

    const { data: oData } = await supabase.from('orders').select('*');
    if (oData && oData.length > 0) ordersList = oData;
  } catch {
    // Fallback to local
  }

  const activeBrokers = brokersList.filter(b => b.status === 'Connected' || b.status === 'Verified').length;
  const pendingBrokerApprovals = brokersList.filter(b => b.status === 'Under Review' || b.status === 'Pending Match').length;

  const activeProducts = productsList.filter(p => p.status !== 'Out of Stock').length;

  const totalOrders = ordersList.length;
  const pendingOrders = ordersList.filter(o => o.status === 'Pending').length;
  const completedOrders = ordersList.filter(o => o.status === 'Delivered' || o.status === 'COMPLETED').length;
  const cancelledOrders = ordersList.filter(o => o.status === 'Cancelled').length;

  const totalRevenue = ordersList.reduce((acc, o) => acc + (o.amount || o.totalAmount || 0), 0);
  const pendingPayments = initialPayments.filter(p => p.status === 'Pending').length;
  const completedPayments = initialPayments.filter(p => p.status === 'Successful').length;

  return {
    totalCustomers: customersCount,
    totalBrokers: brokersList.length,
    activeBrokers,
    pendingBrokerApprovals,
    totalProducts: productsList.length,
    activeProducts,
    totalOrders,
    pendingOrders,
    completedOrders,
    cancelledOrders,
    totalRevenue,
    pendingPayments,
    completedPayments,
    totalMeetings: 14,
    totalMessages: 184,
    pendingRequests: pendingBrokerApprovals + pendingOrders + pendingPayments,
  };
};

// 2. Fetch Customers
export const getAdminCustomers = async (): Promise<CustomerProfile[]> => {
  try {
    const { data } = await supabase.from('users').select('*').eq('role', 'customer');
    if (data && data.length > 0) {
      return data.map(u => ({
        id: u.id,
        fullName: u.full_name,
        email: u.email,
        phone: u.phone || 'N/A',
        avatar: u.avatar,
        joinedDate: u.created_at ? new Date(u.created_at).toISOString().split('T')[0] : '2026-01-10',
        totalOrders: 3,
        totalSpent: 45000,
        brokerConnectionsCount: 2,
        status: u.status || 'active',
        lastActive: 'Active recently',
      }));
    }
  } catch {
    // Fallback
  }

  const savedOverrides = localStorage.getItem('brokerhub_customer_status');
  if (savedOverrides) {
    const overrides = JSON.parse(savedOverrides);
    return initialCustomers.map(c => ({
      ...c,
      status: overrides[c.id] || c.status,
    }));
  }

  return initialCustomers;
};

export const updateCustomerStatus = async (customerId: string, status: 'active' | 'inactive' | 'suspended') => {
  try {
    await supabase.from('users').update({ status }).eq('id', customerId);
  } catch {
    // local fallback
  }
  const savedOverrides = JSON.parse(localStorage.getItem('brokerhub_customer_status') || '{}');
  savedOverrides[customerId] = status;
  localStorage.setItem('brokerhub_customer_status', JSON.stringify(savedOverrides));
  await logAdminActivity(`Customer Status Change`, `Customer ID: ${customerId} → ${status}`);
};

// 3. Fetch Brokers
export const getAdminBrokers = async (): Promise<Broker[]> => {
  try {
    const { data } = await supabase.from('brokers').select('*, users(full_name, email, phone, avatar)');
    if (data && data.length > 0) {
      return data.map(b => ({
        id: b.id,
        name: b.name || b.users?.full_name || 'Broker Name',
        specialty: b.specialty || 'General Brokerage',
        company: b.company || 'Independent',
        avatar: b.users?.avatar || b.avatar,
        location: b.location || 'India',
        status: b.status || 'Under Review',
        rating: b.rating || 4.5,
        reviewCount: b.review_count || 12,
        description: b.description || '',
        email: b.users?.email || 'broker@brokerhub.com',
        phone: b.users?.phone || '+91 98000 00000',
        totalProducts: 8,
        totalOrders: 24,
        totalSales: 350000,
        createdAt: b.created_at || '2026-01-10',
      }));
    }
  } catch {
    // Fallback
  }

  const savedStatus = JSON.parse(localStorage.getItem('brokerhub_broker_status') || '{}');
  return mockBrokers.map(b => ({
    ...b,
    status: savedStatus[b.id] || b.status,
    email: `${b.name.toLowerCase().replace(/\s+/g, '.')}@brokerhub.com`,
    phone: '+91 98765 00000',
    totalProducts: Math.floor(Math.random() * 10) + 2,
    totalOrders: Math.floor(Math.random() * 30) + 5,
    totalSales: Math.floor(Math.random() * 500000) + 50000,
    createdAt: '2026-01-10',
  }));
};

export const updateBrokerStatus = async (brokerId: string, status: Broker['status']) => {
  try {
    await supabase.from('brokers').update({ status }).eq('id', brokerId);
  } catch {
    // Fallback
  }
  const savedStatus = JSON.parse(localStorage.getItem('brokerhub_broker_status') || '{}');
  savedStatus[brokerId] = status;
  localStorage.setItem('brokerhub_broker_status', JSON.stringify(savedStatus));
  await logAdminActivity(`Broker Verification Status Change`, `Broker ID: ${brokerId} → ${status}`);
};

// 4. Products API
export const getAdminProducts = async (): Promise<Product[]> => {
  const allProducts = await getProducts(true);
  const savedAdminOverrides = JSON.parse(localStorage.getItem('brokerhub_product_admin_overrides') || '{}');

  return allProducts.map((p) => ({
    ...p,
    brokerName: p.brokerName || (p.brokerId === 'b1' ? 'Marcus Chen' : p.brokerId === 'b2' ? 'Sarah Williams' : 'David Park'),
    isActive: savedAdminOverrides[p.id]?.isActive !== undefined ? savedAdminOverrides[p.id].isActive : (p.isActive ?? true),
    ...savedAdminOverrides[p.id],
  }));
};

export const toggleProductActive = async (productId: string, currentActive: boolean) => {
  const newActive = !currentActive;
  try {
    await supabase.from('products').update({ is_active: newActive }).eq('id', productId);
  } catch {
    // Fallback
  }
  const savedOverrides = JSON.parse(localStorage.getItem('brokerhub_product_admin_overrides') || '{}');
  savedOverrides[productId] = { ...savedOverrides[productId], isActive: newActive };
  localStorage.setItem('brokerhub_product_admin_overrides', JSON.stringify(savedOverrides));
  await logAdminActivity('Product Visibility Change', `Product ID: ${productId} → ${newActive ? 'Active' : 'Inactive'}`);
};

export const deleteAdminProduct = async (productId: string) => {
  try {
    await supabase.from('products').delete().eq('id', productId);
  } catch {
    // Fallback
  }
  const savedDeleted = JSON.parse(localStorage.getItem('brokerhub_deleted_products') || '[]');
  if (!savedDeleted.includes(productId)) {
    savedDeleted.push(productId);
    localStorage.setItem('brokerhub_deleted_products', JSON.stringify(savedDeleted));
  }
  try {
    const customProds: Product[] = JSON.parse(localStorage.getItem('brokerhub_custom_products') || '[]');
    const updatedCustom = customProds.filter((p) => p.id !== productId);
    localStorage.setItem('brokerhub_custom_products', JSON.stringify(updatedCustom));
  } catch {}

  await logAdminActivity('Product Delete', `Product ID: ${productId}`);
};

// 5. Orders API
export const getAdminOrders = async (): Promise<Order[]> => {
  try {
    const { data } = await supabase.from('orders').select('*, order_items(*)');
    if (data && data.length > 0) {
      return data.map(o => ({
        id: o.id,
        customerId: o.customer_id,
        customerName: o.customer_name,
        totalAmount: o.total_amount,
        paymentStatus: o.payment_status || 'Successful',
        date: o.date ? new Date(o.date).toISOString().split('T')[0] : '2026-01-15',
        status: o.status || 'Pending',
        items: o.order_items?.map((i: any) => ({
          productName: i.product_name,
          quantity: i.quantity,
          unitPrice: i.unit_price,
        })) || [],
      }));
    }
  } catch {
    // Fallback
  }

  const savedStatus = JSON.parse(localStorage.getItem('brokerhub_order_status_overrides') || '{}');
  return mockOrders.map(o => ({
    ...o,
    paymentStatus: o.status === 'Cancelled' ? 'Refunded' : 'Successful',
    status: savedStatus[o.id] || o.status,
    brokerName: 'Marcus Chen',
  }));
};

export const updateOrderStatus = async (orderId: string, status: string) => {
  try {
    await supabase.from('orders').update({ status }).eq('id', orderId);
  } catch {
    // Fallback
  }
  const savedStatus = JSON.parse(localStorage.getItem('brokerhub_order_status_overrides') || '{}');
  savedStatus[orderId] = status;
  localStorage.setItem('brokerhub_order_status_overrides', JSON.stringify(savedStatus));
  await logAdminActivity('Order Status Modification', `Order ID: ${orderId} → ${status}`);
};

// 6. Payments API
export const getAdminPayments = async (): Promise<PaymentRecord[]> => {
  const saved = localStorage.getItem('brokerhub_payments');
  if (saved) {
    return JSON.parse(saved);
  }
  return initialPayments;
};

export const processPaymentRefund = async (paymentId: string) => {
  const payments = await getAdminPayments();
  const updated = payments.map(p => {
    if (p.id === paymentId) {
      return { ...p, status: 'Refunded' as const, refundStatus: 'Processed' as const };
    }
    return p;
  });
  localStorage.setItem('brokerhub_payments', JSON.stringify(updated));
  await logAdminActivity('Process Payment Refund', `Payment ID: ${paymentId}`);
};

// 7. Connections API
export const getAdminConnections = async (): Promise<BrokerCustomerConnection[]> => {
  const saved = localStorage.getItem('brokerhub_connections');
  if (saved) return JSON.parse(saved);
  return initialConnections;
};

// 8. Reviews API
export const getAdminReviews = async (): Promise<AdminReviewItem[]> => {
  const saved = localStorage.getItem('brokerhub_admin_reviews');
  if (saved) return JSON.parse(saved);
  return initialReviews;
};

export const updateReviewStatus = async (reviewId: string, status: 'Published' | 'Hidden' | 'Reported') => {
  const reviews = await getAdminReviews();
  const updated = reviews.map(r => r.id === reviewId ? { ...r, status } : r);
  localStorage.setItem('brokerhub_admin_reviews', JSON.stringify(updated));
  await logAdminActivity('Review Moderation', `Review ID: ${reviewId} → ${status}`);
};

// 9. Activity Logs API
export const getAdminActivityLogs = async (): Promise<AdminActivityLog[]> => {
  const saved = localStorage.getItem('brokerhub_admin_logs');
  if (saved) return JSON.parse(saved);
  return initialActivityLogs;
};

// 10. CSV Report Generator Utility
export const exportReportToCSV = (filename: string, headers: string[], rows: (string | number)[][]) => {
  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.map(val => `"${String(val).replace(/"/g, '""')}"`).join(',')),
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}_${new Date().toISOString().split('T')[0]}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
