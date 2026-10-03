import { supabase } from '../supabase';
import type { Order, ShippingAddress } from '../../types';

const isUuidStr = (str?: string) =>
  Boolean(str && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str));

/** Parse a raw Supabase order row into our typed Order object */
const parseOrderRow = (o: any): Order => {
  const rawAddr = o.shipping_address || {};
  const shippingAddress: ShippingAddress = {
    fullName: rawAddr.full_name || rawAddr.fullName || o.customer_name || '',
    phone: rawAddr.phone || o.customer_phone || '',
    addressLine1: rawAddr.address_line_1 || rawAddr.addressLine1 || o.delivery_address || '',
    addressLine2: rawAddr.address_line_2 || rawAddr.addressLine2 || '',
    city: rawAddr.city || '',
    state: rawAddr.state || '',
    pincode: rawAddr.pincode || rawAddr.zip || '',
    landmark: rawAddr.landmark || '',
  };

  const formattedDeliveryAddress =
    o.delivery_address ||
    [
      shippingAddress.addressLine1,
      shippingAddress.addressLine2,
      shippingAddress.city,
      shippingAddress.state,
      shippingAddress.pincode,
      shippingAddress.landmark ? `(Landmark: ${shippingAddress.landmark})` : '',
    ]
      .filter(Boolean)
      .join(', ');

  const items = (o.order_items || []).map((i: any) => {
    const cleanName = (i.product_name || '')
      .replace(/\[Broker:[^\]]+\]/g, '')
      .replace(/\(BrokerID:[^)]+\)/g, '')
      .trim();
    return {
      id: i.id,
      productId: i.product_id || undefined,
      productName: cleanName,
      productImage: i.product_image || undefined,
      quantity: i.quantity,
      unitPrice: i.unit_price,
      totalPrice: i.unit_price * i.quantity,
      brokerId: i.broker_id || o.broker_id || '',
      brokerName: i.broker_name || o.broker_name || 'Verified Broker',
    };
  });

  const productSummary =
    items.length > 0
      ? items.map((i: any) => `${i.productName} (x${i.quantity})`).join(', ')
      : o.product_name
      ? `${o.product_name} (x${o.quantity || 1})`
      : 'Order';

  return {
    id: o.id,
    customerId: o.customer_id,
    customerName: o.customer_name,
    customerEmail: o.customer_email || '',
    customerPhone: o.customer_phone || shippingAddress.phone || '',
    brokerId: o.broker_id || '',
    brokerName: o.broker_name || 'Verified Broker',
    productName: o.product_name || (items[0]?.productName ?? ''),
    productImage: o.product_image || (items[0]?.productImage ?? ''),
    quantity: o.quantity || items.reduce((s: number, i: any) => s + i.quantity, 0) || 1,
    price: o.price || (items[0]?.unitPrice ?? 0),
    totalAmount: o.total_amount || o.amount || 0,
    amount: o.total_amount || o.amount || 0,
    paymentStatus: o.payment_status || 'Successful',
    paymentMethod: o.payment_method || 'Online Payment',
    transactionId: o.transaction_id || `TXN-${(o.id || '').slice(0, 8)}`,
    deliveryAddress: formattedDeliveryAddress,
    shippingAddress,
    customerRequirements: o.customer_requirements || o.notes || '',
    items,
    product: productSummary,
    date: o.date || o.created_at,
    createdAt: o.created_at || o.date,
    status: o.status || 'Pending',
  };
};

export const getOrders = async (userId: string, role: 'customer' | 'broker'): Promise<Order[]> => {
  if (!isUuidStr(userId)) return [];

  if (role === 'customer') {
    const { data, error } = await supabase
      .from('orders')
      .select('*, order_items(*)')
      .eq('customer_id', userId)
      .order('created_at', { ascending: false });
    if (error) {
      console.error('Error fetching customer orders:', error);
      return [];
    }
    return (data || []).map(parseOrderRow);
  }

  // Broker: fetch by order-level broker_id AND item-level broker_id (multi-broker support)
  const { data: directOrders, error: e1 } = await supabase
    .from('orders')
    .select('*, order_items(*)')
    .eq('broker_id', userId)
    .order('created_at', { ascending: false });
  if (e1) console.error('Error fetching broker direct orders:', e1);

  const { data: itemOrders, error: e2 } = await supabase
    .from('orders')
    .select('*, order_items!inner(*)')
    .eq('order_items.broker_id', userId)
    .order('created_at', { ascending: false });
  if (e2) console.error('Error fetching broker item orders:', e2);

  const map = new Map<string, any>();
  (directOrders || []).forEach((o) => map.set(o.id, o));
  (itemOrders || []).forEach((o) => { if (!map.has(o.id)) map.set(o.id, o); });
  return Array.from(map.values()).map(parseOrderRow);
};

/**
 * Creates a permanent order record in Supabase (orders and order_items)
 */
export const createOrderInDB = async (payload: {
  customerId: string;
  customerName: string;
  customerEmail?: string;
  customerPhone?: string;
  brokerId?: string;
  brokerName?: string;
  totalAmount: number;
  paymentStatus?: string;
  paymentMethod?: string;
  deliveryAddress?: string;
  shippingAddress?: ShippingAddress;
  customerRequirements?: string;
  items: {
    productId?: string;
    productName: string;
    productImage?: string;
    quantity: number;
    unitPrice: number;
    brokerId?: string;
    brokerName?: string;
  }[];
}): Promise<Order | null> => {
  try {
    let validCustomerId = isUuidStr(payload.customerId) ? payload.customerId : '';

    if (!validCustomerId) {
      const { data: userRows } = await supabase.from('users').select('id').limit(1);
      if (userRows && userRows.length > 0) {
        validCustomerId = userRows[0].id;
      } else {
        validCustomerId = '9f0e8795-a2e6-4c11-afba-2dd7b34fc638';
      }
    }

    // Primary broker from the first item or payload-level fallback
    const primaryBrokerId =
      payload.items.find((i) => i.brokerId)?.brokerId || payload.brokerId || '';
    const primaryBrokerName =
      payload.items.find((i) => i.brokerName)?.brokerName || payload.brokerName || 'Verified Broker';

    // Build immutable shipping address snapshot at time of order placement
    const shippingAddressSnapshot: ShippingAddress = payload.shippingAddress || {
      fullName: payload.customerName,
      phone: payload.customerPhone || '',
      addressLine1: payload.deliveryAddress || '',
      city: '',
      state: '',
      pincode: '',
    };

    const formattedDeliveryAddress =
      payload.deliveryAddress ||
      [
        shippingAddressSnapshot.addressLine1,
        shippingAddressSnapshot.addressLine2,
        shippingAddressSnapshot.city,
        shippingAddressSnapshot.state,
        shippingAddressSnapshot.pincode,
        shippingAddressSnapshot.landmark ? `(Landmark: ${shippingAddressSnapshot.landmark})` : '',
      ]
        .filter(Boolean)
        .join(', ');

    // 1. Insert order row
    const orderInsertObj: any = {
      customer_id: validCustomerId,
      customer_name: payload.customerName || 'Customer',
      customer_email: payload.customerEmail || '',
      customer_phone: payload.customerPhone || shippingAddressSnapshot.phone || '',
      broker_id: isUuidStr(primaryBrokerId) ? primaryBrokerId : null,
      broker_name: primaryBrokerName,
      total_amount: payload.totalAmount || 0,
      payment_status: payload.paymentStatus || 'Successful',
      status: 'Pending',
      delivery_address: formattedDeliveryAddress,
      // Stored as JSONB — this is an immutable snapshot of the delivery address
      shipping_address: {
        full_name: shippingAddressSnapshot.fullName || payload.customerName,
        phone: shippingAddressSnapshot.phone || payload.customerPhone || '',
        address_line_1: shippingAddressSnapshot.addressLine1 || '',
        address_line_2: shippingAddressSnapshot.addressLine2 || '',
        city: shippingAddressSnapshot.city || '',
        state: shippingAddressSnapshot.state || '',
        pincode: shippingAddressSnapshot.pincode || '',
        landmark: shippingAddressSnapshot.landmark || '',
      },
    };

    let newOrder: any = null;
    let orderErr: any = null;

    const res = await supabase.from('orders').insert([orderInsertObj]).select('*').single();
    newOrder = res.data;
    orderErr = res.error;

    // Retry with minimal columns if schema cache is stale
    if (orderErr) {
      console.warn('Initial order insert failed, trying fallback...', orderErr);
      const fallbackRes = await supabase
        .from('orders')
        .insert([{
          customer_id: validCustomerId,
          customer_name: payload.customerName || 'Customer',
          broker_id: isUuidStr(primaryBrokerId) ? primaryBrokerId : null,
          broker_name: primaryBrokerName,
          total_amount: payload.totalAmount || 0,
          status: 'Pending',
        }])
        .select('*')
        .single();
      newOrder = fallbackRes.data;
      orderErr = fallbackRes.error;
    }

    if (orderErr || !newOrder) {
      console.error('Error creating order in DB:', orderErr);
      return null;
    }

    // 2. Insert order_items — store clean product names + product_id, image, broker per item
    if (payload.items && payload.items.length > 0) {
      const itemsToInsert = payload.items.map((item) => ({
        order_id: newOrder.id,
        product_id: isUuidStr(item.productId) ? item.productId : null,
        product_name: item.productName, // clean name, no broker tags
        product_image: item.productImage || null,
        quantity: item.quantity,
        unit_price: item.unitPrice,
        broker_id: isUuidStr(item.brokerId) ? item.brokerId : null,
        broker_name: item.brokerName || primaryBrokerName,
      }));

      const { error: itemsErr } = await supabase.from('order_items').insert(itemsToInsert);
      if (itemsErr) console.error('Error inserting order items:', itemsErr);
    }

    // 3. Notify every unique broker involved in this order
    const uniqueBrokers = new Map<string, string>();
    // Include order-level broker
    if (isUuidStr(primaryBrokerId)) {
      uniqueBrokers.set(primaryBrokerId, primaryBrokerName);
    }
    // Include item-level brokers
    for (const item of payload.items) {
      if (isUuidStr(item.brokerId) && item.brokerId) {
        uniqueBrokers.set(item.brokerId, item.brokerName || primaryBrokerName);
      }
    }

    if (uniqueBrokers.size > 0 && isUuidStr(validCustomerId)) {
      const productSummary = payload.items
        .slice(0, 2)
        .map((i) => `${i.productName} (x${i.quantity})`)
        .join(', ');
      const notifRows = Array.from(uniqueBrokers.entries()).map(([bId]) => ({
        broker_id: bId,
        customer_id: validCustomerId,
        customer_name: payload.customerName || 'Customer',
        type: 'order',
        title: `New Order #${newOrder.id.slice(0, 8)} received`,
        description: `${payload.customerName} placed an order: ${productSummary}${payload.items.length > 2 ? ` +${payload.items.length - 2} more` : ''}. Total: ₹${payload.totalAmount.toLocaleString('en-IN')}`,
        is_read: false,
        status: 'pending',
      }));
      const { error: notifErr } = await supabase.from('broker_notifications').insert(notifRows);
      if (notifErr) console.error('Error inserting broker notifications:', notifErr);
    }

    return {
      id: newOrder.id,
      customerId: payload.customerId,
      customerName: payload.customerName,
      customerEmail: payload.customerEmail || '',
      customerPhone: payload.customerPhone || shippingAddressSnapshot.phone || '',
      brokerId: primaryBrokerId,
      brokerName: primaryBrokerName,
      totalAmount: payload.totalAmount,
      amount: payload.totalAmount,
      paymentStatus: payload.paymentStatus || 'Successful',
      paymentMethod: payload.paymentMethod || 'Online Payment',
      transactionId: `TXN-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`,
      deliveryAddress: formattedDeliveryAddress,
      shippingAddress: shippingAddressSnapshot,
      customerRequirements: payload.customerRequirements || '',
      date: newOrder.created_at || new Date().toISOString(),
      createdAt: newOrder.created_at || new Date().toISOString(),
      status: 'Pending',
      product: payload.items.map((i) => `${i.productName} (x${i.quantity})`).join(', '),
      items: payload.items.map((i) => ({
        productId: i.productId,
        productName: i.productName,
        productImage: i.productImage,
        quantity: i.quantity,
        unitPrice: i.unitPrice,
        totalPrice: i.unitPrice * i.quantity,
        brokerId: i.brokerId || primaryBrokerId,
        brokerName: i.brokerName || primaryBrokerName,
      })),
    };
  } catch (err) {
    console.error('Failed to create order in database:', err);
    return null;
  }
};

/**
 * Update order status in Supabase database and notify the customer
 */
export const updateOrderStatusInDB = async (orderId: string, newStatus: string): Promise<boolean> => {
  if (!isUuidStr(orderId)) return false;

  // Fetch the order first so we can notify the customer
  const { data: orderRow, error: fetchErr } = await supabase
    .from('orders')
    .select('id, customer_id, customer_name, broker_id, broker_name, total_amount, product_name')
    .eq('id', orderId)
    .single();

  if (fetchErr) console.warn('Could not fetch order for notification:', fetchErr.message);

  // Update status (do NOT set updated_at — column may not exist in DB)
  const { error } = await supabase
    .from('orders')
    .update({ status: newStatus })
    .eq('id', orderId);

  if (error) {
    console.error('Error updating order status in DB:', error);
    return false;
  }

  // Notify the customer about the status change
  if (orderRow && isUuidStr(orderRow.customer_id) && isUuidStr(orderRow.broker_id)) {
    const statusLabels: Record<string, string> = {
      Processing: 'approved and is being processed',
      'In Transit': 'shipped and is on its way',
      Delivered: 'delivered successfully',
      Cancelled: 'cancelled',
    };
    const label = statusLabels[newStatus] || `updated to "${newStatus}"`;
    await supabase.from('broker_notifications').insert({
      broker_id: orderRow.broker_id,
      customer_id: orderRow.customer_id,
      customer_name: orderRow.customer_name || 'Customer',
      type: 'order_update',
      title: `Order #${orderId.slice(0, 8)} ${newStatus}`,
      description: `Your order has been ${label} by ${orderRow.broker_name || 'your broker'}.`,
      is_read: false,
      status: 'pending',
    });
  }

  return true;
};


/**
 * Format numerical amounts in compact Indian Rupee format (e.g. ₹0, ₹50k, ₹1.2L, ₹1.5Cr)
 */
export const formatRupeeCompact = (val: number): string => {
  if (!val || val === 0) return '₹0';
  if (val >= 10000000) return `₹${(val / 10000000).toFixed(1)}Cr`;
  if (val >= 100000) return `₹${(val / 100000).toFixed(1)}L`;
  if (val >= 1000) return `₹${(val / 1000).toFixed(0)}k`;
  return `₹${val.toLocaleString('en-IN')}`;
};

/**
 * Format exact currency in Indian Rupees with symbol
 */
export const formatRupeeExact = (val: number): string => {
  return `₹${(val || 0).toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
};
