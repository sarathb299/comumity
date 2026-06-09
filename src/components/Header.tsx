/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { User, Notification, UserRole } from '../types';
import { Search, Flame, Bell, MessageSquare, Shield, LogOut, ChevronDown, Plus, Globe, Layers, Settings, Database, Server } from 'lucide-react';

interface HeaderProps {
  currentUser: User | null;
  onLogout: () => void;
  onSearchChange: (query: string) => void;
  onOpenAuth: () => void;
  onNavigate: (view: string, targetId?: string) => void;
  onCreateCommunityClick: () => void;
  activeView: string;
}

export default function Header({ 
  currentUser, 
  onLogout, 
  onSearchChange, 
  onOpenAuth, 
  onNavigate,
  onCreateCommunityClick,
  activeView 
}: HeaderProps) {
  const [search, setSearch] = useState('');
  const [notifs, setNotifs] = useState<Notification[]>([]);
  const [showNotifMenu, setShowNotifMenu] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [dbStatus, setDbStatus] = useState<{ isFallback: boolean; statusMessage: string } | null>(null);

  useEffect(() => {
    onSearchChange(search);
  }, [search]);

  // Refetch notifications & database status periodically
  useEffect(() => {
    if (currentUser) {
      const getNotifications = async () => {
        try {
          const res = await fetch(`/api/notifications/${currentUser.id}`);
          if (res.ok) {
            const data = await res.json();
            setNotifs(data);
          }
        } catch (err) {
          console.warn('Failed notifications poll', err);
        }
      };

      const getDbStatus = async () => {
        try {
          const res = await fetch(`/api/db-get-status`);
          if (res.ok) {
            const status = await res.json();
            setDbStatus(status);
          }
        } catch (e) {
          console.warn(e);
        }
      };

      void getNotifications();
      void getDbStatus();

      const id = setInterval(() => {
        void getNotifications();
      }, 7000);
      return () => clearInterval(id);
    }
  }, [currentUser]);

  const handleMarkNotifsRead = async () => {
    if (!currentUser) return;
    try {
      await fetch('/api/notifications/read', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: currentUser.id })
      });
      setNotifs(prev => prev.map(n => ({ ...n, is_read: true })));
    } catch (e) {
      console.warn(e);
    }
  };

  const unreadNotifs = notifs.filter(n => !n.is_read).length;

  return (
    <header id="communityhub-header" className="sticky top-0 z-40 w-full bg-slate-50 border-b-2 border-slate-900 py-1 select-none">
      <div className="w-full max-w-7xl mx-auto px-4 h-16 flex items-center justify-between gap-4">
        
        {/* Left Side: Logo */}
        <button 
          id="header-logo-btn"
          onClick={() => onNavigate('feed')} 
          className="flex items-center gap-2.5 font-display text-gray-950 font-black text-lg select-none transition-all duration-200 active:scale-95 group"
        >
          <div className="w-9 h-9 bg-orange-600 rounded-xl flex items-center justify-center text-white border-2 border-slate-900 shadow-[2px_2px_0px_0px_rgba(15,23,42,1)] group-hover:rotate-6 transition-all duration-305">
            <Layers className="w-5 h-5 text-white stroke-[2.5]" />
          </div>
          <span className="tracking-tighter text-slate-900 uppercase font-black">
            Community<span className="text-orange-650">Hub</span>
          </span>
        </button>

        {/* Global Search Bar */}
        <div className="flex-1 max-w-lg relative block">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-550">
            <Search className="w-4 h-4 stroke-[2.5]" />
          </div>
          <input
            id="global-search-input"
            type="text"
            placeholder="Search communities, topics, rules or posts..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-100 border-2 border-slate-900 rounded-xl text-xs font-black placeholder-slate-450 focus:outline-none focus:bg-white transition-all text-slate-950"
          />
        </div>

        {/* Right Navigation & Telemetry State */}
        <div className="flex items-center gap-3">
          
          {/* MySQL Indicators */}
          {currentUser && dbStatus && (
            <div className="hidden lg:flex items-center gap-2 px-3 py-1 bg-white border-2 border-slate-900 rounded-xl shadow-[1px_1px_0px_0px_rgba(15,23,42,1)]">
              <div className={`w-2 h-2 rounded-full ${dbStatus.isFallback ? 'bg-amber-400' : 'bg-emerald-500 animate-pulse'}`} />
              <span className="text-[10px] font-mono font-black text-slate-750 uppercase">
                {dbStatus.isFallback ? 'Local' : 'MySQL Live'}
              </span>
            </div>
          )}

          {/* Quick Actions for logged-in Members */}
          {currentUser ? (
            <>
              {/* Creator Button */}
              <button
                id="header-create-community-btn"
                onClick={onCreateCommunityClick}
                className="hidden md:flex items-center gap-1.5 px-4 py-2 bg-orange-600 text-white border-2 border-slate-900 rounded-xl font-display text-xs font-black tracking-wide transition-all duration-200 cursor-pointer active:scale-95 shadow-[2px_2px_0px_0px_rgba(15,23,42,1)] hover:translate-y-[-1px] hover:translate-x-[-1px]"
              >
                <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                <span>Create Community</span>
              </button>

              {/* Chat Direct Messenger Shortcut */}
              <button
                id="header-messenger-shortcut"
                onClick={() => onNavigate('messages')}
                className={`p-2 rounded-xl border-2 border-slate-900 hover:bg-slate-100 text-slate-900 relative transition-all duration-150 shadow-[2px_2px_0px_0px_rgba(15,23,42,1)] active:shadow-none hover:translate-y-[1px] ${activeView === 'messages' ? 'bg-indigo-50 text-indigo-650' : 'bg-white'}`}
                title="Direct Messages Chat"
              >
                <MessageSquare className="w-5 h-5 stroke-[2.5]" />
                <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-orange-655 rounded-full border border-white" />
              </button>

              {/* Notifications Center */}
              <div className="relative">
                <button
                  id="header-notifications-btn"
                  onClick={() => {
                    setShowNotifMenu(!showNotifMenu);
                    setShowUserMenu(false);
                    if (!showNotifMenu) {
                      void handleMarkNotifsRead();
                    }
                  }}
                  className={`p-2 rounded-xl border-2 border-slate-900 hover:bg-slate-100 text-slate-900 relative transition-all duration-150 shadow-[2px_2px_0px_0px_rgba(15,23,42,1)] active:shadow-none hover:translate-y-[1px] ${showNotifMenu ? 'bg-indigo-50 text-indigo-650' : 'bg-white'}`}
                >
                  <Bell className="w-5 h-5 stroke-[2.5]" />
                  {unreadNotifs > 0 && (
                    <span className="absolute -top-1 -right-1 min-w-[20px] h-[20px] px-1 bg-red-650 text-white rounded-full text-[9px] font-black flex items-center justify-center border-2 border-slate-900 shadow-sm">
                      {unreadNotifs}
                    </span>
                  )}
                </button>

                {/* Notifications Dropdown */}
                {showNotifMenu && (
                  <div className="absolute right-0 mt-3 w-80 bg-white border-2 border-slate-900 rounded-3xl shadow-[4px_4px_0px_0px_rgba(15,23,42,1)] z-50 overflow-hidden font-sans">
                    <div className="px-4 py-3 border-b-2 border-slate-900 bg-slate-100 flex justify-between items-center">
                      <span className="text-xs font-black uppercase tracking-tight text-slate-900 font-display">Notifications</span>
                      <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider">{notifs.length} Total</span>
                    </div>
                    <div className="max-h-72 overflow-y-auto custom-scrollbar">
                      {notifs.length === 0 ? (
                        <div className="p-8 text-center text-slate-400">
                          <p className="text-xs font-bold">No recent alerts</p>
                          <p className="text-[10px] mt-1 font-semibold">We will notify you on replies & actions!</p>
                        </div>
                      ) : (
                        notifs.map((n) => (
                          <div 
                             key={n.id} 
                             onClick={() => {
                               setShowNotifMenu(false);
                               onNavigate('feed');
                             }}
                             className={`p-3.5 border-b border-slate-100 hover:bg-slate-50 cursor-pointer transition-all flex gap-3 ${!n.is_read ? 'bg-indigo-50/30' : ''}`}
                          >
                            <div className="w-2.5 h-2.5 mt-1 rounded-full flex-shrink-0 bg-orange-650 border border-slate-900 animate-pulse" />
                            <div className="flex-1">
                              <p className="text-xs font-bold text-slate-800 leading-relaxed">{n.message}</p>
                              <span className="text-[9px] text-slate-400 font-mono block mt-1">{new Date(n.created_at).toLocaleDateString()}</span>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Admin Panel Link */}
              {(currentUser.role === UserRole.ADMIN || currentUser.role === UserRole.MODERATOR) && (
                <button
                  id="header-admin-link"
                  onClick={() => onNavigate('admin')}
                  className={`p-2 rounded-xl border-2 border-slate-900 hover:bg-slate-150 text-slate-900 flex items-center justify-center transition-all shadow-[2px_2px_0px_0px_rgba(15,23,42,1)] active:shadow-none hover:translate-y-[1px] ${activeView === 'admin' ? 'bg-indigo-600 text-white' : 'bg-white'}`}
                  title="Admin Moderation Panel"
                >
                  <Shield className="w-5 h-5 stroke-[2.5]" />
                </button>
              )}

              {/* User Dropdown Profile Menu */}
              <div className="relative">
                <button
                  id="header-user-menu-btn"
                  onClick={() => {
                    setShowUserMenu(!showUserMenu);
                    setShowNotifMenu(false);
                  }}
                  className="flex items-center gap-1.5 p-1 bg-white border-2 border-slate-900 rounded-xl shadow-[2px_2px_0px_0px_rgba(15,23,42,1)] hover:translate-y-[-1px] font-sans cursor-pointer transition-all"
                >
                  <img src={currentUser.avatar} alt={currentUser.username} className="w-7 h-7 rounded-lg object-cover border border-slate-350" />
                  <span className="text-xs font-black text-slate-900 hidden sm:block max-w-[80px] truncate pr-1">
                    u/{currentUser.username}
                  </span>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-900 stroke-[2.5]" />
                </button>

                {showUserMenu && (
                  <div className="absolute right-0 mt-3 w-52 bg-white border-2 border-slate-900 rounded-2xl shadow-[4px_4px_0px_0px_rgba(15,23,42,1)] z-50 overflow-hidden font-sans">
                    {/* Brief header info */}
                    <div className="px-4 py-3 bg-slate-100 border-b-2 border-slate-900">
                      <p className="text-xs font-black text-slate-950 truncate">u/{currentUser.username}</p>
                      <p className="text-[10px] text-slate-500 truncate mt-0.5 font-bold">{currentUser.email}</p>
                      <p className="text-[10px] font-black text-orange-600 font-mono mt-1 pr-2 uppercase">{currentUser.karma} Reputation</p>
                    </div>

                    <button
                      id="user-menu-profile"
                      onClick={() => {
                        setShowUserMenu(false);
                        onNavigate('profile', currentUser.id);
                      }}
                      className="w-full text-left px-4 py-2.5 text-xs text-slate-900 hover:bg-slate-50 font-bold transition-all border-b border-slate-100 flex items-center gap-2"
                    >
                      <Globe className="w-4 h-4 text-slate-650 stroke-[2.5]" />
                      <span>My Profile Cabinet</span>
                    </button>

                    <button
                      id="user-menu-saved"
                      onClick={() => {
                        setShowUserMenu(false);
                        onNavigate('feed'); // Displays feed with saved toggled
                      }}
                      className="w-full text-left px-4 py-2.5 text-xs text-slate-900 hover:bg-slate-50 font-bold transition-all border-b border-slate-100 flex items-center gap-2"
                    >
                      <Layers className="w-4 h-4 text-slate-655 stroke-[2.5]" />
                      <span>Saved Posts</span>
                    </button>

                    <button
                      id="user-logout"
                      onClick={() => {
                        setShowUserMenu(false);
                        onLogout();
                      }}
                      className="w-full text-left px-4 py-2.5 text-xs text-red-600 hover:bg-red-50 font-black transition-all flex items-center gap-2"
                    >
                      <LogOut className="w-4 h-4 text-red-500 stroke-[2.5]" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                )}
              </div>
            </>
          ) : (
            <button
              id="header-sign-in-btn"
              onClick={onOpenAuth}
              className="bento-button-primary px-4 py-2 text-xs tracking-wider"
            >
              Sign In
            </button>
          )}

        </div>

      </div>
    </header>
  );
}
