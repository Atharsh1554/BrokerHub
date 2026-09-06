import React, { createContext, useContext, useState, useEffect } from 'react';
import type { Broker, Product, Order, Notification, Conversation, Message, Appointment } from '../types';
import {
  brokers as initialBrokers,
  products as initialProducts,
  orders as initialOrders,
  notifications as initialNotifications,
  conversations as initialConversations,
  chatMessages as initialChatMessages,
  appointments as initialAppointments,
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
  // Load from localStorage or default mockData
  const [brokers, setBrokers] = useState<Broker[]>(() => {
    const saved = localStorage.getItem('brokerhub_brokers');
    return saved ? JSON.parse(saved) : initialBrokers;
  });

  const [products, setProducts] = useState<Product[]>(() => {
    const saved = localStorage.getItem('brokerhub_products');
    return saved ? JSON.parse(saved) : initialProducts;
  });

  const [orders, setOrders] = useState<Order[]>(() => {
    const saved = localStorage.getItem('brokerhub_orders');
    return saved ? JSON.parse(saved) : initialOrders;
  });

  const [notifications, setNotifications] = useState<Notification[]>(() => {
    const saved = localStorage.getItem('brokerhub_notifications');
    return saved ? JSON.parse(saved) : initialNotifications;
  });

  const [conversations, setConversations] = useState<Conversation[]>(() => {
    const saved = localStorage.getItem('brokerhub_conversations');
    return saved ? JSON.parse(saved) : initialConversations;
  });

  const [messagesMap, setMessagesMap] = useState<Record<string, Message[]>>(() => {
    const saved = localStorage.getItem('brokerhub_messagesMap');
    return saved ? JSON.parse(saved) : { conv1: initialChatMessages };
  });

  const [appointments, setAppointments] = useState<Appointment[]>(() => {
    const saved = localStorage.getItem('brokerhub_appointments');
    return saved ? JSON.parse(saved) : initialAppointments;
  });

  const [toasts, setToasts] = useState<Toast[]>([]);

  // Sync to localStorage
  useEffect(() => {
    localStorage.setItem('brokerhub_brokers', JSON.stringify(brokers));
  }, [brokers]);

  useEffect(() => {
    localStorage.setItem('brokerhub_products', JSON.stringify(products));
  }, [products]);

  useEffect(() => {
    localStorage.setItem('brokerhub_orders', JSON.stringify(orders));
  }, [orders]);

  useEffect(() => {
    localStorage.setItem('brokerhub_notifications', JSON.stringify(notifications));
  }, [notifications]);

  useEffect(() => {
    localStorage.setItem('brokerhub_conversations', JSON.stringify(conversations));
  }, [conversations]);

  useEffect(() => {
    localStorage.setItem('brokerhub_messagesMap', JSON.stringify(messagesMap));
  }, [messagesMap]);

  useEffect(() => {
    localStorage.setItem('brokerhub_appointments', JSON.stringify(appointments));
  }, [appointments]);

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

    // Update conversation last message
    setConversations((prev) =>
      prev.map((c) => (c.id === convId ? { ...c, lastMessage: text, timestamp: timeStr, unread: 0 } : c))
    );

    // Simulate real-time automated response after 1.5 seconds if sent by user
    if (isOwn) {
      setTimeout(() => {
        const replyStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        const autoReply: Message = {
          id: `reply_${Date.now()}`,
          senderId: 'other',
          senderName: 'Contact',
          content: `Thanks for your message regarding "${text.slice(0, 20)}...". Our team will assist you immediately!`,
          timestamp: replyStr,
          isOwn: false,
        };

        setMessagesMap((prev) => ({
          ...prev,
          [convId]: [...(prev[convId] || []), autoReply],
        }));

        setConversations((prev) =>
          prev.map((c) => (c.id === convId ? { ...c, lastMessage: autoReply.content, timestamp: replyStr } : c))
        );
      }, 1200);
    }
  };

  // Product Actions
  const addProduct = (prodData: Omit<Product, 'id'>) => {
    const newProd: Product = {
      ...prodData,
      id: `p_${Date.now()}`,
    };
    setProducts((prev) => [newProd, ...prev]);
    showToast(`Product "${newProd.name}" added successfully!`);
  };

  const updateProduct = (id: string, updatedFields: Partial<Product>) => {
    setProducts((prev) => prev.map((p) => (p.id === id ? { ...p, ...updatedFields } : p)));
    showToast('Product updated successfully!');
  };

  const deleteProduct = (id: string) => {
    setProducts((prev) => prev.filter((p) => p.id !== id));
    showToast('Product deleted from inventory.', 'warning');
  };

  // Order Actions
  const updateOrderStatus = (orderId: string, newStatus: string) => {
    setOrders((prev) => prev.map((o) => (o.id === orderId ? { ...o, status: newStatus as any } : o)));
    showToast(`Order ${orderId} status changed to ${newStatus}`);
  };

  // Appointment Actions
  const addAppointment = (appData: Omit<Appointment, 'id'>) => {
    const newApp: Appointment = {
      ...appData,
      id: `app_${Date.now()}`,
    };
    setAppointments((prev) => [newApp, ...prev]);
    showToast(`Appointment booked with ${newApp.brokerName} for ${newApp.date}`);
  };

  const cancelAppointment = (id: string) => {
    setAppointments((prev) => prev.map((a) => (a.id === id ? { ...a, status: 'Cancelled' } : a)));
    showToast('Appointment cancelled.', 'warning');
  };

  // Broker Connect Action
  const toggleConnectBroker = (brokerId: string) => {
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
  const markNotificationRead = (id: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
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
