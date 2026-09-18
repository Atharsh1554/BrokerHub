import React, { useState, useRef, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Send, Paperclip, Smile, Search, ArrowLeft, MessageSquare, Sparkles } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { resolveUserDisplayName, getUserInitials } from '../../lib/userUtils';

const QUICK_PROMPTS = [
  'Inquiring about product pricing',
  'Can we schedule a consultation call?',
  'Update on current order status',
  'Requesting volume discount quote',
];

const EMOJI_LIST = ['😊', '👍', '🚀', '📦', '💼', '💰', '🙏', '✅', '⚡', '🤝', '📈', '🔥'];

export const MessagesPage: React.FC = () => {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const brokerIdParam = searchParams.get('brokerId');
  const { conversations, messagesMap, sendMessage, fetchConversationMessages, brokers } = useApp();

  const [activeConvId, setActiveConvId] = useState(conversations[0]?.id || 'conv1');
  const [inputMessage, setInputMessage] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showMobileChat, setShowMobileChat] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Handle URL param brokerId on load & open specific broker chat box
  useEffect(() => {
    if (brokerIdParam) {
      const targetBroker = brokers.find((b) => b.id === brokerIdParam);

      const existingConv = conversations.find(
        (c) =>
          c.id === brokerIdParam ||
          c.id === `conv_${brokerIdParam}` ||
          (targetBroker && c.contactName.toLowerCase().includes(targetBroker.name.toLowerCase()))
      );

      if (existingConv) {
        setActiveConvId(existingConv.id);
      } else {
        const newConvId = brokerIdParam;
        setActiveConvId(newConvId);
      }
      setShowMobileChat(true);
    }
  }, [brokerIdParam, brokers, conversations]);

  const selectedBroker = brokers.find((b) => b.id === activeConvId || b.id === brokerIdParam);

  const activeConv = conversations.find((c) => c.id === activeConvId) || {
    id: activeConvId,
    contactName: selectedBroker ? selectedBroker.name : 'Broker Contact',
    lastMessage: 'Started inquiry with broker',
    timestamp: 'Just now',
    unread: 0,
    online: true,
  };

  const messages = messagesMap[activeConvId] || [];

  const filteredConversations = conversations
    .filter((c) => c.contactName.toLowerCase().includes(searchTerm.toLowerCase()))
    .sort((a, b) => (b.lastUpdated || 0) - (a.lastUpdated || 0));

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

  const handleSelectConv = (convId: string) => {
    setActiveConvId(convId);
    setShowMobileChat(true);
  };

  const handleSend = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputMessage.trim()) return;

    sendMessage(activeConvId, inputMessage.trim(), true);
    setInputMessage('');
    setShowEmojiPicker(false);
  };

  const handleQuickPrompt = (prompt: string) => {
    setInputMessage(prompt);
  };

  const addEmoji = (emoji: string) => {
    setInputMessage((prev) => prev + emoji);
  };

  const currentUserName = resolveUserDisplayName(user?.fullName, user?.email);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">Messages & Communication</h1>
          <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-0.5">
            Direct real-time channel with your verified brokers
          </p>
        </div>
      </div>

      {/* Main Container */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-200 dark:border-slate-700 overflow-hidden shadow-xs h-[calc(100vh-180px)] min-h-[540px] flex flex-col">
        <div className="flex flex-1 h-full overflow-hidden relative">
          
          {/* Sidebar / Conversation List */}
          <div
            className={`w-full md:w-80 lg:w-96 border-r border-gray-200 dark:border-slate-700 flex flex-col bg-white dark:bg-slate-800 shrink-0 ${
              showMobileChat ? 'hidden md:flex' : 'flex'
            }`}
          >
            {/* Search Bar */}
            <div className="p-4 border-b border-gray-200 dark:border-slate-700 bg-gray-50/50 dark:bg-slate-900/50">
              <div className="relative">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search broker contacts..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 border border-gray-200 dark:border-slate-700 rounded-xl text-sm bg-white dark:bg-slate-900 text-gray-900 dark:text-white placeholder-gray-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all"
                />
              </div>
            </div>

            {/* Conversation Items */}
            <div className="flex-1 overflow-y-auto divide-y divide-gray-100 dark:divide-slate-700">
              {filteredConversations.length === 0 ? (
                <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                  <MessageSquare className="w-10 h-10 mx-auto mb-2 text-gray-300 dark:text-gray-600" />
                  <p className="text-sm font-medium">No conversations found</p>
                  <p className="text-xs text-gray-400 mt-1">Try a different search query</p>
                </div>
              ) : (
                filteredConversations.map((conv) => {
                  const isSelected = activeConvId === conv.id;
                  const initials = getUserInitials(conv.contactName);
                  return (
                    <button
                      key={conv.id}
                      onClick={() => handleSelectConv(conv.id)}
                      className={`w-full flex items-center gap-3 p-4 text-left transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-emerald-50/80 dark:bg-emerald-900/30 border-l-4 border-l-emerald-600 dark:border-l-emerald-400'
                          : 'hover:bg-gray-50 dark:hover:bg-slate-700/50'
                      }`}
                    >
                      <div className="relative shrink-0">
                        <div className="w-11 h-11 rounded-full bg-gradient-to-br from-emerald-600 to-teal-600 flex items-center justify-center text-white font-bold text-sm shadow-xs">
                          {initials}
                        </div>
                        {conv.online && (
                          <span className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-emerald-500 rounded-full border-2 border-white dark:border-slate-800" />
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{conv.contactName}</p>
                          <span className="text-[11px] text-gray-400 shrink-0 font-medium">{conv.timestamp}</span>
                        </div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{conv.lastMessage || 'Click to start chatting'}</p>
                      </div>

                      {conv.unread > 0 && (
                        <span className="min-w-[20px] h-[20px] px-1.5 rounded-full bg-emerald-600 text-white text-[11px] font-bold flex items-center justify-center shrink-0 shadow-xs">
                          {conv.unread}
                        </span>
                      )}
                    </button>
                  );
                })
              )}
            </div>
          </div>

          {/* Active Chat Panel */}
          <div
            className={`flex-1 flex flex-col bg-gray-50/40 dark:bg-slate-900/40 ${
              !showMobileChat ? 'hidden md:flex' : 'flex'
            }`}
          >
            {/* Chat Top Header */}
            <div className="flex items-center justify-between p-4 bg-white dark:bg-slate-800 border-b border-gray-200 dark:border-slate-700 shadow-xs">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setShowMobileChat(false)}
                  className="md:hidden p-2 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-colors cursor-pointer"
                  title="Back to conversation list"
                >
                  <ArrowLeft size={20} />
                </button>
                <div className="relative">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-600 to-teal-600 flex items-center justify-center text-white font-bold text-sm shadow-xs">
                    {getUserInitials(activeConv.contactName)}
                  </div>
                  {activeConv.online && (
                    <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 rounded-full border-2 border-white dark:border-slate-800" />
                  )}
                </div>
                <div>
                  <h2 className="text-sm font-bold text-gray-900 dark:text-white">{activeConv.contactName}</h2>
                  <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    {activeConv.online ? 'Online & Available' : 'Offline'}
                  </p>
                </div>
              </div>
            </div>

            {/* Messages Display Area */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
              {messages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center p-6">
                  <div className="w-14 h-14 rounded-2xl bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-3">
                    <Sparkles size={28} />
                  </div>
                  <h3 className="text-base font-bold text-gray-900 dark:text-white">Start the Conversation</h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400 max-w-sm mt-1">
                    Send a message to discuss products, pricing quotes, or order fulfillment details.
                  </p>
                </div>
              ) : (
                messages.map((msg) => {
                  const isOwn = user
                    ? msg.senderId === user.id
                    : (msg.senderId === 'cust' || msg.senderId === 'user' || msg.isOwn);
                  
                  const senderDisplayName = isOwn
                    ? currentUserName
                    : (!msg.senderName || msg.senderName === 'Contact' || msg.senderName === 'You' ? activeConv.contactName : msg.senderName);
                  const senderInitials = getUserInitials(senderDisplayName);

                  return (
                    <div
                      key={msg.id}
                      className={`flex gap-3 ${isOwn ? 'flex-row-reverse' : 'flex-row'}`}
                    >
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-gray-200 to-gray-300 dark:from-slate-700 dark:to-slate-600 text-gray-700 dark:text-gray-200 flex items-center justify-center text-xs font-bold shrink-0 mt-1 shadow-xs">
                        {senderInitials}
                      </div>

                      <div className={`max-w-[80%] sm:max-w-[70%] space-y-1`}>
                        <div className={`flex items-center gap-2 text-[10px] text-gray-400 ${isOwn ? 'justify-end' : 'justify-start'}`}>
                          <span className="font-semibold text-gray-900 dark:text-white">{senderDisplayName}</span>
                          <span>•</span>
                          <span>{msg.timestamp}</span>
                        </div>

                        <div
                          className={`rounded-2xl px-4 py-3 shadow-xs text-sm leading-relaxed ${
                            isOwn
                              ? 'bg-emerald-600 text-white rounded-tr-none'
                              : 'bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-gray-900 dark:text-white rounded-tl-none'
                          }`}
                        >
                          <p className="whitespace-pre-wrap break-words">{msg.content}</p>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Quick Reply Tags */}
            <div className="px-4 py-2 bg-white dark:bg-slate-800 border-t border-gray-100 dark:border-slate-700 flex items-center gap-2 overflow-x-auto no-scrollbar">
              <span className="text-[11px] font-semibold text-gray-400 shrink-0">Quick Ask:</span>
              {QUICK_PROMPTS.map((prompt, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => handleQuickPrompt(prompt)}
                  className="px-2.5 py-1 rounded-full text-xs bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-gray-300 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 hover:text-emerald-600 dark:hover:text-emerald-400 transition-all shrink-0 cursor-pointer border border-gray-200 dark:border-slate-600"
                >
                  {prompt}
                </button>
              ))}
            </div>

            {/* Input Bar & Controls */}
            <div className="p-4 bg-white dark:bg-slate-800 border-t border-gray-200 dark:border-slate-700 relative">
              {/* Emoji Picker Popover */}
              {showEmojiPicker && (
                <div className="absolute bottom-full left-4 mb-2 p-3 bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 shadow-xl grid grid-cols-6 gap-2 z-20">
                  {EMOJI_LIST.map((emoji) => (
                    <button
                      key={emoji}
                      type="button"
                      onClick={() => addEmoji(emoji)}
                      className="p-2 text-xl hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-transform hover:scale-115 cursor-pointer"
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              )}

              <form onSubmit={handleSend} className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => alert('Attachment simulation: File selected for transmission.')}
                  className="p-2.5 text-gray-400 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-xl transition-all cursor-pointer"
                  title="Attach file"
                >
                  <Paperclip size={20} />
                </button>
                <button
                  type="button"
                  onClick={() => setShowEmojiPicker((prev) => !prev)}
                  className={`p-2.5 rounded-xl transition-all cursor-pointer ${
                    showEmojiPicker ? 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/30' : 'text-gray-400 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-gray-100 dark:hover:bg-slate-700'
                  }`}
                  title="Add Emoji"
                >
                  <Smile size={20} />
                </button>
                
                <input
                  type="text"
                  placeholder={`Message ${activeConv.contactName}...`}
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  className="flex-1 px-4 py-2.5 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all"
                />

                <button
                  type="submit"
                  disabled={!inputMessage.trim()}
                  className="p-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-xs cursor-pointer flex items-center justify-center shrink-0"
                  title="Send message"
                >
                  <Send size={18} />
                </button>
              </form>
            </div>

          </div>

        </div>
      </div>
    </div>
  );
};

export default MessagesPage;
