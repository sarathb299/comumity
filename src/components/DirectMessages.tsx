/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useRef, FormEvent } from 'react';
import { User, Message } from '../types';
import { Send, User as UserIcon, MessageSquare, Check, RefreshCw } from 'lucide-react';

interface DirectMessagesProps {
  currentUser: User;
  users: User[];
}

export default function DirectMessages({ currentUser, users }: DirectMessagesProps) {
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [typedMessage, setTypedMessage] = useState('');
  const [chatsLoading, setChatsLoading] = useState(false);
  const threadEndRef = useRef<HTMLDivElement>(null);

  // Filter out self
  const chatPartners = users.filter(u => u.id !== currentUser.id);

  const fetchChatThread = async (userId: string) => {
    setChatsLoading(true);
    try {
      const res = await fetch(`/api/chat?user1=${currentUser.id}&user2=${userId}`);
      if (res.ok) {
        setMessages(await res.json());
      }
    } catch (e) {
      console.warn('Failed message poll', e);
    } finally {
      setChatsLoading(false);
    }
  };

  useEffect(() => {
    if (selectedUser) {
      void fetchChatThread(selectedUser.id);

      // Auto poll chat history every 4 seconds for a real-time conversational vibe!
      const id = setInterval(() => {
        void fetchChatThread(selectedUser.id);
      }, 4000);
      return () => clearInterval(id);
    } else {
      setMessages([]);
    }
  }, [selectedUser]);

  // Handle auto scroll-to-bottom on new messages
  useEffect(() => {
    threadEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (e: FormEvent) => {
    e.preventDefault();
    if (!selectedUser || !typedMessage.trim()) return;

    const textToSend = typedMessage.trim();
    setTypedMessage('');

    // Pre-inject client-focused transient state
    const transientMessage: Message = {
      id: Math.random().toString(36).substring(2, 11),
      sender_id: currentUser.id,
      receiver_id: selectedUser.id,
      sender_username: currentUser.username,
      receiver_username: selectedUser.username,
      message: textToSend,
      created_at: new Date().toISOString()
    };
    setMessages(prev => [...prev, transientMessage]);

    try {
      const res = await fetch('/api/chat/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          senderId: currentUser.id,
          receiverId: selectedUser.id,
          message: textToSend
        })
      });

      if (res.ok) {
        // Refresh history to map final db metadata
        const fresh = await res.json();
        setMessages(prev => prev.map(m => m.id === transientMessage.id ? { ...m, ...fresh.message } : m));
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div id="direct-messenger-container" className="flex-1 bg-white border-2 border-slate-900 rounded-3xl overflow-hidden flex h-[580px] font-sans text-xs shadow-[3px_3px_0px_0px_rgba(15,23,42,1)]">
      
      {/* Sidebar: Chat partners */}
      <div className="w-1/3 border-r-2 border-slate-900 flex flex-col">
        <div className="p-4 border-b-2 border-slate-900 bg-slate-50 flex items-center justify-between">
          <span className="font-display font-black text-slate-950 uppercase tracking-wider text-[11px]">Active Chats</span>
          <MessageSquare className="w-4 h-4 text-slate-900 stroke-[2.5]" />
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar p-2.5 space-y-2">
          {chatPartners.map((p) => {
            const isSelected = selectedUser?.id === p.id;
            return (
              <button
                id={`chat-partner-btn-${p.username}`}
                key={p.id}
                onClick={() => setSelectedUser(p)}
                className={`w-full text-left p-3 rounded-2xl flex items-center gap-3 transition-all cursor-pointer border-2 ${
                  isSelected 
                  ? 'bg-orange-50 border-slate-900 shadow-[2px_2px_0px_0px_rgba(15,23,42,1)] font-bold text-slate-950' 
                  : 'bg-white border-transparent hover:border-slate-300 text-slate-700'
                }`}
              >
                <img src={p.avatar} alt={p.username} className="w-8.5 h-8.5 rounded-full object-cover border-2 border-slate-900" />
                <div className="min-w-0">
                  <p className="font-black truncate text-[11px] leading-tight">u/{p.username}</p>
                  <p className="text-[9px] text-slate-400 capitalize font-bold">{p.role.toLowerCase()}</p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main chat window container */}
      <div className="flex-1 flex flex-col bg-slate-50">
        {selectedUser ? (
          <>
            {/* Header info */}
            <div className="p-4 bg-white border-b-2 border-slate-900 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <img src={selectedUser.avatar} alt={selectedUser.username} className="w-8 h-8 rounded-full object-cover border-2 border-slate-900" />
                <div>
                  <p className="font-black text-[11px] text-slate-950">u/{selectedUser.username}</p>
                  <p className="text-[10px] text-orange-600 font-black font-mono uppercase tracking-wide">{selectedUser.karma} Reputation</p>
                </div>
              </div>

              {chatsLoading && (
                <RefreshCw className="w-3.5 h-3.5 text-slate-900 animate-spin" />
              )}
            </div>

            {/* Conversation list */}
            <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-4">
              {messages.length === 0 ? (
                <div className="h-full flex flex-col justify-center items-center text-center text-slate-400 px-6">
                  <MessageSquare className="w-8 h-8 text-slate-900 mb-2 stroke-[2.5]" />
                  <p className="font-black text-xs text-slate-700 uppercase tracking-widest">No Message History</p>
                  <p className="text-[10px] mt-1 text-slate-450 font-bold max-w-[240px]">Send a warm wave or spark discussion about collaborative projects!</p>
                </div>
              ) : (
                messages.map((m) => {
                  const isSentByMe = m.sender_id === currentUser.id;
                  
                  return (
                    <div 
                      key={m.id} 
                      className={`flex gap-3 max-w-[85%] ${isSentByMe ? 'ml-auto flex-row-reverse' : ''}`}
                    >
                      <img 
                        src={isSentByMe ? currentUser.avatar : selectedUser.avatar} 
                        alt="Avatar" 
                        className="w-7 h-7 rounded-sm object-cover border-2 border-slate-900 self-end flex-shrink-0 shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]" 
                      />

                      <div className="space-y-1 min-w-0">
                        <div 
                          className={`p-3 rounded-2xl leading-relaxed text-xs border-2 border-slate-900 ${
                            isSentByMe 
                            ? 'bg-orange-600 text-white rounded-br-none shadow-[2.5px_2.5px_0px_0px_rgba(15,23,42,1)] font-bold' 
                            : 'bg-white text-slate-900 rounded-bl-none shadow-[2.5px_2.5px_0px_0px_rgba(15,23,42,1)] font-bold'
                          }`}
                        >
                          {m.message}
                        </div>
                        <span className={`text-[8px] text-slate-405 font-mono font-black flex items-center gap-1 mt-1 ${isSentByMe ? 'justify-end' : ''}`}>
                          {new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          {isSentByMe && <Check className="w-3 h-3 text-emerald-600 stroke-[3]" />}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={threadEndRef} />
            </div>

            {/* Input direct reply dispatch box */}
            <form onSubmit={handleSendMessage} className="p-3 bg-white border-t-2 border-slate-900 flex gap-2.5 items-center">
              <input
                id="message-text-input"
                type="text"
                required
                placeholder={`Type message to u/${selectedUser.username}...`}
                value={typedMessage}
                onChange={(e) => setTypedMessage(e.target.value)}
                className="block w-full px-4 py-2 bg-slate-50 border-2 border-slate-900 rounded-xl font-sans text-xs focus:outline-none focus:bg-white text-slate-950 font-bold"
              />
              <button
                id="chat-send-submit"
                type="submit"
                className="p-2 bg-orange-600 hover:bg-orange-700 border-2 border-slate-900 text-white rounded-xl flex items-center justify-center transition-all cursor-pointer shadow-[2px_2px_0px_0px_rgba(15,23,42,1)] active:scale-95 flex-shrink-0"
              >
                <Send className="w-4 h-4 stroke-[2.5]" />
              </button>
            </form>
          </>
        ) : (
          <div className="h-full flex flex-col justify-center items-center text-center text-slate-450 p-8">
            <MessageSquare className="w-12 h-12 text-slate-500 mb-3 animate-pulse stroke-[2.5]" />
            <p className="font-extrabold text-sm text-slate-905 uppercase tracking-widest font-display">Explore Active Members Chat</p>
            <p className="text-[10px] text-slate-400 mt-1.5 font-bold max-w-[280px] leading-relaxed">Select any community partner on the left panel to initiate an encrypted private conversation thread!</p>
          </div>
        )}
      </div>

    </div>
  );
}
