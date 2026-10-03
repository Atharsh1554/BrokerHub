import React, { createContext, useContext, useState, useEffect } from 'react';
import type { Broker, Product, Order, Notification, Conversation, Message, Appointment, CartItem } from '../types';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthContext';
import { getBrokers } from '../lib/api/brokers';
import { 
  getProducts, 
  getBrokerProducts, 
  createBrokerProduct, 
  updateBrokerProduct, 
  deleteBrokerProduct 
} from '../lib/api/products';
import { getOrders } from '../lib/api/orders';
import { getAppointments } from '../lib/api/appointments';
import { sendDBMessage, getUserConversations, getMessagesBetweenUsers } from '../lib/api/messages';

interface Toast {
  id: string;
  message: string;
  type: 'success' | 'info' | 'warning';
}

interface AppContextType {
  brokers: Broker[];
  products: Product[];
  brokerProducts: Product[];
  brokerProductsLoading: boolean;
  orders: Order[];
  notifications: Notification[];
  conversations: Conversation[];
  messagesMap: Record<string, Message[]>;
  appointments: Appointment[];
  toasts: Toast[];
  cart: CartItem[];
  cartCount: number;

  // Actions
  refreshBrokers: () => Promise<void>;
  loadBrokerProducts: (brokerId?: string) => Promise<void>;
  sendMessage: (convId: string, text: string, isOwn?: boolean) => void;
  fetchConversationMessages: (convId: string) => Promise<void>;
  addProduct: (product: Omit<Product, 'id'>) => Promise<void>;
  updateProduct: (id: string, product: Partial<Product>) => Promise<void>;
  deleteProduct: (id: string) => Promise<void>;
  addOrder: (order: Order) => void;
  updateOrderStatus: (orderId: string, status: string) => void;
  resetOrders: () => Promise<void>;
  addAppointment: (appointment: Omit<Appointment, 'id'>) => void;
  cancelAppointment: (id: string) => void;
  toggleConnectBroker: (brokerId: string) => void;
  markNotificationRead: (id: string) => void;
  showToast: (message: string, type?: 'success' | 'info' | 'warning') => void;
  removeToast: (id: string) => void;
  addToCart: (item: CartItem) => void;
  removeFromCart: (productId: string) => void;
  updateCartQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  clearConversationUnread: (convId: string) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  
  const [brokers, setBrokers] = useState<Broker[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [brokerProducts, setBrokerProducts] = useState<Product[]>([]);
  const [brokerProductsLoading, setBrokerProductsLoading] = useState<boolean>(false);

  // Orders state — initialize from localStorage
  const [orders, setOrders] = useState<Order[]>(() => {
    try {
      const saved = localStorage.getItem('brokerhub_orders');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [messagesMap, setMessagesMap] = useState<Record<string, Message[]>>({});
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [toasts, setToasts] = useState<Toast[]>([]);

  // Persist orders to localStorage whenever changed
  useEffect(() => {
    try {
      localStorage.setItem('brokerhub_orders', JSON.stringify(orders));
    } catch {}
  }, [orders]);

  // Cart state — load from localStorage on init
  const [cart, setCart] = useState<CartItem[]>(() => {
    try {
      const saved = localStorage.getItem('brokerhub_cart');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Persist cart to localStorage whenever it changes
  useEffect(() => {
    try {
      localStorage.setItem('brokerhub_cart', JSON.stringify(cart));
    } catch {
      // ignore storage errors
    }
  }, [cart]);

  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  const loadBrokersList = async () => {
    const fetchedBrokers = await getBrokers();
    let overrides: Record<string, Partial<Broker>> = {};
    try {
      const raw = localStorage.getItem('brokerhub_broker_overrides');
      if (raw) overrides = JSON.parse(raw);
    } catch {}

    const mapWithOverrides = (b: Broker): Broker => {
      const ov = overrides[b.id];
      if (!ov) return b;
      return {
        ...b,
        ...ov,
      };
    };

    setBrokers(fetchedBrokers.map(mapWithOverrides));
  };

  const refreshBrokers = async () => {
    await loadBrokersList();
  };

  const loadBrokerProducts = async (bId?: string) => {
    const targetId = bId || user?.id;
    if (!targetId) {
      setBrokerProducts([]);
      return;
    }
    setBrokerProductsLoading(true);
    try {
      const bProds = await getBrokerProducts(targetId);
      setBrokerProducts(bProds);
    } catch (err) {
      console.error('Error loading broker products:', err);
    } finally {
      setBrokerProductsLoading(false);
    }
  };

  // Fetch real data on mount or when user changes
  useEffect(() => {
    const loadData = async () => {
      await loadBrokersList();
      
      const fetchedProducts = await getProducts();
      setProducts(fetchedProducts);
      
      if (user) {
        // Load broker-specific products if user is a broker
        if (user.role === 'broker') {
          await loadBrokerProducts(user.id);
        } else {
          setBrokerProducts([]);
        }

        const userRole = user.role === 'broker' ? 'broker' : 'customer';
        const fetchedOrders = await getOrders(user.id, userRole);
        setOrders(fetchedOrders);
        
        const fetchedAppointments = await getAppointments(user.id, userRole);
        setAppointments(fetchedAppointments);

        // Fetch conversations
        const dbConvs = await getUserConversations(user.id);
        if (dbConvs.length > 0) {
          setConversations(dbConvs);
          // Load messages for initial conversations
          for (const conv of dbConvs) {
            const msgs = await getMessagesBetweenUsers(user.id, conv.id);
            if (msgs.length > 0) {
              setMessagesMap((prev) => ({ ...prev, [conv.id]: msgs }));
            }
          }
        }
        
        // Fetch notifications
        const { data: notifs } = await supabase
          .from('broker_notifications')
          .select('*')
          .or(`broker_id.eq.${user.id},customer_id.eq.${user.id}`)
          .order('created_at', { ascending: false });
          
        if (notifs) {
          setNotifications(notifs.map(n => ({
            id: n.id,
            type: n.type as any,
            title: n.title,
            description: n.description || '',
            timestamp: new Date(n.created_at).toLocaleString(),
            read: n.is_read
          })));
        }
      } else {
        // Reset broker-specific state when logged out
        setBrokerProducts([]);
      }
    };
    
    loadData();
  }, [user]);

  // Listen for real-time broker profile updates
  useEffect(() => {
    let bc: BroadcastChannel | null = null;
    try {
      bc = new BroadcastChannel('brokerhub_brokers_live');
      bc.onmessage = () => {
        loadBrokersList();
      };
    } catch {}

    const handleStorage = (e: StorageEvent) => {
      if (e.key === 'brokerhub_broker_overrides') {
        loadBrokersList();
      }
    };
    window.addEventListener('storage', handleStorage);

    const brokersRealtime = supabase
      .channel('public_brokers_realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'brokers' },
        () => {
          loadBrokersList();
        }
      )
      .subscribe();

    return () => {
      bc?.close();
      window.removeEventListener('storage', handleStorage);
      supabase.removeChannel(brokersRealtime);
    };
  }, []);

  // Listen for BroadcastChannel orders live updates across tabs/pages
  useEffect(() => {
    let bc: BroadcastChannel | null = null;
    try {
      bc = new BroadcastChannel('brokerhub_orders_live');
      bc.onmessage = (event) => {
        if (event.data?.type === 'NEW_ORDER' && event.data?.order) {
          setOrders((prev) => {
            if (prev.some((o) => o.id === event.data.order.id)) return prev;
            return [event.data.order, ...prev];
          });
        } else if (event.data?.type === 'ORDER_STATUS_UPDATE' && event.data?.orderId) {
          setOrders((prev) =>
            prev.map((o) => (o.id === event.data.orderId ? { ...o, status: event.data.newStatus } : o))
          );
        }
      };
    } catch {}

    return () => {
      bc?.close();
    };
  }, []);

  // Listen for Supabase Realtime orders, payments & notifications changes
  useEffect(() => {
    if (!user) return;

    const userRole = user.role === 'broker' ? 'broker' : 'customer';

    const handleOrdersReload = async () => {
      const freshOrders = await getOrders(user.id, userRole);
      setOrders(freshOrders);
    };

    const ordersChannel = supabase
      .channel(`public_orders_realtime_${user.id}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'orders' },
        (payload) => {
          handleOrdersReload();
          if (payload.eventType === 'INSERT') {
            showToast('🔔 New order activity detected!', 'info');
          }
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'broker_notifications' },
        async () => {
          const { data: notifs } = await supabase
            .from('broker_notifications')
            .select('*')
            .or(`broker_id.eq.${user.id},customer_id.eq.${user.id}`)
            .order('created_at', { ascending: false });

          if (notifs) {
            setNotifications(
              notifs.map((n) => ({
                id: n.id,
                type: n.type as any,
                title: n.title,
                description: n.description || '',
                timestamp: n.created_at,
                read: n.is_read,
              }))
            );
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(ordersChannel);
    };
  }, [user]);

  // Helper to notify other tabs and local components of product updates
  const notifyProductChange = (brokerId?: string) => {
    try {
      const bc = new BroadcastChannel('brokerhub_products_live');
      bc.postMessage({ type: 'REFRESH_PRODUCTS', brokerId });
      bc.close();
    } catch {}
  };

  // Listen for real-time product updates (BroadcastChannel, storage event)
  useEffect(() => {
    const handleProductsReload = async (eventBrokerId?: string) => {
      const freshProducts = await getProducts();
      setProducts(freshProducts);

      if (user?.id && (!eventBrokerId || eventBrokerId === user.id)) {
        await loadBrokerProducts(user.id);
      }
    };

    let bc: BroadcastChannel | null = null;
    try {
      bc = new BroadcastChannel('brokerhub_products_live');
      bc.onmessage = (event) => {
        handleProductsReload(event.data?.brokerId);
      };
    } catch {}

    const handleStorage = (e: StorageEvent) => {
      if (e.key && e.key.startsWith('brokerhub_custom_products_')) {
        handleProductsReload();
      }
    };
    window.addEventListener('storage', handleStorage);

    // Supabase Realtime subscription for products table across devices
    const productsRealtime = supabase
      .channel('public_products_realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'products' },
        (payload: any) => {
          const changedBrokerId = payload.new?.broker_id || payload.old?.broker_id;
          handleProductsReload(changedBrokerId);
        }
      )
      .subscribe();

    return () => {
      bc?.close();
      window.removeEventListener('storage', handleStorage);
      supabase.removeChannel(productsRealtime);
    };
  }, [user]);

  // Reorders conversation list to place the active/newly messaged contact at top (Position #1 - WhatsApp style)
  const bumpConversationToTop = (targetConvId: string, lastMsgText: string, timeStr: string, incrementUnread: boolean = false) => {
    setConversations((prev) => {
      const existingIdx = prev.findIndex((c) => c.id === targetConvId);
      const now = Date.now();

      if (existingIdx >= 0) {
        const target = prev[existingIdx];
        const updatedItem: Conversation = {
          ...target,
          lastMessage: lastMsgText,
          timestamp: timeStr,
          unread: incrementUnread ? (target.unread || 0) + 1 : 0,
          lastUpdated: now,
        };
        const rest = prev.filter((_, idx) => idx !== existingIdx);
        return [updatedItem, ...rest];
      } else {
        const newItem: Conversation = {
          id: targetConvId,
          contactName: 'Contact',
          lastMessage: lastMsgText,
          timestamp: timeStr,
          unread: incrementUnread ? 1 : 0,
          online: true,
          lastUpdated: now,
        };
        return [newItem, ...prev];
      }
    });
  };

  // Real-time Supabase message subscription & Broadcast Channel
  useEffect(() => {
    // 1. Listen on BroadcastChannel for instant multi-tab sync
    let bc: BroadcastChannel | null = null;
    try {
      bc = new BroadcastChannel('brokerhub_live_chat');
      bc.onmessage = (event) => {
        const { senderId, receiverId, content, timestamp, id } = event.data;
        if (!senderId || !receiverId) return;

        const timeStr = timestamp || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

        let targetConvId = '';
        let isOwn = false;

        if (user) {
          if (user.id === senderId) {
            targetConvId = receiverId;
            isOwn = true;
          } else if (user.id === receiverId) {
            targetConvId = senderId;
            isOwn = false;
          } else {
            return;
          }
        } else {
          targetConvId = receiverId === 'user' ? senderId : receiverId;
          isOwn = senderId === 'user';
        }

        const msgObj: Message = {
          id: id || `msg_${Date.now()}`,
          senderId,
          senderName: isOwn ? 'You' : 'Contact',
          content,
          timestamp: timeStr,
          isOwn,
        };

        setMessagesMap((prev) => {
          const list = prev[targetConvId] || [];
          if (list.some((m) => m.id === msgObj.id)) return prev;
          return { ...prev, [targetConvId]: [...list, msgObj] };
        });

        bumpConversationToTop(targetConvId, content, timeStr, !isOwn);
      };
    } catch {
      // BroadcastChannel fallback
    }

    // 2. Listen on Supabase Realtime for cross-device DB sync
    if (!user) {
      return () => {
        bc?.close();
      };
    }

    const channel = supabase
      .channel('public_messages_realtime')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages' },
        (payload) => {
          const newMsg = payload.new as any;
          if (newMsg.sender_id === user.id || newMsg.receiver_id === user.id) {
            const isOwn = newMsg.sender_id === user.id;
            const targetConvId = isOwn ? newMsg.receiver_id : newMsg.sender_id;
            const timeStr = new Date(newMsg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

            const msgObj: Message = {
              id: newMsg.id,
              senderId: newMsg.sender_id,
              senderName: isOwn ? 'You' : 'Contact',
              content: newMsg.content,
              timestamp: timeStr,
              isOwn,
            };

            setMessagesMap((prev) => {
              const list = prev[targetConvId] || [];
              if (list.some((m) => m.id === msgObj.id)) return prev;
              return { ...prev, [targetConvId]: [...list, msgObj] };
            });

            bumpConversationToTop(targetConvId, newMsg.content, timeStr, !isOwn);

            if (!isOwn) {
              showToast(`New message: "${newMsg.content.substring(0, 30)}..."`, 'info');
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
      bc?.close();
    };
  }, [user]);

  // Toast Helper
  const showToast = (message: string, type: 'success' | 'info' | 'warning' = 'success') => {
    const id = Date.now().toString();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      removeToast(id);
    }, 4000);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Real-time Send Message
  const sendMessage = async (convId: string, text: string, _isOwn: boolean = true) => {
    if (!text.trim()) return;

    const senderId = user?.id || 'user';
    const receiverId = convId;
    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const msgId = `msg_${Date.now()}`;

    const localMsg: Message = {
      id: msgId,
      senderId: senderId,
      senderName: 'You',
      content: text,
      timestamp: timeStr,
      isOwn: true,
    };

    // 1. Optimistic UI update for Sender (key = receiverId)
    setMessagesMap((prev) => ({
      ...prev,
      [receiverId]: [...(prev[receiverId] || []), localMsg],
    }));

    // Move to top immediately like WhatsApp
    bumpConversationToTop(receiverId, text, timeStr, false);

    // 2. Broadcast for Multi-Tab Sync
    try {
      const bc = new BroadcastChannel('brokerhub_live_chat');
      bc.postMessage({
        id: msgId,
        senderId,
        receiverId,
        content: text,
        timestamp: timeStr,
      });
      bc.close();
    } catch {
      // ignore
    }

    // 3. Save to Supabase if authenticated & valid UUIDs
    const isUuid = (str: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);

    if (user && isUuid(senderId) && isUuid(receiverId)) {
      const dbMsg = await sendDBMessage(senderId, receiverId, text);
      if (dbMsg) {
        await supabase.from('broker_notifications').insert({
          broker_id: user.role === 'customer' ? receiverId : senderId,
          customer_id: user.role === 'customer' ? senderId : receiverId,
          customer_name: user.fullName || 'User',
          type: 'message',
          title: `New message from ${user.fullName || 'Client'}`,
          description: text,
          is_read: false,
          status: 'pending',
        });
      }
    } else {
      // Demo auto-reply simulation for testing
      setTimeout(() => {
        const replyTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        const autoReplyText = getAutoReplyText(text);
        const replyMsg: Message = {
          id: `reply_${Date.now()}`,
          senderId: receiverId,
          senderName: 'Contact',
          content: autoReplyText,
          timestamp: replyTime,
          isOwn: false,
        };

        setMessagesMap((prev) => ({
          ...prev,
          [receiverId]: [...(prev[receiverId] || []), replyMsg],
        }));

        bumpConversationToTop(receiverId, autoReplyText, replyTime, true);

        showToast(`New reply: "${autoReplyText.substring(0, 35)}..."`, 'info');
      }, 1200);
    }
  };

  function getAutoReplyText(input: string): string {
    const lower = input.toLowerCase();
    if (lower.includes('hello') || lower.includes('hi') || lower.includes('hey')) {
      return "Hello! Thanks for connecting. How can I assist you with your trade inquiry today?";
    }
    if (lower.includes('price') || lower.includes('cost') || lower.includes('quote')) {
      return "I can provide detailed unit pricing and custom volume discounts. Let me prepare a breakdown for you.";
    }
    if (lower.includes('order') || lower.includes('ship') || lower.includes('status')) {
      return "Your inquiry regarding order status has been logged. Our logistics manager is verifying dispatch details.";
    }
    return "Thank you for your message! I've received your inquiry and will review the specifications immediately.";
  }

  // Product Actions: strictly bound to authenticated user.id
  const addProduct = async (prodData: Omit<Product, 'id'>) => {
    const brokerId = user?.id || 'broker';
    const brokerName = user?.fullName || 'Broker';

    const newProd = await createBrokerProduct(prodData, brokerId, brokerName);

    setBrokerProducts((prev) => [newProd, ...prev.filter((p) => p.id !== newProd.id)]);
    setProducts((prev) => [newProd, ...prev.filter((p) => p.id !== newProd.id)]);
    showToast(`Product "${newProd.name}" added successfully!`);
    notifyProductChange(brokerId);
  };

  const updateProduct = async (id: string, updatedFields: Partial<Product>) => {
    const brokerId = user?.id || 'broker';
    await updateBrokerProduct(id, updatedFields, brokerId);

    setBrokerProducts((prev) => prev.map((p) => (p.id === id ? { ...p, ...updatedFields } : p)));
    setProducts((prev) => prev.map((p) => (p.id === id ? { ...p, ...updatedFields } : p)));
    showToast('Product inventory updated successfully!');
    notifyProductChange(brokerId);
  };

  const deleteProduct = async (id: string) => {
    const brokerId = user?.id || 'broker';
    setBrokerProducts((prev) => prev.filter((p) => p.id !== id));
    setProducts((prev) => prev.filter((p) => p.id !== id));
    showToast('Product deleted from inventory.', 'warning');

    await deleteBrokerProduct(id, brokerId);
    notifyProductChange(brokerId);
  };

  // Order Actions
  const addOrder = (newOrder: Order) => {
    setOrders((prev) => [newOrder, ...prev]);
    showToast(`✨ New order ${newOrder.id} placed! (₹${(newOrder.amount || newOrder.totalAmount || 0).toLocaleString('en-IN')})`, 'success');

    // Broadcast live order to other open tabs (e.g. Broker Portal tab)
    try {
      const bc = new BroadcastChannel('brokerhub_orders_live');
      bc.postMessage({ type: 'NEW_ORDER', order: newOrder });
      bc.close();
    } catch {}
  };

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    // 1. Optimistic UI update immediately
    setOrders((prev) => prev.map((o) => (o.id === orderId ? { ...o, status: newStatus as any } : o)));
    showToast(`Order ${orderId} status changed to "${newStatus}"`, 'info');

    // 2. Broadcast status change across tabs
    try {
      const bc = new BroadcastChannel('brokerhub_orders_live');
      bc.postMessage({ type: 'ORDER_STATUS_UPDATE', orderId, newStatus });
      bc.close();
    } catch {}

    // 3. Supabase update if valid UUID
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(orderId);
    if (isUuid) {
      await supabase.from('orders').update({ status: newStatus }).eq('id', orderId);
    }
  };

  const resetOrders = async () => {
    try {
      if (user?.id) {
        await supabase.from('orders').delete().or(`broker_id.eq.${user.id},customer_id.eq.${user.id}`);
      } else {
        await supabase.from('orders').delete().neq('id', '');
      }
      localStorage.removeItem('brokerhub_orders');
      setOrders([]);
      showToast('Received orders reset successfully', 'info');
    } catch (err) {
      console.error('Error resetting orders:', err);
      localStorage.removeItem('brokerhub_orders');
      setOrders([]);
    }
  };

  // Appointment Actions
  const addAppointment = async (appData: Omit<Appointment, 'id'>) => {
    if (!user) return;
    
    // In a real app we'd need brokerId. For now, since appData doesn't have it explicitly structured,
    // we'll try to find it by name or just use a mock UUID.
    const broker = brokers.find(b => b.name === appData.brokerName);
    if (!broker) return;

    const { data, error } = await supabase.from('appointments').insert([{
      customer_id: user.id,
      broker_id: broker.id,
      date: appData.date,
      time: appData.time,
      type: appData.type,
      status: appData.status,
      notes: appData.notes
    }]).select().single();

    if (!error && data) {
      const newApp: Appointment = { ...appData, id: data.id };
      setAppointments((prev) => [newApp, ...prev]);
      showToast(`Appointment booked with ${newApp.brokerName} for ${newApp.date}`);
    }
  };

  const cancelAppointment = async (id: string) => {
    const { error } = await supabase.from('appointments').update({ status: 'Cancelled' }).eq('id', id);
    if (!error) {
      setAppointments((prev) => prev.map((a) => (a.id === id ? { ...a, status: 'Cancelled' } : a)));
      showToast('Appointment cancelled.', 'warning');
    }
  };

  // Broker Connect Action
  const toggleConnectBroker = async (brokerId: string) => {
    // In a real DB, this would create a relation/notification. We'll simulate it locally.
    setBrokers((prev) =>
      prev.map((b) => {
        if (b.id === brokerId) {
          const nextStatus = b.status === 'Connected' ? 'Pending Match' : 'Connected';
          showToast(
            nextStatus === 'Connected'
              ? `Connected with broker ${b.name}`
              : `Connection request sent to ${b.name}`
          );
          return { ...b, status: nextStatus };
        }
        return b;
      })
    );
  };

  // Notification Actions
  const markNotificationRead = async (id: string) => {
    const { error } = await supabase.from('broker_notifications').update({ is_read: true }).eq('id', id);
    if (!error) {
      setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
    }
  };

  // Cart Actions
  const addToCart = (item: CartItem) => {
    setCart((prev) => {
      const existing = prev.find((c) => c.productId === item.productId);
      if (existing) {
        return prev.map((c) =>
          c.productId === item.productId
            ? { ...c, quantity: c.quantity + item.quantity, totalPrice: (c.quantity + item.quantity) * c.price }
            : c
        );
      }
      return [...prev, item];
    });
  };

  const removeFromCart = (productId: string) => {
    setCart((prev) => prev.filter((c) => c.productId !== productId));
  };

  const updateCartQuantity = (productId: string, quantity: number) => {
    if (quantity < 1) return;
    setCart((prev) =>
      prev.map((c) =>
        c.productId === productId ? { ...c, quantity, totalPrice: quantity * c.price } : c
      )
    );
  };

  const clearCart = () => {
    setCart([]);
    try { localStorage.removeItem('brokerhub_cart'); } catch { /**/ }
  };

  const fetchConversationMessages = async (convId: string) => {
    if (!user || !convId) return;
    const isUuid = (str: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);
    if (!isUuid(user.id) || !isUuid(convId)) return;

    const msgs = await getMessagesBetweenUsers(user.id, convId);
    if (msgs) {
      setMessagesMap((prev) => ({ ...prev, [convId]: msgs }));
    }
  };

  // Clear unread badge for a specific conversation (called only after broker sends a reply)
  const clearConversationUnread = (convId: string) => {
    setConversations((prev) =>
      prev.map((c) => (c.id === convId ? { ...c, unread: 0 } : c))
    );
  };

  return (
    <AppContext.Provider
      value={{
        brokers,
        products,
        brokerProducts,
        brokerProductsLoading,
        orders,
        notifications,
        conversations,
        messagesMap,
        appointments,
        toasts,
        cart,
        cartCount,
        refreshBrokers,
        loadBrokerProducts,
        sendMessage,
        fetchConversationMessages,
        addProduct,
        updateProduct,
        deleteProduct,
        addOrder,
        updateOrderStatus,
        resetOrders,
        addAppointment,
        cancelAppointment,
        toggleConnectBroker,
        markNotificationRead,
        showToast,
        removeToast,
        addToCart,
        removeFromCart,
        updateCartQuantity,
        clearCart,
        clearConversationUnread,
      }}
    >
      {children}

      {/* Global Realtime Toast Container */}
      <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 pointer-events-none max-w-sm w-full">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`pointer-events-auto flex items-center justify-between p-4 rounded-xl shadow-lg border text-sm font-medium transition-all duration-300 transform translate-y-0 ${
              toast.type === 'success'
                ? 'bg-emerald-900 text-emerald-100 border-emerald-700'
                : toast.type === 'warning'
                ? 'bg-amber-900 text-amber-100 border-amber-700'
                : 'bg-indigo-900 text-indigo-100 border-indigo-700'
            }`}
          >
            <span>{toast.message}</span>
            <button
              onClick={() => removeToast(toast.id)}
              className="ml-3 text-xs opacity-70 hover:opacity-100"
            >
              ✕
            </button>
          </div>
        ))}
      </div>
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
