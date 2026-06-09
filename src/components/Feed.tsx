/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { Post, PostType, User, Community, UserRole } from '../types';
import { 
  ArrowBigUp, ArrowBigDown, MessageSquare, Pin, ExternalLink, Trash2, 
  Share2, Award, Bookmark, ShieldAlert, Check, HelpCircle, Eye, RefreshCw, BarChart2, Video 
} from 'lucide-react';
import { motion } from 'motion/react';

interface FeedProps {
  posts: Post[];
  currentUser: User | null;
  onPostSelect: (postId: string) => void;
  onVote: (postId: string, voteType: number) => void;
  onDelete: (postId: string) => void;
  onPin: (postId: string, pin: boolean) => void;
  onCommunitySelect: (slug: string) => void;
  onVotePoll: (postId: string, option: string) => void;
  savedState: Record<string, boolean>;
  onToggleSave: (postId: string) => void;
  sortBy: string;
  setSortBy: (sort: string) => void;
}

export default function Feed({
  posts,
  currentUser,
  onPostSelect,
  onVote,
  onDelete,
  onPin,
  onCommunitySelect,
  onVotePoll,
  savedState,
  onToggleSave,
  sortBy,
  setSortBy
}: FeedProps) {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleShare = (postId: string) => {
    // Write link sharing simulation
    const fakeUrl = `${window.location.origin}/post/${postId}`;
    void navigator.clipboard.writeText(fakeUrl);
    setCopiedId(postId);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div id="hub-feed-container" className="flex-1 flex flex-col gap-6">
      
      {/* Filtering Feed controller bar */}
      <div className="bento-card p-3 flex items-center justify-between bg-white text-slate-900">
        <div className="flex items-center gap-2 overflow-x-auto">
          {['Hot', 'New', 'Top'].map((filter) => (
            <button
              id={`feed-sort-btn-${filter}`}
              key={filter}
              onClick={() => setSortBy(filter)}
              className={`px-4 py-1.5 rounded-xl text-xs font-black uppercase tracking-tight border-2 border-slate-900 transition-all cursor-pointer ${
                sortBy === filter 
                ? 'bg-orange-600 text-white shadow-[2px_2px_0px_0px_rgba(15,23,42,1)]' 
                : 'bg-white text-slate-700 hover:bg-slate-100'
              }`}
            >
              {filter}
            </button>
          ))}
        </div>

        <span className="text-[10px] font-mono font-black text-slate-500 uppercase tracking-widest hidden sm:block">
          {posts.length} Posts Available
        </span>
      </div>

      {posts.length === 0 ? (
        <div className="bento-card p-12 text-center text-slate-500 bg-white">
          <HelpCircle className="w-10 h-10 text-slate-300 mx-auto mb-3 stroke-[2.5]" />
          <p className="text-xs font-black text-slate-900 uppercase">No postings found</p>
          <p className="text-[11px] text-slate-500 mt-1">Be the first to share a post in this community!</p>
        </div>
      ) : (
        <div className="flex flex-col gap-6 font-sans">
          {posts.map((post) => {
            const isSaved = savedState[post.id] || false;
            
            // Calculate poll progress metadata (voters percentage)
            const totalPollVotes = post.pollVotes 
              ? Object.values(post.pollVotes).reduce((sum, v) => sum + v, 0)
              : 0;

            const isUserVotedPoll = post.votedPollOptions && currentUser 
              ? post.votedPollOptions.includes(currentUser.id) 
              : false;

            return (
              <motion.article
                id={`article-post-${post.id}`}
                key={post.id}
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
                className={`bento-card bg-white overflow-hidden transition-all text-slate-900 ${
                  post.isPinned ? 'border-orange-500 border-2' : ''
                }`}
              >
                {/* Upper Post Header */}
                <div className="p-5 pb-3">
                  <div className="flex items-center justify-between gap-3 flex-wrap">
                    <div className="flex items-center gap-2">
                      {/* Community Badge Slug */}
                      <button
                        id={`post-community-btn-${post.id}`}
                        onClick={() => post.communitySlug && onCommunitySelect(post.communitySlug)}
                        className="text-[10px] font-black uppercase tracking-widest bg-slate-100 px-2.5 py-1 rounded-lg border-2 border-slate-900 shadow-[1px_1px_0px_0px_rgba(15,23,42,1)] hover:bg-orange-100 transition-all text-slate-900"
                      >
                        h/{post.communitySlug}
                      </button>
                      <span className="text-slate-300 text-xs">•</span>
                      
                      {/* Author badge */}
                      <span className="text-[10px] text-slate-500 font-bold">
                        u/{post.username}
                      </span>
                      <span className="text-[10px] font-mono text-slate-400 font-bold">
                        {new Date(post.created_at).toLocaleDateString()}
                      </span>
                    </div>

                    {post.isPinned && (
                      <div className="flex items-center gap-1 px-3 py-1 bg-emerald-100 border-2 border-emerald-900 rounded-xl text-emerald-950 text-[9px] font-black uppercase tracking-tight">
                        <Pin className="w-3 h-3 text-emerald-900 stroke-[2.5]" />
                        <span>PINNED</span>
                      </div>
                    )}
                  </div>

                  {/* Core content block */}
                  <div className="mt-4 cursor-pointer" onClick={() => onPostSelect(post.id)}>
                    <h3 className="text-sm font-sans font-black text-slate-950 hover:text-orange-600 transition-all font-display leading-tight mb-2 uppercase tracking-tight">
                      {post.title}
                    </h3>
                    
                    {post.post_type === PostType.TEXT && (
                      <p className="text-xs text-slate-700 font-bold leading-relaxed line-clamp-3">
                        {post.content}
                      </p>
                    )}
                  </div>

                  {/* Rich Post Previews depending on types */}
                  {post.post_type === PostType.IMAGE && post.images && post.images.length > 0 && (
                    <div className="my-3 rounded-2xl overflow-hidden border-2 border-slate-900 max-h-[380px] bg-slate-50 flex justify-center items-center cursor-pointer shadow-[2px_2px_0px_0px_rgba(15,23,42,1)]" onClick={() => onPostSelect(post.id)}>
                      <img src={post.images[0]} alt={post.title} className="max-h-full object-contain" referrerPolicy="no-referrer" />
                    </div>
                  )}

                  {post.post_type === PostType.LINK && post.linkUrl && (
                    <div className="my-4 p-3 bg-slate-100 border-2 border-slate-900 rounded-xl hover:bg-slate-200 transition-all duration-200 shadow-[1px_1px_0px_0px_rgba(15,23,42,1)]">
                      <a 
                        id={`post-external-link-${post.id}`}
                        href={post.linkUrl} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="flex items-center justify-between gap-3 text-xs text-indigo-750 font-black truncate hover:underline"
                      >
                        <span className="truncate">{post.linkUrl}</span>
                        <ExternalLink className="w-4 h-4 flex-shrink-0 stroke-[2.5]" />
                      </a>
                    </div>
                  )}

                  {post.post_type === PostType.POLL && post.pollOptions && post.pollVotes && (
                    <div className="my-4 bg-slate-50 border-2 border-slate-900 rounded-2xl p-4 font-sans text-xs flex flex-col gap-3">
                      <div className="flex items-center justify-between text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1 font-mono">
                        <span>Interactive Voting Poll</span>
                        <span>{totalPollVotes} total votes</span>
                      </div>
                      
                      <div className="flex flex-col gap-2.5">
                        {post.pollOptions.map((opt) => {
                          const optionVoteCount = post.pollVotes?.[opt] || 0;
                          const percent = totalPollVotes > 0 ? Math.round((optionVoteCount / totalPollVotes) * 100) : 0;
                          
                          return (
                            <div key={opt} className="relative overflow-hidden rounded-xl border-2 border-slate-900 bg-white">
                              {/* Background vote progress filler */}
                              <div 
                                className="absolute top-0 left-0 bottom-0 bg-orange-600/10 transition-all duration-500" 
                                style={{ width: `${percent}%` }}
                              />
                              
                              <button
                                id={`post-poll-opt-${post.id}-${opt.replace(/\s+/g, '-')}`}
                                type="button"
                                disabled={!currentUser || isUserVotedPoll}
                                onClick={() => onVotePoll(post.id, opt)}
                                className="relative w-full px-4 py-2.5 text-left flex items-center justify-between gap-3 text-xs font-black text-slate-900 hover:bg-slate-50/50 disabled:cursor-default"
                              >
                                <span>{opt}</span>
                                <div className="flex items-center gap-2">
                                  {isUserVotedPoll && (
                                    <span className="text-[10px] font-black text-slate-500 font-mono">
                                      {optionVoteCount} votes ({percent}%)
                                    </span>
                                  )}
                                  {currentUser && !isUserVotedPoll && (
                                    <span className="text-[10px] text-orange-600 font-black uppercase">Vote</span>
                                  )}
                                </div>
                              </button>
                            </div>
                          );
                        })}
                      </div>

                      {!currentUser && (
                        <p className="text-[10px] text-slate-500 italic font-bold">Please sign in to vote on this live poll.</p>
                      )}
                    </div>
                  )}

                  {/* Post Stats/Views indicator */}
                  <div className="mt-3 flex items-center gap-1.5 text-[9px] font-mono text-slate-400 font-black uppercase select-none">
                    <Eye className="w-3.5 h-3.5 text-slate-400 stroke-[2.5]" />
                    <span>{post.views} views</span>
                  </div>
                </div>

                {/* Operations Footer Box */}
                <div className="border-t-2 border-slate-900 bg-slate-50 px-5 py-2.5 flex items-center justify-between gap-4">
                  {/* Left segment: voting scores */}
                  <div className="flex items-center gap-1.5 bg-white border-2 border-slate-900 rounded-xl p-0.5 shadow-[2px_2px_0px_0px_rgba(15,23,42,1)]">
                    <button
                      id={`vote-up-${post.id}`}
                      onClick={() => onVote(post.id, 1)}
                      className={`p-1 rounded-lg transition-all active:scale-90 ${
                        post.userVote === 1 
                        ? 'text-white bg-orange-600' 
                        : 'text-slate-600 hover:bg-slate-100'
                      }`}
                      title="Upvote Post"
                    >
                      <ArrowBigUp className="w-5 h-5 fill-current" />
                    </button>
                    <span className="text-xs font-black text-slate-900 font-mono px-1 min-w-[14px] text-center">
                      {post.score}
                    </span>
                    <button
                      id={`vote-down-${post.id}`}
                      onClick={() => onVote(post.id, -1)}
                      className={`p-1 rounded-lg transition-all active:scale-90 ${
                        post.userVote === -1 
                        ? 'text-white bg-indigo-600' 
                        : 'text-slate-600 hover:bg-slate-100'
                      }`}
                      title="Downvote Post"
                    >
                      <ArrowBigDown className="w-5 h-5 fill-current" />
                    </button>
                  </div>

                  {/* Mid Segment: comments & links */}
                  <div className="flex items-center gap-2">
                    <button
                      id={`comment-btn-${post.id}`}
                      onClick={() => onPostSelect(post.id)}
                      className="px-3 py-1.5 rounded-xl bg-white border-2 border-slate-900 hover:bg-slate-100 text-slate-900 shadow-[2px_2px_0px_0px_rgba(15,23,42,1)] font-sans text-xs font-black flex items-center gap-1.5 transition-all text-left"
                    >
                      <MessageSquare className="w-4 h-4 text-slate-900 stroke-[2.5]" />
                      <span>{post.commentsCount || 0}</span>
                    </button>

                    <button
                      id={`share-btn-${post.id}`}
                      onClick={() => handleShare(post.id)}
                      className="px-3 py-1.5 rounded-xl bg-white border-2 border-slate-900 hover:bg-slate-100 text-slate-900 shadow-[2px_2px_0px_0px_rgba(15,23,42,1)] font-sans text-[11px] font-black flex items-center gap-1.5 transition-all"
                    >
                      <Share2 className="w-4 h-4 text-slate-900 stroke-[2.5]" />
                      <span>{copiedId === post.id ? 'Copied!' : 'Share'}</span>
                    </button>

                    <button
                      id={`save-btn-${post.id}`}
                      onClick={() => onToggleSave(post.id)}
                      className={`px-3 py-1.5 rounded-xl bg-white border-2 border-slate-900 hover:bg-slate-100 shadow-[2px_2px_0px_0px_rgba(15,23,42,1)] font-sans text-[11px] font-black flex items-center gap-1.5 transition-all ${
                        isSaved ? 'text-orange-600 border-orange-600 shadow-[2px_2px_0px_0px_rgba(234,88,12,1)]' : 'text-slate-900'
                      }`}
                    >
                      <Bookmark className={`w-4 h-4 ${isSaved ? 'fill-current text-orange-605' : 'text-slate-900 stroke-[2.5]'}`} />
                      <span>{isSaved ? 'Saved' : 'Save'}</span>
                    </button>
                  </div>

                  {/* Right actions: Moderators pin & delete */}
                  <div className="flex items-center gap-1.5">
                    {currentUser && (currentUser.role === UserRole.ADMIN || currentUser.role === UserRole.MODERATOR) && (
                      <>
                        <button
                          id={`pin-action-btn-${post.id}`}
                          onClick={() => onPin(post.id, !post.isPinned)}
                          className={`p-1.5 rounded-xl border-2 border-slate-900 hover:bg-slate-100 transition-all ${post.isPinned ? 'text-emerald-700 bg-emerald-50' : 'text-slate-900 bg-white'}`}
                          title={post.isPinned ? 'Unpin Post' : 'Pin Post to Top'}
                        >
                          <Pin className="w-4 h-4 stroke-[2.5]" />
                        </button>
                      </>
                    )}
                    {currentUser && (currentUser.role === UserRole.ADMIN || currentUser.role === UserRole.MODERATOR || currentUser.id === post.user_id) && (
                      <button
                        id={`delete-action-btn-${post.id}`}
                        onClick={() => onDelete(post.id)}
                        className="p-1.5 rounded-xl border-2 border-red-900 bg-white text-red-600 hover:text-red-700 hover:bg-red-50 transition-all shadow-[2px_2px_0px_0px_rgba(185,28,28,1)]"
                        title="Delete Post"
                      >
                        <Trash2 className="w-4 h-4 stroke-[2.5]" />
                      </button>
                    )}
                  </div>
                </div>

              </motion.article>
            );
          })}
        </div>
      )}
    </div>
  );
}
