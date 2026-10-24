import React, { useState, useRef, useEffect } from 'react';
import {
  MessageSquare,
  Send,
  CheckCheck,
  Search,
  ArrowLeft,
  Phone,
  Video,
  MoreVertical,
  Smile,
  Paperclip,
  Mic,
  Play,
  Pause,
  Clock,
  X,
  FileText,
  Image as ImageIcon,
  Check,
  Sparkles,
} from 'lucide-react';
import { UserSession } from '../types';
import {
  subscribeToUserConversations,
  subscribeToConversationMessages,
  sendMessageToFirestore,
} from '../firebase';

interface VoiceNote {
  duration: string;
  waveform: number[]; // relative bar heights 1..10
}

interface ChatMessage {
  id: string;
  sender: 'me' | 'them';
  text?: string;
  time: string;
  date?: string; // e.g., '16-Sentyabr'
  isRead?: boolean;
  voiceNote?: VoiceNote;
  attachment?: {
    name: string;
    size: string;
    type: 'image' | 'file';
    previewUrl?: string;
  };
}

interface ChatConversation {
  id: string;
  name: string;
  handle: string;
  avatar: string;
  role: string;
  status: 'online' | string; // 'online' or last seen string
  unreadCount: number;
  lastMessageTime: string;
  lastMessageText?: string;
  pinned?: boolean;
}

interface MessagesPageProps {
  currentUser?: UserSession | null;
}

export const MessagesPage: React.FC<MessagesPageProps> = ({ currentUser }) => {
  // Mobile responsive view: 'list' (conversations list) or 'chat' (active chat conversation)
  const [mobileView, setMobileView] = useState<'list' | 'chat'>('list');
  const [conversations, setConversations] = useState<ChatConversation[]>([]);
  const [activeChatId, setActiveChatId] = useState<string>('');
  const [messagesMap, setMessagesMap] = useState<Record<string, ChatMessage[]>>({});
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [inputText, setInputText] = useState<string>('');
  const [showEmojiPicker, setShowEmojiPicker] = useState<boolean>(false);
  const [attachedFile, setAttachedFile] = useState<{ name: string; size: string } | null>(null);

  // Audio voice note playback simulation
  const [playingVoiceId, setPlayingVoiceId] = useState<string | null>(null);
  const [voiceProgress, setVoiceProgress] = useState<number>(0);
  const playbackTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Scrolling reference
  const messagesContainerRef = useRef<HTMLDivElement | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Ensure window stays scrolled to top when entering messages page
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, []);

  // Real-time subscription to conversations from Firestore
  useEffect(() => {
    if (!currentUser?.uid) {
      setConversations([]);
      setActiveChatId('');
      return;
    }

    const unsub = subscribeToUserConversations(
      currentUser.uid,
      (convs) => {
        setConversations(convs);
        setActiveChatId((prev) => {
          if (prev && convs.some((c) => c.id === prev)) return prev;
          return convs[0]?.id || '';
        });
      },
      (err) => {
        console.error("Firestore suhbatlarni yuklash xatosi:", err);
      }
    );

    return () => unsub();
  }, [currentUser?.uid]);

  // Real-time subscription to messages for active conversation
  useEffect(() => {
    if (!activeChatId) return;

    const unsub = subscribeToConversationMessages(
      activeChatId,
      (msgs) => {
        const formattedMsgs: ChatMessage[] = msgs.map((m) => ({
          id: m.id,
          sender: m.senderId === currentUser?.uid ? 'me' : 'them',
          text: m.text,
          time: m.time || '',
          date: m.date || 'Bugun',
          isRead: m.isRead,
          voiceNote: m.voiceNote,
          attachment: m.attachment,
        }));

        setMessagesMap((prev) => ({
          ...prev,
          [activeChatId]: formattedMsgs,
        }));
      },
      (err) => {
        console.error("Firestore xabarlarni yuklash xatosi:", err);
      }
    );

    return () => unsub();
  }, [activeChatId, currentUser?.uid]);

  // Get active conversation object
  const activeConversation = conversations.find((c) => c.id === activeChatId);
  const activeMessages = activeChatId ? messagesMap[activeChatId] || [] : [];

  // Filter conversations by search
  const filteredConversations = conversations.filter((c) => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    const lastMsg = c.lastMessageText || messagesMap[c.id]?.[messagesMap[c.id]?.length - 1]?.text || '';
    return (
      c.name.toLowerCase().includes(q) ||
      c.handle.toLowerCase().includes(q) ||
      lastMsg.toLowerCase().includes(q)
    );
  });

  // Auto-scroll ONLY the chat messages internal container to bottom, never window
  useEffect(() => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
    }
  }, [activeChatId, activeMessages.length]);

  // Voice playback simulation loop
  useEffect(() => {
    if (playingVoiceId) {
      setVoiceProgress(0);
      playbackTimerRef.current = setInterval(() => {
        setVoiceProgress((prev) => {
          if (prev >= 100) {
            clearInterval(playbackTimerRef.current as NodeJS.Timeout);
            setPlayingVoiceId(null);
            return 0;
          }
          return prev + 6;
        });
      }, 250);
    } else {
      if (playbackTimerRef.current) {
        clearInterval(playbackTimerRef.current);
      }
    }
    return () => {
      if (playbackTimerRef.current) {
        clearInterval(playbackTimerRef.current);
      }
    };
  }, [playingVoiceId]);

  const toggleVoicePlay = (msgId: string) => {
    if (playingVoiceId === msgId) {
      setPlayingVoiceId(null);
    } else {
      setPlayingVoiceId(msgId);
    }
  };

  // Select conversation
  const handleSelectChat = (chatId: string) => {
    setActiveChatId(chatId);
    setMobileView('chat');

    // Mark as read in local view
    setConversations((prev) =>
      prev.map((c) => (c.id === chatId ? { ...c, unreadCount: 0 } : c))
    );
  };

  // Textarea auto-resize
  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputText(e.target.value);
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  };

  // Send message to Firestore
  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputText.trim() && !attachedFile) return;
    if (!activeChatId || !currentUser?.uid) return;

    const textToSend = inputText.trim();
    const fileToSend = attachedFile;

    setInputText('');
    setAttachedFile(null);
    setShowEmojiPicker(false);

    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }

    try {
      await sendMessageToFirestore(activeChatId, currentUser.uid, {
        text: textToSend || undefined,
        attachment: fileToSend
          ? {
              name: fileToSend.name,
              size: fileToSend.size,
              type: fileToSend.name.match(/\.(jpg|jpeg|png|webp|gif)$/i) ? 'image' : 'file',
            }
          : undefined,
      });
    } catch (err) {
      console.error("Xabarni Firestore ga yuborishda xatolik:", err);
    }
  };

  // Send voice note simulation
  const handleSendVoiceNote = async () => {
    if (!activeChatId || !currentUser?.uid) return;
    try {
      await sendMessageToFirestore(activeChatId, currentUser.uid, {
        voiceNote: {
          duration: '00:12',
          waveform: [4, 7, 9, 6, 8, 10, 7, 5, 8, 9, 6, 4, 6, 8, 5, 3],
        },
      });
    } catch (err) {
      console.error("Ovozli xabarni yuborishda xatolik:", err);
    }
  };

  // Keyboard shortcut: Enter to send (Shift+Enter for new line)
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Attachment handler
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const sizeMb = (file.size / (1024 * 1024)).toFixed(1);
      setAttachedFile({
        name: file.name,
        size: `${sizeMb} MB`,
      });
    }
  };

  const popularEmojis = ['👍', '🔥', '❤️', '👏', '😊', '🚀', '✨', '🎉', '👌', '🤝', '💯', '🙌'];

  return (
    <div id="messages-page-wrapper" className="w-full max-w-6xl mx-auto px-2 sm:px-4 lg:px-6 pt-2 sm:pt-4 flex-1 flex flex-col">
      {/* Page Header (compact) */}
      <div className="hidden md:flex items-center justify-between mb-3">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-100/80 dark:border-indigo-900/60 text-xs font-heading font-bold text-indigo-700 dark:text-indigo-300 mb-1">
            <MessageSquare className="w-3.5 h-3.5" />
            <span>Collabix Chat Messenger</span>
          </div>
          <h1 className="font-heading font-extrabold text-2xl text-slate-900 dark:text-white tracking-tight">
            Xabarlar
          </h1>
        </div>
        <div className="flex items-center gap-2 text-xs font-mono text-slate-500 dark:text-slate-400 bg-white dark:bg-[#1A1A24] px-3.5 py-2 rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-2xs">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>Xavfsiz va shifrlangan muloqot</span>
        </div>
      </div>

      {/* Main Telegram-style Container: 2 columns on desktop, full-screen swap on mobile */}
      <div className="bg-white dark:bg-[#1A1A24] rounded-2xl sm:rounded-3xl border border-slate-200/90 dark:border-slate-800 shadow-sm overflow-hidden h-[calc(100dvh-130px)] sm:h-[calc(100vh-140px)] min-h-[520px] max-h-[820px] flex flex-col md:flex-row flex-1">
        
        {/* ================================================================= */}
        {/* 1-USTUN — SUHBATLAR RO'YXATI (Chat List)                          */}
        {/* ================================================================= */}
        <div
          id="chat-conversations-list-column"
          className={`w-full md:w-80 lg:w-96 flex flex-col border-r border-slate-200/80 dark:border-slate-800 bg-white dark:bg-[#1A1A24] shrink-0 ${
            mobileView === 'chat' ? 'hidden md:flex' : 'flex'
          }`}
        >
          {/* Header with Title & Search */}
          <div className="p-3.5 sm:p-4 border-b border-slate-100 dark:border-slate-800 bg-white dark:bg-[#1A1A24]">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-heading font-extrabold text-lg sm:text-xl text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
                <span>Xabarlar</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 font-mono font-bold">
                  {conversations.length}
                </span>
              </h2>
            </div>

            {/* Search Input Bar */}
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                id="input-chat-search"
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Qidiruv (ism yoki xabar)..."
                className="w-full pl-10 pr-9 py-2.5 rounded-xl bg-slate-50/80 dark:bg-[#12121A] border border-slate-200/80 dark:border-slate-700 text-xs sm:text-sm font-body text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-hidden focus:border-indigo-500 focus:bg-white dark:focus:bg-[#12121A] transition-all"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                  aria-label="Tozalash"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Conversations Scroll Area */}
          <div className="flex-1 overflow-y-auto divide-y divide-slate-100/80 dark:divide-slate-800">
            {filteredConversations.length > 0 ? (
              filteredConversations.map((chat) => {
                const isSelected = chat.id === activeChatId;
                const lastMsgObj = messagesMap[chat.id]?.[messagesMap[chat.id]?.length - 1];
                const lastMsgSnippet = lastMsgObj?.voiceNote
                  ? '🎤 Ovozli xabar'
                  : lastMsgObj?.attachment
                  ? '📎 Biriktirilgan fayl'
                  : lastMsgObj?.text || 'Yangi suhbat';

                return (
                  <button
                    key={chat.id}
                    id={`chat-item-${chat.id}`}
                    type="button"
                    onClick={() => handleSelectChat(chat.id)}
                    className={`w-full p-3.5 sm:p-4 flex items-center gap-3 text-left transition-all cursor-pointer relative ${
                      isSelected
                        ? 'bg-indigo-50/70 dark:bg-indigo-950/40 border-l-4 border-indigo-600'
                        : 'hover:bg-slate-50/90 dark:hover:bg-slate-800/50'
                    }`}
                  >
                    {/* Avatar with Online indicator */}
                    <div className="relative shrink-0">
                      <img
                        src={chat.avatar}
                        alt={chat.name}
                        referrerPolicy="no-referrer"
                        loading="lazy"
                        decoding="async"
                        width={48}
                        height={48}
                        className="w-12 h-12 rounded-full object-cover border border-slate-200/90 dark:border-slate-700"
                      />
                      {chat.status === 'online' && (
                        <span
                          title="Onlayn"
                          className="absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-slate-900"
                        />
                      )}
                    </div>

                    {/* Chat text information */}
                    <div className="min-w-0 flex-1">
                      {/* Name & Timestamp */}
                      <div className="flex items-center justify-between gap-1 mb-1">
                        <span className="font-heading font-bold text-sm text-slate-900 dark:text-white truncate">
                          {chat.name}
                        </span>
                        <span className="text-[11px] font-mono text-slate-400 dark:text-slate-500 shrink-0">
                          {chat.lastMessageTime}
                        </span>
                      </div>

                      {/* Message Snippet & Unread Badge */}
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-xs text-slate-500 dark:text-[#D0D0D8] font-body truncate leading-snug">
                          {lastMsgObj?.sender === 'me' && (
                            <span className="text-indigo-600 dark:text-indigo-400 font-medium mr-1">Siz:</span>
                          )}
                          {lastMsgSnippet}
                        </p>

                        {chat.unreadCount > 0 && (
                          <span className="px-2 py-0.5 min-w-[20px] h-5 rounded-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-[10.5px] font-bold font-mono flex items-center justify-center shrink-0 shadow-xs">
                            {chat.unreadCount}
                          </span>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })
            ) : (
              <div className="p-8 text-center text-slate-400 dark:text-slate-500 text-xs font-body flex flex-col items-center justify-center flex-1">
                <MessageSquare className="w-8 h-8 text-slate-300 dark:text-slate-600 mb-2" />
                <span>Hozircha suhbatlar mavjud emas</span>
              </div>
            )}
          </div>
        </div>

        {/* ================================================================= */}
        {/* 2-USTUN — OCHIQ SUHBAT (Active Chat Window)                        */}
        {/* ================================================================= */}
        <div
          id="chat-active-window-column"
          className={`w-full flex-1 flex flex-col bg-[#F9FAFC] dark:bg-[#12121A] ${
            mobileView === 'list' ? 'hidden md:flex' : 'flex'
          }`}
        >
          {!activeConversation ? (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-[#F9FAFC] dark:bg-[#12121A]">
              <div className="w-16 h-16 rounded-3xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mb-3">
                <MessageSquare className="w-8 h-8" />
              </div>
              <h3 className="font-heading font-bold text-base sm:text-lg text-slate-900 dark:text-white mb-1">
                Hozircha xabarlar yoʻq
              </h3>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-[#D0D0D8] font-body max-w-sm">
                Kreatorlar yoki brendlar bilan boshlangan suhbatlar va takliflar shu yerda paydo boʻladi.
              </p>
            </div>
          ) : (
            <>
              {/* Active Chat Top Header */}
              <div className="p-3 sm:p-4 bg-white dark:bg-[#1A1A24] border-b border-slate-200/80 dark:border-slate-800 flex items-center justify-between gap-3 shadow-2xs z-10">
            <div className="flex items-center gap-3 min-w-0">
              {/* Back button for mobile */}
              <button
                type="button"
                id="btn-chat-back-to-list"
                onClick={() => setMobileView('list')}
                className="md:hidden p-2 -ml-1 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
                aria-label="Suhbatlar roʻyxatiga qaytish"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>

              {/* Avatar */}
              <div className="relative shrink-0">
                <img
                  src={activeConversation.avatar}
                  alt={activeConversation.name}
                  referrerPolicy="no-referrer"
                  loading="lazy"
                  decoding="async"
                  width={44}
                  height={44}
                  className="w-10 h-10 sm:w-11 sm:h-11 rounded-full object-cover border border-slate-200 dark:border-slate-700"
                />
                {activeConversation.status === 'online' && (
                  <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-slate-900" />
                )}
              </div>

              {/* Partner Name & Last Seen Status */}
              <div className="min-w-0">
                <h3 className="font-heading font-bold text-sm sm:text-base text-slate-900 dark:text-white truncate flex items-center gap-2">
                  <span>{activeConversation.name}</span>
                  <span className="hidden sm:inline-block text-xs font-mono font-normal text-slate-400 dark:text-slate-500">
                    {activeConversation.handle}
                  </span>
                </h3>
                <p className="text-[11px] sm:text-xs font-body flex items-center gap-1.5 truncate">
                  {activeConversation.status === 'online' ? (
                    <span className="text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block animate-pulse" />
                      onlayn
                    </span>
                  ) : (
                    <span className="text-slate-400 dark:text-slate-500">
                      {activeConversation.status}
                    </span>
                  )}
                </p>
              </div>
            </div>

            {/* Top Action Icons (Call, Video, More) */}
            <div className="flex items-center gap-1 text-slate-500 dark:text-slate-400">
              <button
                type="button"
                id="btn-chat-audio-call"
                title="Qoʻngʻiroq qilish"
                className="p-2 sm:p-2.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors cursor-pointer active:scale-95"
              >
                <Phone className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
              <button
                type="button"
                id="btn-chat-video-call"
                title="Video aloqa"
                className="p-2 sm:p-2.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors cursor-pointer active:scale-95"
              >
                <Video className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
              <button
                type="button"
                id="btn-chat-more-options"
                title="Qoʻshimcha sozlamalar"
                className="p-2 sm:p-2.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-800 dark:hover:text-white transition-colors cursor-pointer"
              >
                <MoreVertical className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
            </div>
          </div>

          {/* Messages Stream (Vertically Scrollable) */}
          <div
            id="chat-messages-stream"
            ref={messagesContainerRef}
            className="flex-1 p-3 sm:p-5 overflow-y-auto space-y-4 bg-gradient-to-b from-slate-50/60 to-white"
          >
            {activeMessages.map((msg, index) => {
              const isMe = msg.sender === 'me';
              const prevMsg = activeMessages[index - 1];
              const showDateDivider = !prevMsg || prevMsg.date !== msg.date;

              return (
                <React.Fragment key={msg.id}>
                  {/* Date Divider (e.g. "16-Sentyabr") */}
                  {showDateDivider && msg.date && (
                    <div className="flex justify-center my-3">
                      <span className="px-3.5 py-1 rounded-full bg-slate-200/80 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[11px] font-heading font-semibold shadow-2xs backdrop-blur-xs">
                        {msg.date}
                      </span>
                    </div>
                  )}

                  {/* Message Bubble Row */}
                  <div className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                    <div
                      className={`max-w-[88%] sm:max-w-[75%] md:max-w-[70%] rounded-2xl px-3.5 py-2.5 text-xs sm:text-sm font-body leading-relaxed transition-all shadow-xs ${
                        isMe
                          ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-br-xs'
                          : 'bg-white dark:bg-[#1A1A24] text-slate-800 dark:text-slate-100 border border-slate-200/80 dark:border-slate-800 rounded-bl-xs'
                      }`}
                    >
                      {/* Attachment Preview (if any) */}
                      {msg.attachment && (
                        <div className="mb-2">
                          {msg.attachment.type === 'image' && msg.attachment.previewUrl ? (
                            <img
                              src={msg.attachment.previewUrl}
                              alt="Yuklangan rasm"
                              referrerPolicy="no-referrer"
                              loading="lazy"
                              decoding="async"
                              className="rounded-xl max-h-56 w-full object-cover border border-white/20 mb-1"
                            />
                          ) : (
                            <div
                              className={`flex items-center gap-2 p-2.5 rounded-xl border ${
                                isMe
                                  ? 'bg-white/15 border-white/20 text-white'
                                  : 'bg-slate-50 dark:bg-[#12121A] border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200'
                              }`}
                            >
                              <FileText className="w-5 h-5 shrink-0" />
                              <div className="min-w-0 flex-1">
                                <p className="font-heading font-bold text-xs truncate">
                                  {msg.attachment.name}
                                </p>
                                <span className="text-[10px] opacity-80 font-mono">
                                  {msg.attachment.size}
                                </span>
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Voice Note Bubble (Telegram style with play/pause and waveform) */}
                      {msg.voiceNote && (
                        <div className="flex items-center gap-3 py-1">
                          <button
                            type="button"
                            onClick={() => toggleVoicePlay(msg.id)}
                            className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 shadow-xs cursor-pointer transition-transform active:scale-90 ${
                              isMe
                                ? 'bg-white text-indigo-600 hover:bg-slate-100'
                                : 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:opacity-95'
                            }`}
                            aria-label={playingVoiceId === msg.id ? "To'xtatish" : "Eshitish"}
                          >
                            {playingVoiceId === msg.id ? (
                              <Pause className="w-4 h-4 fill-current" />
                            ) : (
                              <Play className="w-4 h-4 fill-current ml-0.5" />
                            )}
                          </button>

                          {/* Waveform Visualization */}
                          <div className="flex flex-col gap-1 min-w-[120px] sm:min-w-[170px]">
                            <div className="flex items-center gap-1 h-6">
                              {msg.voiceNote.waveform.map((val, barIdx) => {
                                const isPlayed =
                                  playingVoiceId === msg.id &&
                                  (barIdx / msg.voiceNote!.waveform.length) * 100 <= voiceProgress;

                                return (
                                  <span
                                    key={barIdx}
                                    style={{ height: `${Math.max(val * 2.2, 4)}px` }}
                                    className={`w-1 rounded-full transition-all duration-150 ${
                                      isMe
                                        ? isPlayed
                                          ? 'bg-white'
                                          : 'bg-white/40'
                                        : isPlayed
                                        ? 'bg-indigo-600'
                                        : 'bg-slate-300'
                                    }`}
                                  />
                                );
                              })}
                            </div>
                            <span
                              className={`text-[10.5px] font-mono ${
                                isMe ? 'text-indigo-100' : 'text-slate-400'
                              }`}
                            >
                              {playingVoiceId === msg.id
                                ? `00:${String(Math.floor((voiceProgress / 100) * 15)).padStart(2, '0')}`
                                : msg.voiceNote.duration}
                            </span>
                          </div>
                        </div>
                      )}

                      {/* Regular Text Message */}
                      {msg.text && (
                        <p className="whitespace-pre-wrap select-text break-words">
                          {msg.text}
                        </p>
                      )}

                      {/* Time & Read Receipts inside the bubble */}
                      <div
                        className={`flex items-center justify-end gap-1 mt-1 text-[10px] font-mono select-none ${
                          isMe ? 'text-indigo-200' : 'text-slate-400'
                        }`}
                      >
                        <span>{msg.time}</span>
                        {isMe && (
                          <span title={msg.isRead ? "O'qildi" : "Yetkazildi"}>
                            <CheckCheck
                              className={`w-3.5 h-3.5 ${
                                msg.isRead ? 'text-emerald-300' : 'text-indigo-200'
                              }`}
                            />
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </React.Fragment>
              );
            })}
            <div ref={messagesEndRef} />
          </div>

          {/* Attached File Preview Bar (before sending) */}
          {attachedFile && (
            <div className="px-4 py-2 bg-indigo-50 border-t border-indigo-100 flex items-center justify-between text-xs text-indigo-900 font-heading">
              <div className="flex items-center gap-2 truncate">
                <Paperclip className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                <span className="truncate font-semibold">{attachedFile.name}</span>
                <span className="text-indigo-500 font-mono text-[11px]">({attachedFile.size})</span>
              </div>
              <button
                type="button"
                onClick={() => setAttachedFile(null)}
                className="p-1 hover:text-red-600 cursor-pointer"
                title="Faylni olib tashlash"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Quick Emoji Picker Popover */}
          {showEmojiPicker && (
            <div className="p-2.5 bg-white dark:bg-[#1A1A24] border-t border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-2 overflow-x-auto no-scrollbar">
              <span className="text-xs text-slate-400 dark:text-slate-500 font-heading shrink-0 mr-1">Emojilar:</span>
              {popularEmojis.map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => setInputText((prev) => prev + emoji)}
                  className="text-lg p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-transform active:scale-125 cursor-pointer"
                >
                  {emoji}
                </button>
              ))}
            </div>
          )}

          {/* Bottom Chat Input Bar */}
          <div className="p-2.5 sm:p-3.5 bg-white dark:bg-[#1A1A24] border-t border-slate-200/80 dark:border-slate-800">
            <form onSubmit={handleSendMessage} className="flex items-end gap-2">
              {/* Emoji Button */}
              <button
                type="button"
                id="btn-chat-toggle-emoji"
                onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                className={`p-2.5 rounded-xl transition-colors cursor-pointer shrink-0 ${
                  showEmojiPicker
                    ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400'
                    : 'text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
                title="Emoji qoʻshish"
              >
                <Smile className="w-5 h-5" />
              </button>

              {/* Hidden File Input */}
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                onChange={handleFileUpload}
              />

              {/* Attachment Clip Button */}
              <button
                type="button"
                id="btn-chat-attach-file"
                onClick={() => fileInputRef.current?.click()}
                className="p-2.5 rounded-xl text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer shrink-0"
                title="Fayl biriktirish"
              >
                <Paperclip className="w-5 h-5" />
              </button>

              {/* Auto-expanding Input Field */}
              <div className="flex-1 bg-slate-50/80 dark:bg-[#12121A] rounded-2xl border border-slate-200/80 dark:border-slate-700 px-3.5 py-1.5 focus-within:bg-white dark:focus-within:bg-[#12121A] focus-within:border-indigo-500 transition-all flex items-center">
                <textarea
                  ref={textareaRef}
                  id="chat-textarea-input"
                  rows={1}
                  value={inputText}
                  onChange={handleTextChange}
                  onKeyDown={handleKeyDown}
                  placeholder="Xabar yozing..."
                  className="w-full bg-transparent border-0 resize-none text-xs sm:text-sm font-body text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-hidden py-1 max-h-28 overflow-y-auto leading-relaxed"
                />
              </div>

              {/* Mic / Send Toggle Button: Microphone by default, transforms to Send when text or file exists! */}
              {inputText.trim() || attachedFile ? (
                <button
                  type="submit"
                  id="btn-chat-send-message"
                  className="w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white flex items-center justify-center shrink-0 shadow-md shadow-indigo-600/25 active:scale-95 transition-all cursor-pointer"
                  title="Yuborish"
                  aria-label="Xabarni yuborish"
                >
                  <Send className="w-4 h-4 sm:w-5 sm:h-5 ml-0.5" />
                </button>
              ) : (
                <button
                  type="button"
                  id="btn-chat-send-voice"
                  onClick={handleSendVoiceNote}
                  className="w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-950/60 text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 flex items-center justify-center shrink-0 transition-all cursor-pointer active:scale-95"
                  title="Ovozli xabar yuborish"
                  aria-label="Ovozli xabar yuborish"
                >
                  <Mic className="w-4 h-4 sm:w-5 sm:h-5" />
                </button>
              )}
            </form>
          </div>
        </>
      )}
    </div>
  </div>
</div>
  );
};
