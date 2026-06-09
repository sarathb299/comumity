/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, FormEvent } from 'react';
import { 
  User, Community, Post, Comment, PostType, 
  UserRole, CommunityPrivacy, PlatformAnalytics 
} from './types';
import Header from './components/Header';
import CommunitySidebar from './components/CommunitySidebar';
import Feed from './components/Feed';
import CommunityDetail from './components/CommunityDetail';
import PostView from './components/PostView';
import AdminPanel from './components/AdminPanel';
import DirectMessages from './components/DirectMessages';
import AuthModal from './components/AuthModal';
import { 
  Globe, Info, Heart, Settings, Layout, Plus, CheckCircle2, 
  Lock, Laptop, Sparkles, Smile, ShieldAlert, Award, FileText, LayoutGrid, X 
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [activeView, setActiveView] = useState('feed'); // 'feed', 'post-view', 'admin', 'messages', 'profile'
  const [selectedPostId, setSelectedPostId] = useState<string | null>(null);
  const [selectedCommunitySlug, setSelectedCommunitySlug] = useState<string | null>(null);
  const [selectedProfileId, setSelectedProfileId] = useState<string | null>(null);

  // Core Data States
  const [posts, setPosts] = useState<Post[]>([]);
  const [communities, setCommunities] = useState<Community[]>([]);
  const [usersList, setUsersList] = useState<User[]>([]);
  const [joinedCommunityIds, setJoinedCommunityIds] = useState<string[]>([]);
  const [savedPostsState, setSavedPostsState] = useState<Record<string, boolean>>({});

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('Hot');
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showCreateCommunityModal, setShowCreateCommunityModal] = useState(false);

  // New community form variables
  const [newComName, setNewComName] = useState('');
  const [newComDesc, setNewComDesc] = useState('');
  const [newComPrivacy, setNewComPrivacy] = useState<CommunityPrivacy>(CommunityPrivacy.PUBLIC);
  const [newComTheme, setNewComTheme] = useState('indigo');
  const [newComLogo, setNewComLogo] = useState('');
  const [newComBanner, setNewComBanner] = useState('');
  const [communityRules, setCommunityRules] = useState<string[]>(['No offensive talk', 'Provide useful context']);
  const [createComError, setCreateComError] = useState('');
  const [threadComments, setThreadComments] = useState<Comment[]>([]);
  const [isFeedLoading, setIsFeedLoading] = useState(true);

  // Fetch posts and communities
  const loadPostsAndCommunities = async () => {
    setIsFeedLoading(true);
    try {
      const pRes = await fetch(`/api/posts${currentUser ? `?userId=${currentUser.id}` : ''}`);
      const cRes = await fetch('/api/communities');
      const uRes = await fetch('/api/admin/users');

      if (pRes.ok) setPosts(await pRes.json());
      if (cRes.ok) setCommunities(await cRes.json());
      if (uRes.ok) setUsersList(await uRes.json());
    } catch (err) {
      console.warn('Backend connection issue:', err);
    } finally {
      setTimeout(() => {
        setIsFeedLoading(false);
      }, 600);
    }
  };

  useEffect(() => {
    void loadPostsAndCommunities();
  }, [currentUser]);

  // Load user data persistence
  useEffect(() => {
    const rawUser = localStorage.getItem('hub_user_session');
    if (rawUser) {
      try {
        const u = JSON.parse(rawUser);
        setCurrentUser(u);
      } catch (e) {
        localStorage.removeItem('hub_user_session');
      }
    }

    const rawSaved = localStorage.getItem('hub_saved_posts');
    if (rawSaved) {
      try {
        setSavedPostsState(JSON.parse(rawSaved));
      } catch (e) {
        console.warn(e);
      }
    }
  }, []);

  // Fetch joined communities upon login
  useEffect(() => {
    if (currentUser) {
      const loadJoined = async () => {
        try {
          const res = await fetch(`/api/communities/joined/${currentUser.id}`);
          if (res.ok) {
            const data: Community[] = await res.json();
            setJoinedCommunityIds(data.map(c => c.id));
          }
        } catch (e) {
          console.warn(e);
        }
      };
      void loadJoined();
    } else {
      setJoinedCommunityIds([]);
    }
  }, [currentUser]);

  // Fetch comments for current selected post thread
  useEffect(() => {
    if (selectedPostId) {
      const collectComments = async () => {
        try {
          const res = await fetch(`/api/posts/${selectedPostId}/comments${currentUser ? `?userId=${currentUser.id}` : ''}`);
          if (res.ok) {
            const data = await res.json();
            setThreadComments(data);
          }
        } catch (e) {
          console.warn(e);
        }
      };
      void collectComments();
    } else {
      setThreadComments([]);
    }
  }, [selectedPostId, posts, currentUser]);

  const handleAuthSuccess = (user: User) => {
    setCurrentUser(user);
    localStorage.setItem('hub_user_session', JSON.stringify(user));
    setShowAuthModal(false);
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('hub_user_session');
    setActiveView('feed');
  };

  const handleToggleSave = (postId: string) => {
    const fresh = { ...savedPostsState, [postId]: !savedPostsState[postId] };
    setSavedPostsState(fresh);
    localStorage.setItem('hub_saved_posts', JSON.stringify(fresh));
  };

  // Upvote/Downvote actions
  const handleVotePost = async (postId: string, voteType: number) => {
    if (!currentUser) {
      setShowAuthModal(true);
      return;
    }

    // Optimistic UI updates
    setPosts(prev => prev.map(p => {
      if (p.id === postId) {
        const currentVote = p.userVote || 0;
        let diff = 0;
        let nextVote = voteType;

        if (currentVote === voteType) {
          // untoggle
          diff = -voteType;
          nextVote = 0;
        } else if (currentVote !== 0) {
          // change direction
          diff = voteType * 2;
        } else {
          diff = voteType;
        }

        return {
          ...p,
          score: p.score + diff,
          userVote: nextVote
        };
      }
      return p;
    }));

    try {
      const res = await fetch('/api/posts/vote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: currentUser.id,
          postId,
          voteType
        })
      });

      if (!res.ok) {
        // roll back or log
        void loadPostsAndCommunities();
      }
    } catch (e) {
      void loadPostsAndCommunities();
    }
  };

  const handleVoteComment = async (commentId: string, voteType: number) => {
    if (!currentUser) {
      setShowAuthModal(true);
      return;
    }

    try {
      await fetch('/api/posts/vote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: currentUser.id,
          commentId,
          voteType
        })
      });
      // Trigger select post refog to refresh nested comment score tree
      if (selectedPostId) {
        // refetched below lazily
        void loadPostsAndCommunities();
      }
    } catch (e) {
      console.warn(e);
    }
  };

  // Submit main and nested comments
  const handleSubmitComment = async (content: string, parentId: string | null) => {
    if (!currentUser || !selectedPostId) {
      setShowAuthModal(true);
      return;
    }

    const res = await fetch('/api/comments/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        postId: selectedPostId,
        parentId,
        userId: currentUser.id,
        content
      })
    });

    if (res.ok) {
      await loadPostsAndCommunities();
    } else {
      const err = await res.json();
      throw new Error(err.error || 'Comment rejected');
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!currentUser) return;
    const res = await fetch('/api/comments/delete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ commentId, userId: currentUser.id })
    });
    if (res.ok) {
      await loadPostsAndCommunities();
    }
  };

  const handleJoinLeaveCommunity = async (communityId: string, join: boolean) => {
    if (!currentUser) {
      setShowAuthModal(true);
      return;
    }

    // Optimistic UI change
    if (join) {
      setJoinedCommunityIds(prev => [...prev, communityId]);
    } else {
      setJoinedCommunityIds(prev => prev.filter(id => id !== communityId));
    }

    try {
      await fetch(`/api/communities/${join ? 'join' : 'leave'}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ communityId, userId: currentUser.id })
      });
      void loadPostsAndCommunities();
    } catch (e) {
      void loadPostsAndCommunities();
    }
  };

  const handleCreateCommunity = async (e: FormEvent) => {
    e.preventDefault();
    setCreateComError('');
    if (!newComName.trim() || !currentUser) return;

    try {
      const res = await fetch('/api/communities/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newComName.trim(),
          description: newComDesc.trim(),
          privacy: newComPrivacy,
          themeColor: newComTheme,
          logo: newComLogo,
          banner: newComBanner,
          creatorId: currentUser.id,
          rules: communityRules
        })
      });

      const data = await res.json();
      if (res.ok) {
        // Auto navigate to new community
        setSelectedCommunitySlug(data.community.slug);
        setSelectedPostId(null);
        setActiveView('feed');
        setNewComName('');
        setNewComDesc('');
        setNewComTheme('indigo');
        setNewComLogo('');
        setNewComBanner('');
        setShowCreateCommunityModal(false);
        await loadPostsAndCommunities();
      } else {
        setCreateComError(data.error || 'Failed creating sub-community');
      }
    } catch (err) {
      setCreateComError('Network issue creating community.');
    }
  };

  const handlePublishPost = async (postData: {
    title: string;
    content: string;
    postType: PostType;
    images?: string[];
    linkUrl?: string;
    pollOptions?: string[];
  }) => {
    if (!currentUser) return;
    const selectedCommunity = communities.find(c => c.slug === selectedCommunitySlug);
    if (!selectedCommunity) return;

    const res = await fetch('/api/posts/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...postData,
        communityId: selectedCommunity.id,
        userId: currentUser.id
      })
    });

    if (res.ok) {
      await loadPostsAndCommunities();
    } else {
      const err = await res.json();
      throw new Error(err.error || 'Server error creating post');
    }
  };

  const handleDeletePost = async (postId: string) => {
    if (!currentUser) return;
    try {
      const res = await fetch('/api/posts/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ postId, userId: currentUser.id })
      });
      if (res.ok) {
        if (selectedPostId === postId) {
          setSelectedPostId(null);
          setActiveView('feed');
        }
        await loadPostsAndCommunities();
      }
    } catch (e) {
      console.warn(e);
    }
  };

  const handlePinPost = async (postId: string, pin: boolean) => {
    try {
      const res = await fetch('/api/posts/pin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ postId, pin })
      });
      if (res.ok) {
        await loadPostsAndCommunities();
      }
    } catch (e) {
      console.warn(e);
    }
  };

  const handleVotePollOption = async (postId: string, option: string) => {
    if (!currentUser) {
      setShowAuthModal(true);
      return;
    }

    try {
      const res = await fetch('/api/posts/vote-poll', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ postId, option, userId: currentUser.id })
      });
      if (res.ok) {
        await loadPostsAndCommunities();
      }
    } catch (e) {
      console.warn(e);
    }
  };

  const handleFileReport = async (targetType: 'POST' | 'COMMENT', targetId: string, reason: string) => {
    if (!currentUser) return;
    try {
      await fetch('/api/reports/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reporterId: currentUser.id,
          targetType,
          targetId,
          reason
        })
      });
    } catch (e) {
      console.warn(e);
    }
  };

  const handleNavigate = (view: string, targetId?: string) => {
    if (view === 'profile') {
      setSelectedProfileId(targetId || currentUser?.id || null);
    }
    setSelectedPostId(null);
    setSelectedCommunitySlug(null);
    setActiveView(view);
  };

  // --- QUERY FILTERING CALCULATIONS ---
  
  // 1. Filter by Selected Community Slug
  let filteredPosts = posts;
  if (selectedCommunitySlug) {
    filteredPosts = posts.filter(p => p.communitySlug === selectedCommunitySlug);
  }

  // 2. Filter by search queries (matches title, content or community name)
  if (searchQuery.trim()) {
    const lc = searchQuery.toLowerCase();
    filteredPosts = filteredPosts.filter(p => 
      p.title.toLowerCase().includes(lc) || 
      p.content.toLowerCase().includes(lc) || 
      (p.communityName && p.communityName.toLowerCase().includes(lc))
    );
  }

  // 3. Sorting mechanism
  // Hot = high score and views, New = created_at desc, Top = score desc
  if (sortBy === 'New') {
    filteredPosts = [...filteredPosts].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  } else if (sortBy === 'Top') {
    filteredPosts = [...filteredPosts].sort((a, b) => b.score - a.score);
  } else {
    // Hot (default, mix of score, pinned on top)
    filteredPosts = [...filteredPosts].sort((a, b) => {
      // Pinned posts always on top
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;
      // Combined ranking score
      return (b.score + b.views * 0.1) - (a.score + a.views * 0.1);
    });
  }

  // Flattened Comments for selectedPostId thread render
  const postComments = selectedPostId 
    ? posts.find(p => p.id === selectedPostId)?.commentsCount || 0 
    : 0;

  // Render profile metadata list
  const targetProfile = selectedProfileId ? usersList.find(u => u.id === selectedProfileId) : null;
  const targetProfilePosts = targetProfile ? posts.filter(p => p.user_id === targetProfile.id) : [];

  return (
    <div id="home-root" className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans select-none antialiased">
      
      {/* Universal header */}
      <Header
        currentUser={currentUser}
        onLogout={handleLogout}
        onSearchChange={setSearchQuery}
        onOpenAuth={() => setShowAuthModal(true)}
        onNavigate={handleNavigate}
        onCreateCommunityClick={() => setShowCreateCommunityModal(true)}
        activeView={activeView}
      />

      {/* Main core responsive container with Bento-like gaps */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 py-8 flex flex-col lg:flex-row gap-8">
        
        {/* Dynamic Route Handler Panels */}
        <div className="flex-1 flex flex-col gap-8 min-w-0">
          
          <AnimatePresence mode="wait">
            
            {/* 1. Profile Cabinet Room */}
            {activeView === 'profile' && targetProfile && (
              <motion.div
                key="profile-room"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-6"
              >
                {/* Visual profile detail header */}
                <div className="bento-card p-8 flex flex-col md:flex-row gap-6 items-center md:items-start text-center md:text-left">
                  <img src={targetProfile.avatar} alt={targetProfile.username} className="w-24 h-24 rounded-2xl object-cover border-2 border-slate-900 shadow-md bg-white -mt-12 md:mt-2" />
                  <div className="space-y-3 flex-1 min-w-0">
                    <h2 className="text-3xl font-display font-black text-slate-900 tracking-tight leading-none">
                      u/{targetProfile.username}
                    </h2>
                    <p className="text-xs font-mono font-bold text-orange-600 bg-orange-50 px-2.5 py-1 rounded-lg inline-block border border-orange-200">
                      {targetProfile.karma} Reputation Karma score
                    </p>
                    <p className="text-xs text-slate-650 font-medium leading-relaxed">
                      {targetProfile.bio || "No custom biography established yet."}
                    </p>

                    <div className="pt-2 flex flex-wrap gap-2.5 justify-center md:justify-start">
                      <div className="px-3 py-1 bg-slate-100 rounded-full text-[10px] font-black text-slate-700 border border-slate-300 uppercase tracking-tight">
                        Rank: {targetProfile.role}
                      </div>
                      <div className="px-3 py-1 bg-slate-100 rounded-full text-[10px] font-black text-slate-700 border border-slate-300 uppercase tracking-tight">
                        Status: {targetProfile.status}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Submissions feed of user */}
                <div className="space-y-4">
                  <h3 className="text-xs font-bold text-gray-900 uppercase tracking-widest">
                    Postings created by u/{targetProfile.username}
                  </h3>
                  <Feed
                    posts={targetProfilePosts}
                    currentUser={currentUser}
                    onPostSelect={(id) => {
                      setSelectedPostId(id);
                      setActiveView('post-view');
                    }}
                    onVote={handleVotePost}
                    onDelete={handleDeletePost}
                    onPin={handlePinPost}
                    onCommunitySelect={(slug) => {
                      setSelectedCommunitySlug(slug);
                      setActiveView('feed');
                    }}
                    onVotePoll={handleVotePollOption}
                    savedState={savedPostsState}
                    onToggleSave={handleToggleSave}
                    sortBy={sortBy}
                    setSortBy={setSortBy}
                  />
                </div>
              </motion.div>
            )}

            {/* 2. Direct Messenger Layout */}
            {activeView === 'messages' && currentUser && (
              <motion.div
                key="messenger-room"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
              >
                <DirectMessages currentUser={currentUser} users={usersList} />
              </motion.div>
            )}

            {/* 3. Security Admin Dashboard Panel */}
            {activeView === 'admin' && currentUser && (
              <motion.div
                key="security-room"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
              >
                <AdminPanel currentUser={currentUser} onNavigate={handleNavigate} />
              </motion.div>
            )}

            {/* 4. Recursive Comments Detailed Thread View */}
            {activeView === 'post-view' && selectedPostId && (
              <motion.div
                key="thread-room"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                {(() => {
                  const post = posts.find(p => p.id === selectedPostId);
                  if (!post) {
                    return <p className="text-xs text-gray-500">Post not found</p>;
                  }
                  
                  return (
                    <PostView
                      post={post}
                      comments={threadComments}
                      currentUser={currentUser}
                      onBack={() => {
                        setSelectedPostId(null);
                        setActiveView('feed');
                      }}
                      onVotePost={handleVotePost}
                      onVoteComment={handleVoteComment}
                      onSubmitComment={handleSubmitComment}
                      onDeleteComment={handleDeleteComment}
                      onSubmitReport={handleFileReport}
                    />
                  );
                })()}
              </motion.div>
            )}

            {/* 5. Main Forums Feed with community filters */}
            {activeView === 'feed' && (
              <motion.div
                key="feed-room"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-6"
              >
                {/* Header detail for Selected Community focus */}
                {selectedCommunitySlug && (() => {
                  const community = communities.find(c => c.slug === selectedCommunitySlug);
                  if (!community) return null;
                  const isJoined = joinedCommunityIds.includes(community.id);
                  return (
                    <CommunityDetail
                      community={community}
                      currentUser={currentUser}
                      isJoined={isJoined}
                      onJoinLeave={() => handleJoinLeaveCommunity(community.id, !isJoined)}
                      onSubmitPost={handlePublishPost}
                    />
                  );
                })()}

                {/* Main listings list */}
                <Feed
                  posts={filteredPosts}
                  currentUser={currentUser}
                  onPostSelect={(id) => {
                    setSelectedPostId(id);
                    setActiveView('post-view');
                  }}
                  onVote={handleVotePost}
                  onDelete={handleDeletePost}
                  onPin={handlePinPost}
                  onCommunitySelect={(slug) => {
                    setSelectedCommunitySlug(slug);
                    setSelectedPostId(null);
                  }}
                  onVotePoll={handleVotePollOption}
                  savedState={savedPostsState}
                  onToggleSave={handleToggleSave}
                  sortBy={sortBy}
                  setSortBy={setSortBy}
                  isLoading={isFeedLoading}
                />
              </motion.div>
            )}

          </AnimatePresence>

        </div>

        {/* Persistent Right navigation Sidebar (only shown in Feed layout screens) */}
        {activeView === 'feed' && (
          <CommunitySidebar
            communities={communities}
            joinedIds={joinedCommunityIds}
            currentUser={currentUser}
            onSelectCommunity={(slug) => {
              setSelectedCommunitySlug(slug);
              setSelectedPostId(null);
            }}
            onJoinLeave={handleJoinLeaveCommunity}
            onCreateCommunityClick={() => setShowCreateCommunityModal(true)}
            isLoading={isFeedLoading}
          />
        )}

      </main>

      {/* --- CREATE COMMUNITY POPUP WINDOW --- */}
      {showCreateCommunityModal && (
        <div id="create-community-modal" className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-sm">
          <div className="bg-white rounded-3xl border-2 border-slate-900 shadow-[6px_6px_0px_0px_rgba(15,23,42,1)] w-full max-w-lg font-sans text-xs overflow-hidden">
            
            <div className="p-6 bg-slate-900 text-white flex justify-between items-center border-b-2 border-slate-900">
              <div>
                <h3 className="text-sm font-display font-black text-white uppercase tracking-wider">Start a Niche Sub-Community</h3>
                <p className="text-[10px] text-slate-400">Launch a brand-new space for discussions</p>
              </div>
              <button 
                id="close-create-community"
                onClick={() => setShowCreateCommunityModal(false)}
                className="text-slate-400 hover:text-white font-black text-sm cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-4">
              {createComError && (
                <div className="p-3 bg-red-50 border-2 border-red-200 text-red-700 rounded-xl font-bold">
                  {createComError}
                </div>
              )}

              <form onSubmit={handleCreateCommunity} className="space-y-4 font-bold text-slate-700">
                <div>
                  <label htmlFor="com-name-input" className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1 font-display">Community Name</label>
                  <input
                    id="com-name-input"
                    type="text"
                    required
                    placeholder="e.g. Next.js Builders"
                    value={newComName}
                    onChange={(e) => setNewComName(e.target.value)}
                    className="block w-full px-4 py-2 bg-slate-50 border-2 border-slate-900 rounded-xl focus:outline-none focus:bg-white text-slate-950 text-xs transition-all"
                  />
                </div>

                <div>
                  <label htmlFor="com-desc-input" className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1 font-display">Description Focus</label>
                  <textarea
                    id="com-desc-input"
                    rows={2}
                    required
                    placeholder="What is this community for? e.g. sharing frameworks, tips, recipes..."
                    value={newComDesc}
                    onChange={(e) => setNewComDesc(e.target.value)}
                    className="block w-full px-4 py-2 bg-slate-50 border-2 border-slate-900 rounded-xl focus:outline-none focus:bg-white text-slate-950 text-xs transition-all"
                  />
                </div>

                {/* Logo & Banner URLs */}
                <div className="grid grid-cols-2 gap-3.5">
                  <div>
                    <label htmlFor="com-logo-input" className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1 font-display">Logo URL (Optional)</label>
                    <input
                      id="com-logo-input"
                      type="url"
                      placeholder="e.g. Unsplash URL"
                      value={newComLogo}
                      onChange={(e) => setNewComLogo(e.target.value)}
                      className="block w-full px-4 py-2 bg-slate-50 border-2 border-slate-900 rounded-xl focus:outline-none focus:bg-white text-slate-950 text-xs font-mono"
                    />
                  </div>
                  <div>
                    <label htmlFor="com-banner-input" className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1 font-display">Banner URL (Optional)</label>
                    <input
                      id="com-banner-input"
                      type="url"
                      placeholder="e.g. Unsplash Cover URL"
                      value={newComBanner}
                      onChange={(e) => setNewComBanner(e.target.value)}
                      className="block w-full px-4 py-2 bg-slate-50 border-2 border-slate-900 rounded-xl focus:outline-none focus:bg-white text-slate-950 text-xs font-mono"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label htmlFor="com-privacy-select" className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1 font-display">Privacy Type</label>
                    <select
                      id="com-privacy-select"
                      value={newComPrivacy}
                      onChange={(e) => setNewComPrivacy(e.target.value as CommunityPrivacy)}
                      className="block w-full p-2 bg-white border-2 border-slate-900 rounded-xl focus:outline-none text-slate-950 font-bold"
                    >
                      <option value={CommunityPrivacy.PUBLIC}>Public (Anyone)</option>
                      <option value={CommunityPrivacy.RESTRICTED}>Restricted (Approved)</option>
                      <option value={CommunityPrivacy.PRIVATE}>Private (Invite Only)</option>
                    </select>
                  </div>

                  <div>
                    <label htmlFor="com-theme-select" className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1 font-display">Theme Accent Color</label>
                    <select
                      id="com-theme-select"
                      value={newComTheme}
                      onChange={(e) => setNewComTheme(e.target.value)}
                      className="block w-full p-2 bg-white border-2 border-slate-900 rounded-xl focus:outline-none text-slate-950 font-bold"
                    >
                      <option value="indigo">Indigo Slate</option>
                      <option value="cyan">Teal Cyan</option>
                      <option value="emerald">Emerald Forest</option>
                      <option value="purple">Cosmic Purple</option>
                      <option value="amber">Amber Sand</option>
                    </select>
                  </div>
                </div>

                <button
                  id="confirm-create-community"
                  type="submit"
                  className="bento-button-primary w-full py-3 text-xs tracking-wide"
                >
                  Create and Join Community
                </button>
              </form>
            </div>

          </div>
        </div>
      )}

      {/* Auth overlay popup */}
      {showAuthModal && (
        <AuthModal
          onAuthSuccess={handleAuthSuccess}
          onClose={() => setShowAuthModal(false)}
        />
      )}

    </div>
  );
}
