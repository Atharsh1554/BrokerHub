import React, { useState, useRef, useEffect } from 'react';
import { Send, Paperclip, Smile, Search } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';

export const BrokerMessages: React.FC = () => {
  const { user } = useAuth();
  const { conversations, messagesMap, sendMessage, fetchConversationMessages } = useApp();
  const [activeConvId, setActiveConvId] = useState(conversations[0]?.id || 'conv1');
  const [inputMessage, setInputMessage] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const activeConv = conversations.find((c) => c.id === activeConvId) || conversations[0] || {
    id: 'conv1',
    contactName: 'Client Contact',
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
    <div className="space-y-6">
      <div className="flex items-center justify-between bg-white dark:bg-zinc-900 p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-xs">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">Broker Messaging Desk</h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
            Direct real-time client communications and deal inquiries
          </p>
        </div>
      </div>

      <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden shadow-xs" style={{ height: 'calc(100vh - 220px)' }}>
        <div className="flex h-full">
          {/* Conversations List */}
          <div className="w-80 border-r border-zinc-200 dark:border-zinc-800 flex flex-col">
            <div className="p-4 border-b border-zinc-200 dark:border-zinc-800 relative">
              <Search className="absolute left-7 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
              <input
                type="text"
                placeholder="Search clients..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 dark:text-white"
              />
            </div>
            <div className="flex-1 overflow-y-auto">
              {filteredConversations.map((conv) => (
                <button
                  key={conv.id}
                  onClick={() => setActiveConvId(conv.id)}
                  className={`w-full flex items-center gap-3 p-4 text-left hover:bg-zinc-50 dark:hover:bg-zinc-800/40 transition-colors border-b border-zinc-100 dark:border-zinc-800 ${
                    activeConvId === conv.id ? 'bg-indigo-50/60 dark:bg-indigo-950/30 border-l-4 border-l-indigo-600' : ''
                  }`}
                >
                  <div className="relative shrink-0">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-semibold text-sm shadow-xs">
                      {conv.contactName.split(' ').map((n) => n[0]).join('')}
                    </div>
                    {conv.online && (
                      <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 rounded-full border-2 border-white dark:border-zinc-900" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-semibold text-zinc-900 dark:text-white truncate">{conv.contactName}</p>
                      <span className="text-xs text-zinc-400 shrink-0">{conv.timestamp}</span>
                    </div>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 truncate mt-0.5">{conv.lastMessage}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Chat Panel */}
          <div className="flex-1 flex flex-col">
            {/* Header */}
            <div className="p-4 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between bg-white dark:bg-zinc-900">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-semibold text-sm shadow-xs">
                  {activeConv.contactName.split(' ').map((n) => n[0]).join('')}
                </div>
                <div>
                  <p className="text-sm font-semibold text-zinc-900 dark:text-white">{activeConv.contactName}</p>
                  <p className="text-xs text-emerald-500 font-medium">Verified Buyer Client</p>
                </div>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-zinc-50/50 dark:bg-zinc-950/40">
              {messages.map((msg) => {
                const isOwn = user
                  ? msg.senderId === user.id
                  : (msg.senderId !== activeConv.id && msg.senderId !== 'c1' && msg.senderId !== 'cust');
                return (
                  <div key={msg.id} className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
                    <div
                      className={`max-w-[70%] rounded-2xl px-4 py-2.5 shadow-xs ${
                        isOwn
                          ? 'bg-indigo-600 text-white rounded-br-none'
                          : 'bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-white rounded-bl-none'
                      }`}
                    >
                      <p className="text-sm leading-relaxed">{msg.content}</p>
                      <p className={`text-[10px] mt-1 text-right ${isOwn ? 'text-white/80' : 'text-zinc-400'}`}>
                        {msg.timestamp}
                      </p>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <form onSubmit={handleSend} className="p-4 border-t border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => alert('Proposal attachment ready.')}
                  className="p-2 text-zinc-400 hover:text-indigo-600 transition-colors"
                >
                  <Paperclip size={20} />
                </button>
                <button
                  type="button"
                  onClick={() => setInputMessage((prev) => prev + ' 👍')}
                  className="p-2 text-zinc-400 hover:text-indigo-600 transition-colors"
                >
                  <Smile size={20} />
                </button>
                <input
                  type="text"
                  placeholder="Reply to client..."
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  className="flex-1 px-4 py-2.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 dark:text-white"
                />
                <button
                  type="submit"
                  disabled={!inputMessage.trim()}
                  className="p-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-all disabled:opacity-50 shadow-xs"
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
