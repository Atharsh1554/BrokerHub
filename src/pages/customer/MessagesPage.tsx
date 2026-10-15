import React, { useState, useRef, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Send, Paperclip, Smile, Search, ArrowLeft, MessageSquare, Sparkles, X, ImageIcon } from 'lucide-react';
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
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageName, setImageName] = useState<string>('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
    if (!inputMessage.trim() && !imagePreview) return;

    if (imagePreview) {
      // Send image message — encode as special prefix so bubble can render it
      sendMessage(activeConvId, `[IMG]:${imagePreview}`, true);
      setImagePreview(null);
      setImageName('');
    }
    if (inputMessage.trim()) {
      sendMessage(activeConvId, inputMessage.trim(), true);
    }
    setInputMessage('');
    setShowEmojiPicker(false);
  };

  const handleAttachImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file.');
      return;
    }
    const reader = new FileReader();
    reader.onload = (ev) => {
      setImagePreview(ev.target?.result as string);
      setImageName(file.name);
    };
    reader.readAsDataURL(file);
    // Reset input so same file can be re-selected
    e.target.value = '';
  };

  const handleQuickPrompt = (prompt: string) => {
    setInputMessage(prompt);
  };

  const addEmoji = (emoji: string) => {
    setInputMessage((prev) => prev + emoji);
  };

  const currentUserName = resolveUserDisplayName(user?.fullName, user?.email);

  return (
    <div className="flex flex-col h-full min-h-0 flex-1">
      {/* Page Header */}
      <div className="mb-2 sm:mb-3 shrink-0 flex items-center justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white tracking-tight">Messages</h1>
          <p className="hidden sm:block text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-0.5">
            Direct real-time channel with your verified brokers
          </p>
        </div>
      </div>

      {/* Main Container */}
      <div className="flex-1 bg-white dark:bg-slate-900 rounded-2xl border border-gray-200 dark:border-slate-700 overflow-hidden shadow-sm flex min-h-0">
        
        {/* ── Sidebar: Conversation List ── */}
        <div
          className={`w-full md:w-72 lg:w-80 border-r border-gray-200 dark:border-slate-700 flex flex-col bg-white dark:bg-slate-900 shrink-0 ${
            showMobileChat ? 'hidden md:flex' : 'flex'
          }`}
        >
          {/* Sidebar Search */}
          <div className="p-3 border-b border-gray-100 dark:border-slate-700 bg-gray-50/60 dark:bg-slate-800/60 shrink-0">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-slate-500 pointer-events-none" />
              <input
                type="text"
                placeholder="Search contacts..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 border border-gray-200 dark:border-slate-600 rounded-xl text-sm bg-white dark:bg-slate-900 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-slate-500 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
              />
            </div>
          </div>

          {/* Conversations */}
          <div className="flex-1 overflow-y-auto divide-y divide-gray-100 dark:divide-slate-800">
            {filteredConversations.length === 0 ? (
              <div className="p-8 text-center">
                <MessageSquare className="w-10 h-10 mx-auto mb-2 text-gray-300 dark:text-slate-600" />
                <p className="text-sm font-medium text-gray-500 dark:text-slate-400">No conversations</p>
                <p className="text-xs text-gray-400 dark:text-slate-500 mt-1">Try a different search</p>
              </div>
            ) : (
              filteredConversations.map((conv) => {
                const isSelected = activeConvId === conv.id;
                const initials = getUserInitials(conv.contactName);
                return (
                  <button
                    key={conv.id}
                    onClick={() => handleSelectConv(conv.id)}
                    className={`w-full flex items-center gap-3 px-4 py-3.5 text-left transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-emerald-50 dark:bg-emerald-900/20 border-l-[3px] border-l-emerald-600 dark:border-l-emerald-400'
                        : 'hover:bg-gray-50 dark:hover:bg-slate-800/70 border-l-[3px] border-l-transparent'
                    }`}
                  >
                    {/* Avatar */}
                    <div className="relative shrink-0">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white font-bold text-sm shadow-xs">
                        {initials}
                      </div>
                      {conv.online && (
                        <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 rounded-full border-2 border-white dark:border-slate-900" />
                      )}
                    </div>

                    {/* Text */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1 mb-0.5">
                        <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{conv.contactName}</p>
                        <span className="text-[10px] text-gray-400 dark:text-slate-500 shrink-0">{conv.timestamp}</span>
                      </div>
                      <p className="text-xs text-gray-500 dark:text-slate-400 truncate">{conv.lastMessage || 'Start chatting'}</p>
                    </div>

                    {/* Unread badge */}
                    {conv.unread > 0 && (
                      <span className="min-w-[18px] h-[18px] px-1 rounded-full bg-emerald-600 text-white text-[10px] font-bold flex items-center justify-center shrink-0">
                        {conv.unread}
                      </span>
                    )}
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* ── Main Chat Panel ── */}
        <div
          className={`flex-1 flex flex-col min-w-0 bg-gray-50/50 dark:bg-slate-950/50 ${
            !showMobileChat ? 'hidden md:flex' : 'flex'
          }`}
        >
          {/* Chat Header */}
          <div className="flex items-center gap-3 px-4 py-3 bg-white dark:bg-slate-900 border-b border-gray-200 dark:border-slate-700 shrink-0 shadow-xs">
            {/* Mobile back button */}
            <button
              onClick={() => setShowMobileChat(false)}
              className="md:hidden p-1.5 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-colors cursor-pointer"
              title="Back"
            >
              <ArrowLeft size={18} />
            </button>

            {/* Contact avatar */}
            <div className="relative shrink-0">
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white font-bold text-sm shadow-xs">
                {getUserInitials(activeConv.contactName)}
              </div>
              {activeConv.online && (
                <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-white dark:border-slate-900" />
              )}
            </div>

            <div className="flex-1 min-w-0">
              <h2 className="text-sm font-bold text-gray-900 dark:text-white truncate">{activeConv.contactName}</h2>
              <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse inline-block" />
                {activeConv.online ? 'Online' : 'Offline'}
              </p>
            </div>
          </div>

          {/* Messages area */}
          <div className="flex-1 overflow-y-auto px-4 py-5 space-y-4 min-h-0">
            {messages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-6">
                <div className="w-14 h-14 rounded-2xl bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-3">
                  <Sparkles size={26} />
                </div>
                <h3 className="text-sm font-bold text-gray-900 dark:text-white">Start the Conversation</h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 max-w-xs mt-1">
                  Send a message to discuss products, pricing, or order details.
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
                    className={`flex gap-2.5 ${isOwn ? 'flex-row-reverse' : 'flex-row'}`}
                  >
                    {/* Avatar */}
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5 shadow-xs ${
                      isOwn
                        ? 'bg-emerald-600 text-white'
                        : 'bg-gray-200 dark:bg-slate-700 text-gray-700 dark:text-gray-200'
                    }`}>
                      {senderInitials}
                    </div>

                    <div className={`max-w-[75%] sm:max-w-[65%] flex flex-col ${isOwn ? 'items-end' : 'items-start'}`}>
                      {/* Sender + time */}
                      <div className={`flex items-center gap-1.5 text-[10px] text-gray-400 dark:text-slate-500 mb-1 ${isOwn ? 'flex-row-reverse' : 'flex-row'}`}>
                        <span className="font-semibold text-gray-700 dark:text-slate-300">{senderDisplayName}</span>
                        <span>·</span>
                        <span>{msg.timestamp}</span>
                      </div>

                      {/* Bubble */}
                      <div
                        className={`rounded-2xl text-sm leading-relaxed overflow-hidden shadow-xs ${
                          isOwn
                            ? 'bg-emerald-600 text-white rounded-tr-none'
                            : 'bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-gray-900 dark:text-white rounded-tl-none'
                        }`}
                      >
                        {msg.content.startsWith('[IMG]:') ? (
                          <img
                            src={msg.content.replace('[IMG]:', '')}
                            alt="Attachment"
                            className="max-w-[220px] max-h-[180px] object-cover w-full rounded-2xl"
                          />
                        ) : (
                          <p className="whitespace-pre-wrap break-words px-3.5 py-2.5">{msg.content}</p>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick prompts */}
          <div className="px-4 py-2 bg-white dark:bg-slate-900 border-t border-gray-100 dark:border-slate-800 flex items-center gap-2 overflow-x-auto no-scrollbar shrink-0">
            <span className="text-[11px] font-semibold text-gray-400 dark:text-slate-500 shrink-0">Quick:</span>
            {QUICK_PROMPTS.map((prompt, i) => (
              <button
                key={i}
                type="button"
                onClick={() => handleQuickPrompt(prompt)}
                className="px-2.5 py-1 rounded-full text-xs bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-slate-300 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 hover:text-emerald-600 dark:hover:text-emerald-400 transition-all shrink-0 cursor-pointer border border-gray-200 dark:border-slate-700 whitespace-nowrap"
              >
                {prompt}
              </button>
            ))}
          </div>

          {/* Input Bar */}
          <div className="bg-white dark:bg-slate-900 border-t border-gray-200 dark:border-slate-700 relative shrink-0">
            {/* Image Preview */}
            {imagePreview && (
              <div className="flex items-center gap-3 px-4 pt-3 pb-2 border-b border-gray-100 dark:border-slate-800">
                <div className="relative shrink-0">
                  <img src={imagePreview} alt="preview" className="w-14 h-14 rounded-xl object-cover border border-gray-200 dark:border-slate-600" />
                  <button
                    type="button"
                    onClick={() => { setImagePreview(null); setImageName(''); }}
                    className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center shadow cursor-pointer"
                  >
                    <X size={10} />
                  </button>
                </div>
                <div>
                  <p className="text-xs font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-1">
                    <ImageIcon size={12} className="text-emerald-600" /> Ready to send
                  </p>
                  <p className="text-[11px] text-gray-400 dark:text-slate-500 truncate max-w-[160px]">{imageName}</p>
                </div>
              </div>
            )}

            {/* Emoji Picker */}
            {showEmojiPicker && (
              <div className="absolute bottom-full left-4 mb-2 p-3 bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 shadow-xl grid grid-cols-6 gap-1.5 z-20">
                {EMOJI_LIST.map((emoji) => (
                  <button key={emoji} type="button" onClick={() => addEmoji(emoji)}
                    className="p-2 text-xl hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-transform hover:scale-115 cursor-pointer">
                    {emoji}
                  </button>
                ))}
              </div>
            )}

            {/* Hidden file input */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleAttachImage}
            />

            {/* Input form */}
            <form onSubmit={handleSend} className="flex items-center gap-2 px-3 py-3">
              {/* Attach */}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className={`p-2 rounded-xl transition-all cursor-pointer shrink-0 ${
                  imagePreview
                    ? 'text-emerald-600 bg-emerald-50 dark:bg-emerald-900/30'
                    : 'text-gray-400 dark:text-slate-500 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-gray-100 dark:hover:bg-slate-800'
                }`}
                title="Attach image"
              >
                <Paperclip size={18} />
              </button>

              {/* Emoji */}
              <button
                type="button"
                onClick={() => setShowEmojiPicker((prev) => !prev)}
                className={`p-2 rounded-xl transition-all cursor-pointer shrink-0 ${
                  showEmojiPicker
                    ? 'text-emerald-600 bg-emerald-50 dark:bg-emerald-900/30'
                    : 'text-gray-400 dark:text-slate-500 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-gray-100 dark:hover:bg-slate-800'
                }`}
                title="Add emoji"
              >
                <Smile size={18} />
              </button>

              {/* Text input */}
              <input
                type="text"
                placeholder={`Message ${activeConv.contactName}...`}
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                className="flex-1 min-w-0 px-4 py-2.5 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-600 rounded-xl text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-slate-500 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
              />

              {/* Send */}
              <button
                type="submit"
                disabled={!inputMessage.trim() && !imagePreview}
                className="p-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-xs cursor-pointer flex items-center justify-center shrink-0"
                title="Send message"
              >
                <Send size={17} />
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MessagesPage;
