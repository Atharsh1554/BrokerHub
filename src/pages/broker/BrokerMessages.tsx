import React, { useState, useRef, useEffect } from 'react';
import { Send, Paperclip, Smile, Search, ArrowLeft, MessageSquare, Sparkles, ShieldCheck, X, ImageIcon } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { resolveUserDisplayName, getUserInitials } from '../../lib/userUtils';

const BROKER_QUICK_PROMPTS = [
  'I can provide a custom bulk price quote',
  'We have units available for immediate dispatch',
  'Let me send over the spec sheet and contract',
  'Could you confirm your target quantity?',
];

const EMOJI_LIST = ['😊', '👍', '🚀', '📦', '💼', '💰', '🙏', '✅', '⚡', '🤝', '📈', '🔥'];

export const BrokerMessages: React.FC = () => {
  const { user } = useAuth();
  const { conversations, messagesMap, sendMessage, fetchConversationMessages, clearConversationUnread } = useApp();
  const [activeConvId, setActiveConvId] = useState(conversations[0]?.id || 'conv1');
  const [inputMessage, setInputMessage] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showMobileChat, setShowMobileChat] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageName, setImageName] = useState<string>('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const activeConv = conversations.find((c) => c.id === activeConvId) || conversations[0] || {
    id: 'conv1',
    contactName: 'Client Contact',
    lastMessage: '',
    timestamp: '',
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
    // Do NOT clear unread here — unread is only resolved after the broker sends a reply
  };

  const handleSend = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputMessage.trim() && !imagePreview) return;

    if (imagePreview) {
      sendMessage(activeConvId, `[IMG]:${imagePreview}`, true);
      setImagePreview(null);
      setImageName('');
    }
    if (inputMessage.trim()) {
      sendMessage(activeConvId, inputMessage.trim(), true);
    }
    setInputMessage('');
    setShowEmojiPicker(false);
    clearConversationUnread(activeConvId);
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
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-white dark:bg-slate-800 p-3 sm:p-4 rounded-2xl border border-gray-border dark:border-slate-700 shadow-xs shrink-0 mb-2 sm:mb-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-text-primary dark:text-white tracking-tight">Broker Communication Desk</h1>
          <p className="hidden sm:block text-xs sm:text-sm text-gray-text dark:text-slate-400 mt-0.5">
            Manage live buyer inquiries, order negotiations, and client deal messages
          </p>
        </div>
        <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-3 py-1.5 rounded-full border border-emerald-200 dark:border-emerald-800 self-start sm:self-auto">
          <ShieldCheck size={14} />
          Encrypted Broker Channel
        </div>
      </div>

      {/* Main Container */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-border dark:border-slate-700 overflow-hidden shadow-xs flex-1 flex flex-col min-h-0">
        <div className="flex flex-1 h-full overflow-hidden relative min-h-0">

          {/* Conversations Sidebar */}
          <div
            className={`w-full md:w-80 lg:w-96 border-r border-gray-border dark:border-slate-700 flex flex-col bg-white dark:bg-slate-900 shrink-0 ${
              showMobileChat ? 'hidden md:flex' : 'flex'
            }`}
          >
            {/* Search */}
            <div className="p-3 sm:p-4 border-b border-gray-border dark:border-slate-700 bg-gray-50/50 dark:bg-slate-800/50">
              <div className="relative">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-label dark:text-slate-500" />
                <input
                  type="text"
                  placeholder="Search clients & inquiries..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 border border-gray-border dark:border-slate-600 rounded-xl text-sm bg-white dark:bg-slate-900 text-text-primary dark:text-white placeholder-gray-label dark:placeholder-slate-500 focus:border-primary dark:focus:border-emerald-500 focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                />
              </div>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto divide-y divide-gray-100 dark:divide-slate-800">
              {filteredConversations.length === 0 ? (
                <div className="p-8 text-center text-gray-text dark:text-slate-400">
                  <MessageSquare className="w-10 h-10 mx-auto mb-2 text-gray-300 dark:text-slate-600" />
                  <p className="text-sm font-medium">No client conversations</p>
                  <p className="text-xs text-gray-label dark:text-slate-500 mt-1">Try another search filter</p>
                </div>
              ) : (
                filteredConversations.map((conv) => {
                  const isSelected = activeConvId === conv.id;
                  const initials = getUserInitials(conv.contactName);
                  return (
                    <button
                      key={conv.id}
                      onClick={() => handleSelectConv(conv.id)}
                      className={`w-full flex items-center gap-3 p-3.5 sm:p-4 text-left transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-primary-50/80 dark:bg-emerald-950/40 border-l-4 border-l-primary dark:border-l-emerald-500'
                          : 'hover:bg-gray-50 dark:hover:bg-slate-800/70'
                      }`}
                    >
                      <div className="relative shrink-0">
                        <div className="w-10 sm:w-11 h-10 sm:h-11 rounded-full bg-gradient-to-br from-indigo-500 to-teal-500 flex items-center justify-center text-white font-bold text-sm shadow-xs">
                          {initials}
                        </div>
                        {conv.online && (
                          <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 rounded-full border-2 border-white dark:border-slate-900" />
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <p className="text-sm font-semibold text-text-primary dark:text-white truncate">{conv.contactName}</p>
                          <span className="text-[11px] text-gray-label dark:text-slate-500 shrink-0 font-medium">{conv.timestamp}</span>
                        </div>
                        <p className="text-xs text-gray-text dark:text-slate-400 truncate">{conv.lastMessage || 'New inquiry received'}</p>
                      </div>

                      {conv.unread > 0 && (
                        <span className="min-w-[20px] h-[20px] px-1.5 rounded-full bg-primary text-white text-[11px] font-bold flex items-center justify-center shrink-0 shadow-xs">
                          {conv.unread}
                        </span>
                      )}
                    </button>
                  );
                })
              )}
            </div>
          </div>

          {/* Chat Panel */}
          <div
            className={`flex-1 flex flex-col min-w-0 bg-gray-bg/40 dark:bg-slate-950/40 ${
              !showMobileChat ? 'hidden md:flex' : 'flex'
            }`}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-3 sm:p-4 bg-white dark:bg-slate-900 border-b border-gray-border dark:border-slate-700 shadow-xs shrink-0">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setShowMobileChat(false)}
                  className="md:hidden p-1.5 text-gray-text dark:text-slate-400 hover:text-text-primary dark:hover:text-white hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                  title="Back to clients"
                >
                  <ArrowLeft size={18} />
                </button>
                <div className="relative">
                  <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-gradient-to-br from-indigo-500 to-teal-500 flex items-center justify-center text-white font-bold text-sm shadow-xs">
                    {getUserInitials(activeConv.contactName)}
                  </div>
                  {activeConv.online && (
                    <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-white dark:border-slate-900" />
                  )}
                </div>
                <div>
                  <h2 className="text-sm font-bold text-text-primary dark:text-white">{activeConv.contactName}</h2>
                  <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold">
                    Verified Customer Inquiry
                  </p>
                </div>
              </div>
            </div>

            {/* Messages Display */}
            <div className="flex-1 overflow-y-auto p-3 sm:p-6 space-y-4 min-h-0">
              {messages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center p-6">
                  <div className="w-14 h-14 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mb-3">
                    <Sparkles size={28} />
                  </div>
                  <h3 className="text-base font-bold text-text-primary dark:text-white">No Messages Yet</h3>
                  <p className="text-xs text-gray-text dark:text-slate-400 max-w-sm mt-1">
                    Send a response or pricing breakdown to open dialogue with this buyer.
                  </p>
                </div>
              ) : (
                messages.map((msg) => {
                  const isOwn = user
                    ? msg.senderId === user.id
                    : (msg.senderId !== activeConv.id && msg.senderId !== 'c1' && msg.senderId !== 'cust');

                  const senderDisplayName = isOwn
                    ? currentUserName
                    : (!msg.senderName || msg.senderName === 'Contact' || msg.senderName === 'You' ? activeConv.contactName : msg.senderName);
                  const senderInitials = getUserInitials(senderDisplayName);

                  return (
                    <div
                      key={msg.id}
                      className={`flex gap-2.5 sm:gap-3 ${isOwn ? 'flex-row-reverse' : 'flex-row'}`}
                    >
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-100 to-teal-100 dark:from-indigo-950 dark:to-teal-950 text-primary dark:text-emerald-400 flex items-center justify-center text-xs font-bold shrink-0 mt-1 shadow-xs border border-transparent dark:border-slate-700">
                        {senderInitials}
                      </div>

                      <div className="max-w-[85%] sm:max-w-[70%] space-y-1">
                        <div className={`flex items-center gap-2 text-[10px] text-gray-label dark:text-slate-400 ${isOwn ? 'justify-end' : 'justify-start'}`}>
                          <span className="font-semibold text-text-primary dark:text-slate-200">{senderDisplayName}</span>
                          <span>•</span>
                          <span>{msg.timestamp}</span>
                        </div>

                        <div
                          className={`rounded-2xl shadow-xs text-sm leading-relaxed overflow-hidden ${
                            isOwn
                              ? 'bg-primary dark:bg-emerald-600 text-white rounded-tr-none'
                              : 'bg-white dark:bg-slate-800 border border-gray-border dark:border-slate-700 text-text-primary dark:text-slate-100 rounded-tl-none'
                          }`}
                        >
                          {msg.content.startsWith('[IMG]:') ? (
                            <img
                              src={msg.content.replace('[IMG]:', '')}
                              alt="Attachment"
                              className="max-w-[240px] max-h-[200px] object-cover w-full rounded-2xl"
                            />
                          ) : (
                            <p className="whitespace-pre-wrap break-words px-3.5 sm:px-4 py-2.5 sm:py-3">{msg.content}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Broker Quick Prompts */}
            <div className="px-3 sm:px-4 py-2 bg-white dark:bg-slate-900 border-t border-gray-100 dark:border-slate-800 flex items-center gap-2 overflow-x-auto no-scrollbar shrink-0">
              <span className="text-[11px] font-semibold text-gray-label dark:text-slate-500 shrink-0">Templates:</span>
              {BROKER_QUICK_PROMPTS.map((prompt, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => handleQuickPrompt(prompt)}
                  className="px-2.5 py-1 rounded-full text-xs bg-gray-100 dark:bg-slate-800 text-gray-text dark:text-slate-300 hover:bg-primary-50 dark:hover:bg-emerald-950/40 hover:text-primary dark:hover:text-emerald-400 transition-all shrink-0 cursor-pointer border border-gray-border/60 dark:border-slate-700 whitespace-nowrap"
                >
                  {prompt}
                </button>
              ))}
            </div>

            {/* Input Bar */}
            <div className="bg-white dark:bg-slate-900 border-t border-gray-border dark:border-slate-700 relative shrink-0">
              {/* Image Preview Strip */}
              {imagePreview && (
                <div className="flex items-center gap-3 px-4 pt-3 pb-2 border-b border-gray-100 dark:border-slate-800">
                  <div className="relative shrink-0">
                    <img src={imagePreview} alt="preview" className="w-16 h-16 rounded-xl object-cover border border-gray-200 dark:border-slate-700" />
                    <button
                      type="button"
                      onClick={() => { setImagePreview(null); setImageName(''); }}
                      className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center shadow cursor-pointer"
                    >
                      <X size={10} />
                    </button>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-gray-700 dark:text-slate-300 flex items-center gap-1">
                      <ImageIcon size={12} className="text-primary dark:text-emerald-400" /> Image ready to send
                    </p>
                    <p className="text-[11px] text-gray-label dark:text-slate-500 truncate max-w-[180px]">{imageName}</p>
                  </div>
                </div>
              )}

              {showEmojiPicker && (
                <div className="absolute bottom-full left-4 mb-2 p-3 bg-white dark:bg-slate-800 rounded-xl border border-gray-border dark:border-slate-700 shadow-xl grid grid-cols-6 gap-2 z-20">
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

              <form onSubmit={handleSend} className="flex items-center gap-1.5 sm:gap-2 p-2.5 sm:p-4">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className={`p-2 sm:p-2.5 rounded-xl transition-all cursor-pointer shrink-0 ${
                    imagePreview
                      ? 'text-primary dark:text-emerald-400 bg-primary-50 dark:bg-emerald-950/40'
                      : 'text-gray-label dark:text-slate-500 hover:text-primary dark:hover:text-emerald-400 hover:bg-gray-100 dark:hover:bg-slate-800'
                  }`}
                  title="Attach image"
                >
                  <Paperclip size={18} />
                </button>
                <button
                  type="button"
                  onClick={() => setShowEmojiPicker((prev) => !prev)}
                  className={`p-2 sm:p-2.5 rounded-xl transition-all cursor-pointer shrink-0 ${
                    showEmojiPicker ? 'text-primary dark:text-emerald-400 bg-primary-50 dark:bg-emerald-950/40' : 'text-gray-label dark:text-slate-500 hover:text-primary dark:hover:text-emerald-400 hover:bg-gray-100 dark:hover:bg-slate-800'
                  }`}
                  title="Add Emoji"
                >
                  <Smile size={18} />
                </button>

                <input
                  type="text"
                  placeholder={`Reply to ${activeConv.contactName}...`}
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  className="flex-1 min-w-0 px-3 sm:px-4 py-2 sm:py-2.5 bg-gray-bg dark:bg-slate-800 border border-gray-border dark:border-slate-600 rounded-xl text-xs sm:text-sm text-text-primary dark:text-white placeholder-gray-label dark:placeholder-slate-500 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                />

                <button
                  type="submit"
                  disabled={!inputMessage.trim() && !imagePreview}
                  className="p-2 sm:p-2.5 bg-primary dark:bg-emerald-600 text-white rounded-xl hover:bg-primary-dark transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-xs cursor-pointer flex items-center justify-center shrink-0"
                  title="Send response"
                >
                  <Send size={16} />
                </button>
              </form>
            </div>

          </div>

        </div>
      </div>
    </div>
  );
};
