import React, { useState, useRef, useEffect } from 'react';
import { Send, Paperclip, Smile, Search } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';

export const MessagesPage: React.FC = () => {
  const { user } = useAuth();
  const { conversations, messagesMap, sendMessage, fetchConversationMessages } = useApp();
  const [activeConvId, setActiveConvId] = useState(conversations[0]?.id || 'conv1');
  const [inputMessage, setInputMessage] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const activeConv = conversations.find((c) => c.id === activeConvId) || conversations[0] || {
    id: 'conv1',
    contactName: 'Broker Support',
    lastMessage: '',
    timestamp: '',
    unread: 0,
    online: true,
  };
  const messages = messagesMap[activeConvId] || [];

  const filteredConversations = conversations.filter((c) =>
    c.contactName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (activeConvId) {
      fetchConversationMessages(activeConvId);
    }
  }, [activeConvId, fetchConversationMessages]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputMessage.trim()) return;

    sendMessage(activeConvId, inputMessage, true);
    setInputMessage('');
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-text-primary mb-1">Messages</h1>
        <p className="text-sm text-gray-text">Real-time messaging with your assigned brokers</p>
      </div>

      <div className="bg-white rounded-xl border border-gray-border overflow-hidden" style={{ height: 'calc(100vh - 200px)' }}>
        <div className="flex h-full">
          {/* Conversations List */}
          <div className="w-80 border-r border-gray-border flex flex-col">
            <div className="p-4 border-b border-gray-border relative">
              <Search className="absolute left-7 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search conversations..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-2 border border-gray-border rounded-lg text-sm bg-gray-bg focus:border-primary focus:ring-1 focus:ring-primary"
              />
            </div>
            <div className="flex-1 overflow-y-auto">
              {filteredConversations.map((conv) => (
                <button
                  key={conv.id}
                  onClick={() => setActiveConvId(conv.id)}
                  className={`w-full flex items-center gap-3 p-4 text-left hover:bg-gray-50 transition-colors border-b border-gray-border ${
                    activeConvId === conv.id ? 'bg-primary-50/70 border-l-4 border-l-primary' : ''
                  }`}
                >
                  <div className="relative shrink-0">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-teal-500 flex items-center justify-center text-white font-semibold text-sm shadow-xs">
                      {conv.contactName.split(' ').map((n) => n[0]).join('')}
                    </div>
                    {conv.online && (
                      <span className="absolute bottom-0 right-0 w-3 h-3 bg-status-green rounded-full border-2 border-white" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-semibold text-text-primary truncate">{conv.contactName}</p>
                      <span className="text-xs text-gray-label shrink-0">{conv.timestamp}</span>
                    </div>
                    <p className="text-xs text-gray-text truncate mt-0.5">{conv.lastMessage}</p>
                  </div>
                  {conv.unread > 0 && (
                    <span className="w-5 h-5 rounded-full bg-primary text-white text-xs flex items-center justify-center shrink-0">
                      {conv.unread}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Chat Area */}
          <div className="flex-1 flex flex-col">
            {/* Chat Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-border bg-white">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-teal-500 flex items-center justify-center text-white font-semibold text-sm shadow-xs">
                  {activeConv.contactName.split(' ').map((n) => n[0]).join('')}
                </div>
                <div>
                  <p className="text-sm font-semibold text-text-primary">{activeConv.contactName}</p>
                  <p className="text-xs text-status-green flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-status-green animate-pulse" />
                    {activeConv.online ? 'Online & Ready to chat' : 'Offline (Replies within 1 hour)'}
                  </p>
                </div>
              </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-bg/50">
              {messages.map((msg) => {
                const isOwn = user
                  ? msg.senderId === user.id
                  : (msg.senderId === 'cust' || msg.senderId === 'user' || msg.isOwn);
                return (
                  <div key={msg.id} className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
                    <div
                      className={`max-w-[70%] rounded-2xl px-4 py-2.5 shadow-xs ${
                        isOwn
                          ? 'bg-primary text-white rounded-br-none'
                          : 'bg-white border border-gray-border text-text-primary rounded-bl-none'
                      }`}
                    >
                      <p className="text-sm leading-relaxed">{msg.content}</p>
                      <p className={`text-[10px] mt-1 text-right ${isOwn ? 'text-white/80' : 'text-gray-400'}`}>
                        {msg.timestamp}
                      </p>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            {/* Message Input Form */}
            <form onSubmit={handleSend} className="p-4 border-t border-gray-border bg-white">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => alert('Attachment feature simulated: File attached.')}
                  className="p-2 text-gray-label hover:text-primary transition-colors rounded-lg hover:bg-gray-100"
                >
                  <Paperclip size={20} />
                </button>
                <button
                  type="button"
                  onClick={() => setInputMessage((prev) => prev + ' 😊')}
                  className="p-2 text-gray-label hover:text-primary transition-colors rounded-lg hover:bg-gray-100"
                >
                  <Smile size={20} />
                </button>
                <input
                  type="text"
                  placeholder="Type your message and press Enter..."
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  className="flex-1 px-4 py-2.5 border border-gray-border rounded-xl text-sm bg-gray-bg focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none"
                />
                <button
                  type="submit"
                  disabled={!inputMessage.trim()}
                  className="p-2.5 bg-primary text-white rounded-xl hover:bg-primary-dark transition-all disabled:opacity-50 shadow-xs"
                >
                  <Send size={18} />
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};
