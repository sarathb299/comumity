/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { Community, User } from '../types';
import { Globe, ShieldAlert, Plus, Users, ArrowRight, Heart } from 'lucide-react';
import SkeletonLoader from './SkeletonLoader';

interface CommunitySidebarProps {
  communities: Community[];
  joinedIds: string[];
  currentUser: User | null;
  onSelectCommunity: (slug: string) => void;
  onJoinLeave: (communityId: string, join: boolean) => void;
  onCreateCommunityClick: () => void;
  isLoading?: boolean;
}

export default function CommunitySidebar({
  communities,
  joinedIds,
  currentUser,
  onSelectCommunity,
  onJoinLeave,
  onCreateCommunityClick,
  isLoading = false
}: CommunitySidebarProps) {
  return (
    <aside id="community-sidebar" className="w-full lg:w-80 flex-shrink-0 flex flex-col gap-6">
      
      {/* Popular Sub-Communities Module */}
      <div className="bento-card p-6 bg-white">
        <div className="flex items-center justify-between mb-4 pb-2 border-b-2 border-slate-900">
          <h2 className="text-sm font-display font-black text-slate-900 tracking-tighter uppercase">
            Popular Communities
          </h2>
          <Globe className="w-4 h-4 text-slate-900 stroke-[2.5]" />
        </div>

        <div className="flex flex-col gap-3.5">
          {isLoading ? (
            <SkeletonLoader variant="community-sidebar-list" idPrefix="sidebar-community-sk" count={4} />
          ) : (
            communities.filter(c => c.slug !== 'mods-only' || (currentUser?.role === 'ADMIN' || currentUser?.role === 'MODERATOR')).map((com) => {
              const isJoined = joinedIds.includes(com.id);
              const memberCount = com.membersCount || 1;
              
              // Map dynamic layout color tags
              const themeMap: Record<string, string> = {
                cyan: 'bg-cyan-100 text-cyan-700',
                emerald: 'bg-emerald-100 text-emerald-700',
                purple: 'bg-purple-100 text-purple-700',
                amber: 'bg-amber-100 text-amber-700',
                indigo: 'bg-indigo-100 text-indigo-700',
              };
              const cClass = themeMap[com.themeColor] || 'bg-slate-100 text-slate-705';

              return (
                <div 
                  id={`sidebar-community-${com.slug}`}
                  key={com.id} 
                  className="flex items-center justify-between gap-3 group"
                >
                  <button
                    id={`sidebar-com-select-${com.slug}`}
                    onClick={() => onSelectCommunity(com.slug)}
                    className="flex items-center gap-3 text-left flex-1 min-w-0"
                  >
                    <img src={com.logo} alt={com.name} className="w-9 h-9 rounded-xl object-cover border-2 border-slate-900 shadow-[1px_1px_0px_0px_rgba(15,23,42,1)] group-hover:scale-105 transition-all" />
                    <div className="min-w-0">
                      <p className="text-xs font-black text-slate-900 truncate group-hover:text-orange-600 transition-all">
                        h/{com.slug}
                      </p>
                      <p className="text-[10px] text-slate-500 font-bold">
                        {memberCount} {memberCount === 1 ? 'member' : 'members'}
                      </p>
                    </div>
                  </button>

                  {currentUser && (
                    <button
                      id={`sidebar-com-join-btn-${com.id}`}
                      onClick={() => onJoinLeave(com.id, !isJoined)}
                      className={`px-3 py-1 text-[10px] uppercase font-black rounded-lg border-2 border-slate-900 shadow-[1px_1px_0px_0px_rgba(15,23,42,1)] transition-all active:scale-95 cursor-pointer ${
                        isJoined 
                        ? 'bg-slate-200 hover:bg-slate-300 text-slate-700' 
                        : 'bg-orange-600 hover:bg-orange-700 text-white'
                      }`}
                    >
                      {isJoined ? 'Joined' : 'Join'}
                    </button>
                  )}
                </div>
              );
            })
          )}
        </div>

        {currentUser && (
          <button
            id="sidebar-create-community-trigger"
            onClick={onCreateCommunityClick}
            className="w-full mt-5 py-2.5 bento-button text-[11px] font-black uppercase text-slate-900 flex items-center justify-center gap-1.5 transition-all bg-white"
          >
            <Plus className="w-3.5 h-3.5 text-slate-900 stroke-[2.5]" />
            <span>Create New Community</span>
          </button>
        )}
      </div>

      {/* CommunityHub Guidelines & Platform stats */}
      <div className="bento-card-dark p-6 text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/10 rounded-full blur-2xl pointer-events-none" />
        
        <h3 className="text-xs font-black text-orange-400 uppercase tracking-widest mb-3 font-display border-b border-slate-800 pb-1">
          Community Rules
        </h3>
        <p className="text-xs text-slate-300 font-bold leading-relaxed mb-4">
          CommunityHub is designed as a pristine, safe environment for builders, developers, and founders. Following simple tenets creates a better space for everyone:
        </p>

        <ul className="text-[10px] space-y-2.5 text-slate-400 font-bold">
          <li className="flex gap-2">
            <span className="text-orange-500 font-black font-mono">1.</span>
            <span>Be respectful and open to constructive feedback.</span>
          </li>
          <li className="flex gap-2">
            <span className="text-orange-500 font-black font-mono">2.</span>
            <span>Refrain from hostile, offensive, spam, or toxic comments.</span>
          </li>
          <li className="flex gap-2">
            <span className="text-orange-500 font-black font-mono">3.</span>
            <span>State original sources clearly when using shared frameworks.</span>
          </li>
        </ul>

        <div className="mt-5 pt-4 border-t border-slate-800 flex items-center justify-between text-[9px] text-slate-500 font-mono font-bold uppercase">
          <span>Version 1.10.0</span>
          <div className="flex items-center gap-1">
            <span>Made with</span>
            <Heart className="w-3 h-3 text-red-500 fill-red-500" />
            <span>for Hub</span>
          </div>
        </div>
      </div>

    </aside>
  );
}
