import React, { createContext, useContext, useState, useEffect } from 'react';
import type { Broker, Product, Order, Notification, Conversation, Message, Appointment } from '../types';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthContext';
import { getBrokers } from '../lib/api/brokers';
import { getProducts } from '../lib/api/products';
import { getOrders } from '../lib/api/orders';
import { getAppointments } from '../lib/api/appointments';
import { 
  conversations as initialConversations, 
  chatMessages as initialChatMessages 
} from '../data/mockData';

interface Toast {
  id: string;
  message: string;
  type: 'success' | 'info' | 'warning';
}

interface AppContextType {
  brokers: Broker[];
  products: Product[];
  orders: Order[];
  notifications: Notification[];
  conversations: Conversation[];
  messagesMap: Record<string, Message[]>;
  appointments: Appointment[];
  toasts: Toast[];

  // Actions
  sendMessage: (convId: string, text: string, isOwn?: boolean) => void;
  addProduct: (product: Omit<Product, 'id'>) => void;
  updateProduct: (id: string, product: Partial<Product>) => void;
  deleteProduct: (id: string) => void;
  updateOrderStatus: (orderId: string, status: string) => void;
  addAppointment: (appointment: Omit<Appointment, 'id'>) => void;
  cancelAppointment: (id: string) => void;
  toggleConnectBroker: (brokerId: string) => void;
  markNotificationRead: (id: string) => void;
  showToast: (message: string, type?: 'success' | 'info' | 'warning') => void;
  removeToast: (id: string) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  
  const [brokers, setBrokers] = useState<Broker[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>(initialConversations);
  const [messagesMap, setMessagesMap] = useState<Record<string, Message[]>>({ conv1: initialChatMessages });
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [toasts, setToasts] = useState<Toast[]>([]);

  // Fetch real data on mount or when user changes
  useEffect(() => {
    const loadData = async () => {
      const fetchedBrokers = await getBrokers();
      setBrokers(fetchedBrokers);
      
      const fetchedProducts = await getProducts();
      setProducts(fetchedProducts);
      
      if (user) {
        const fetchedOrders = await getOrders(user.id, user.role);
        setOrders(fetchedOrders);
        
        const fetchedAppointments = await getAppointments(user.id, user.role);
        setAppointments(fetchedAppointments);
        
        // Fetch notifications
        const { data: notifs } = await supabase
          .from('broker_notifications')
          .select('*')
          .eq(user.role === 'broker' ? 'broker_id' : 'customer_id', user.id)
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
      }
    };
    
    loadData();
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

  // Real-time Send Message (Mocked for now due to complexity of Conversations schema)
  const sendMessage = (convId: string, text: string, isOwn: boolean = true) => {
    if (!text.trim()) return;

    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const newMsg: Message = {
      id: `msg_${Date.now()}`,
      senderId: isOwn ? 'user' : 'other',
      senderName: isOwn ? 'You' : 'Contact',
      content: text,
      timestamp: timeStr,
      isOwn,
    };

    setMessagesMap((prev) => ({
      ...prev,
      [convId]: [...(prev[convId] || []), newMsg],
    }));

    setConversations((prev) =>
      prev.map((c) => (c.id === convId ? { ...c, lastMessage: text, timestamp: timeStr, unread: 0 } : c))
    );
  };

  // Product Actions
  const addProduct = async (prodData: Omit<Product, 'id'>) => {
    const { data, error } = await supabase.from('products').insert([{
      name: prodData.name,
      price: prodData.price,
      image: prodData.image,
      category: prodData.category,
      stock: prodData.stock,
      status: prodData.status,
      description: prodData.description
    }]).select().single();
    
    if (!error && data) {
      const newProd: Product = { ...prodData, id: data.id };
      setProducts((prev) => [newProd, ...prev]);
      showToast(`Product "${newProd.name}" added successfully!`);
    } else {
      showToast(`Error adding product: ${error?.message}`, 'warning');
    }
  };

  const updateProduct = async (id: string, updatedFields: Partial<Product>) => {
    const { error } = await supabase.from('products').update(updatedFields).eq('id', id);
    if (!error) {
      setProducts((prev) => prev.map((p) => (p.id === id ? { ...p, ...updatedFields } : p)));
      showToast('Product updated successfully!');
    }
  };

  const deleteProduct = async (id: string) => {
    const { error } = await supabase.from('products').delete().eq('id', id);
    if (!error) {
      setProducts((prev) => prev.filter((p) => p.id !== id));
      showToast('Product deleted from inventory.', 'warning');
    }
  };

  // Order Actions
  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    const { error } = await supabase.from('orders').update({ status: newStatus }).eq('id', orderId);
    if (!error) {
      setOrders((prev) => prev.map((o) => (o.id === orderId ? { ...o, status: newStatus as any } : o)));
      showToast(`Order ${orderId} status changed to ${newStatus}`);
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

  return (
    <AppContext.Provider
      value={{
        brokers,
        products,
        orders,
        notifications,
        conversations,
        messagesMap,
        appointments,
        toasts,
        sendMessage,
        addProduct,
        updateProduct,
        deleteProduct,
        updateOrderStatus,
        addAppointment,
        cancelAppointment,
        toggleConnectBroker,
        markNotificationRead,
        showToast,
        removeToast,
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
