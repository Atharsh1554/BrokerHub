import React, { useState, useRef, useEffect } from 'react';
import { Send, Paperclip, Smile, Search, ArrowLeft, MessageSquare, Sparkles, ShieldCheck } from 'lucide-react';
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
  const { conversations, messagesMap, sendMessage, fetchConversationMessages } = useApp();
  const [activeConvId, setActiveConvId] = useState(conversations[0]?.id || 'conv1');
  const [inputMessage, setInputMessage] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showMobileChat, setShowMobileChat] = useState(false);
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-white p-5 rounded-2xl border border-gray-border shadow-xs">
        <div>
          <h1 className="text-2xl font-bold text-text-primary tracking-tight">Broker Communication Desk</h1>
          <p className="text-xs sm:text-sm text-gray-text mt-0.5">
            Manage live buyer inquiries, order negotiations, and client deal messages
          </p>
        </div>
        <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-full border border-emerald-200 self-start sm:self-auto">
          <ShieldCheck size={14} />
          Encrypted Broker Channel
        </div>
      </div>

      {/* Main Container */}
      <div className="bg-white rounded-2xl border border-gray-border overflow-hidden shadow-xs h-[calc(100vh-210px)] min-h-[520px] flex flex-col">
        <div className="flex flex-1 h-full overflow-hidden relative">

          {/* Conversations Sidebar */}
          <div
            className={`w-full md:w-80 lg:w-96 border-r border-gray-border flex flex-col bg-white shrink-0 ${
              showMobileChat ? 'hidden md:flex' : 'flex'
            }`}
          >
            {/* Search */}
            <div className="p-4 border-b border-gray-border bg-gray-50/50">
              <div className="relative">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-label" />
                <input
                  type="text"
                  placeholder="Search clients & inquiries..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 border border-gray-border rounded-xl text-sm bg-white text-text-primary placeholder-gray-label focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                />
              </div>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto divide-y divide-gray-100">
              {filteredConversations.length === 0 ? (
                <div className="p-8 text-center text-gray-text">
                  <MessageSquare className="w-10 h-10 mx-auto mb-2 text-gray-300" />
                  <p className="text-sm font-medium">No client conversations</p>
                  <p className="text-xs text-gray-label mt-1">Try another search filter</p>
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
                          ? 'bg-primary-50/80 border-l-4 border-l-primary'
                          : 'hover:bg-gray-50'
                      }`}
                    >
                      <div className="relative shrink-0">
                        <div className="w-11 h-11 rounded-full bg-gradient-to-br from-indigo-500 to-teal-500 flex items-center justify-center text-white font-bold text-sm shadow-xs">
                          {initials}
                        </div>
                        {conv.online && (
                          <span className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-status-green rounded-full border-2 border-white" />
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <p className="text-sm font-semibold text-text-primary truncate">{conv.contactName}</p>
                          <span className="text-[11px] text-gray-label shrink-0 font-medium">{conv.timestamp}</span>
                        </div>
                        <p className="text-xs text-gray-text truncate">{conv.lastMessage || 'New inquiry received'}</p>
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
            className={`flex-1 flex flex-col bg-gray-bg/40 ${
              !showMobileChat ? 'hidden md:flex' : 'flex'
            }`}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 bg-white border-b border-gray-border shadow-xs">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setShowMobileChat(false)}
                  className="md:hidden p-2 text-gray-text hover:text-text-primary hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
                  title="Back to clients"
                >
                  <ArrowLeft size={20} />
                </button>
                <div className="relative">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-teal-500 flex items-center justify-center text-white font-bold text-sm shadow-xs">
                    {getUserInitials(activeConv.contactName)}
                  </div>
                  {activeConv.online && (
                    <span className="absolute bottom-0 right-0 w-3 h-3 bg-status-green rounded-full border-2 border-white" />
                  )}
                </div>
                <div>
                  <h2 className="text-sm font-bold text-text-primary">{activeConv.contactName}</h2>
                  <p className="text-[11px] text-emerald-600 font-semibold">
                    Verified Customer Inquiry
                  </p>
                </div>
              </div>
            </div>

            {/* Messages Display */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
              {messages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center p-6">
                  <div className="w-14 h-14 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-3">
                    <Sparkles size={28} />
                  </div>
                  <h3 className="text-base font-bold text-text-primary">No Messages Yet</h3>
                  <p className="text-xs text-gray-text max-w-sm mt-1">
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
                      className={`flex gap-3 ${isOwn ? 'flex-row-reverse' : 'flex-row'}`}
                    >
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-100 to-teal-100 text-primary flex items-center justify-center text-xs font-bold shrink-0 mt-1 shadow-xs">
                        {senderInitials}
                      </div>

                      <div className="max-w-[80%] sm:max-w-[70%] space-y-1">
                        <div className={`flex items-center gap-2 text-[10px] text-gray-label ${isOwn ? 'justify-end' : 'justify-start'}`}>
                          <span className="font-semibold text-text-primary">{senderDisplayName}</span>
                          <span>•</span>
                          <span>{msg.timestamp}</span>
                        </div>

                        <div
                          className={`rounded-2xl px-4 py-3 shadow-xs text-sm leading-relaxed ${
                            isOwn
                              ? 'bg-primary text-white rounded-tr-none'
                              : 'bg-white border border-gray-border text-text-primary rounded-tl-none'
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

            {/* Broker Quick Prompts */}
            <div className="px-4 py-2 bg-white border-t border-gray-100 flex items-center gap-2 overflow-x-auto no-scrollbar">
              <span className="text-[11px] font-semibold text-gray-label shrink-0">Templates:</span>
              {BROKER_QUICK_PROMPTS.map((prompt, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => handleQuickPrompt(prompt)}
                  className="px-2.5 py-1 rounded-full text-xs bg-gray-100 text-gray-text hover:bg-primary-50 hover:text-primary transition-all shrink-0 cursor-pointer border border-gray-border/60"
                >
                  {prompt}
                </button>
              ))}
            </div>

            {/* Input Bar */}
            <div className="p-4 bg-white border-t border-gray-border relative">
              {showEmojiPicker && (
                <div className="absolute bottom-full left-4 mb-2 p-3 bg-white rounded-xl border border-gray-border shadow-xl grid grid-cols-6 gap-2 z-20">
                  {EMOJI_LIST.map((emoji) => (
                    <button
                      key={emoji}
                      type="button"
                      onClick={() => addEmoji(emoji)}
                      className="p-2 text-xl hover:bg-gray-100 rounded-lg transition-transform hover:scale-115 cursor-pointer"
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              )}

              <form onSubmit={handleSend} className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => alert('Proposal document attached.')}
                  className="p-2.5 text-gray-label hover:text-primary hover:bg-gray-100 rounded-xl transition-all cursor-pointer"
                  title="Attach file / quote"
                >
                  <Paperclip size={20} />
                </button>
                <button
                  type="button"
                  onClick={() => setShowEmojiPicker((prev) => !prev)}
                  className={`p-2.5 rounded-xl transition-all cursor-pointer ${
                    showEmojiPicker ? 'text-primary bg-primary-50' : 'text-gray-label hover:text-primary hover:bg-gray-100'
                  }`}
                  title="Add Emoji"
                >
                  <Smile size={20} />
                </button>

                <input
                  type="text"
                  placeholder={`Reply to ${activeConv.contactName}...`}
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  className="flex-1 px-4 py-2.5 bg-gray-bg border border-gray-border rounded-xl text-sm text-text-primary placeholder-gray-label focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                />

                <button
                  type="submit"
                  disabled={!inputMessage.trim()}
                  className="p-2.5 bg-primary text-white rounded-xl hover:bg-primary-dark transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-xs cursor-pointer flex items-center justify-center shrink-0"
                  title="Send response"
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
