/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, FormEvent } from 'react';
import { Community, PostType, User, Post } from '../types';
import { 
  Users, MapPin, Calendar, Globe, FileText, Image, 
  Link, HelpCircle, Sparkles, ChevronRight, CheckCircle2, ShieldCheck, Video 
} from 'lucide-react';
import { motion } from 'motion/react';

interface CommunityDetailProps {
  community: Community;
  currentUser: User | null;
  isJoined: boolean;
  onJoinLeave: () => void;
  onSubmitPost: (postData: {
    title: string;
    content: string;
    postType: PostType;
    images?: string[];
    videoUrl?: string;
    linkUrl?: string;
    pollOptions?: string[];
  }) => Promise<void>;
}

export default function CommunityDetail({
  community,
  currentUser,
  isJoined,
  onJoinLeave,
  onSubmitPost
}: CommunityDetailProps) {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showRulesModal, setShowRulesModal] = useState(false);
  const [activeTab, setActiveTab] = useState<PostType>(PostType.TEXT);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  
  // Draft autosave states
  const [isDraftSaved, setIsDraftSaved] = useState(false);

  // Load draft values on mount or community change
  useEffect(() => {
    const savedTitle = localStorage.getItem(`draft_post_title_${community.id}`);
    const savedContent = localStorage.getItem(`draft_post_content_${community.id}`);
    const savedTab = localStorage.getItem(`draft_post_tab_${community.id}`);
    if (savedTitle) setTitle(savedTitle);
    if (savedContent) setContent(savedContent);
    if (savedTab) setActiveTab(savedTab as PostType);
    if (savedTitle || savedContent) {
      setIsDraftSaved(true);
    }
  }, [community.id]);

  // Save changes to localStorage when modified
  useEffect(() => {
    if (title) {
      localStorage.setItem(`draft_post_title_${community.id}`, title);
    } else {
      localStorage.removeItem(`draft_post_title_${community.id}`);
    }
    setIsDraftSaved(!!title || !!content);
  }, [title, community.id]);

  useEffect(() => {
    if (content) {
      localStorage.setItem(`draft_post_content_${community.id}`, content);
    } else {
      localStorage.removeItem(`draft_post_content_${community.id}`);
    }
    setIsDraftSaved(!!title || !!content);
  }, [content, community.id]);

  useEffect(() => {
    localStorage.setItem(`draft_post_tab_${community.id}`, activeTab);
  }, [activeTab, community.id]);

  // Custom metadata states
  const [inputImgUrl, setInputImgUrl] = useState('');
  const [linkUrl, setLinkUrl] = useState('');
  const [pollOpts, setPollOpts] = useState<string[]>(['', '']);

  // Smart AI check states
  const [aiVerdict, setAiVerdict] = useState<{ verdict: string; rating: string; reasoning: string } | null>(null);
  const [aiChecking, setAiChecking] = useState(false);
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleAddPollOption = () => {
    if (pollOpts.length < 5) {
      setPollOpts([...pollOpts, '']);
    }
  };

  const handleRemovePollOption = (index: number) => {
    if (pollOpts.length > 2) {
      setPollOpts(pollOpts.filter((_, i) => i !== index));
    }
  };

  const handleAiCheck = async () => {
    if (!title) {
      setFormError('Please input a title for the AI Smart check first.');
      return;
    }
    setAiChecking(true);
    setFormError('');
    setAiVerdict(null);

    try {
      const payloadText = `${title}. ${content}`;
      const res = await fetch('/api/ai/moderate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: payloadText, type: 'post' })
      });
      if (res.ok) {
        const data = await res.json();
        setAiVerdict(data);
      } else {
        setFormError('AI Gateway was busy, please retry.');
      }
    } catch (e) {
      setFormError('Failed to ping Smart AI agent.');
    } finally {
      setAiChecking(false);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setFormError('');
    setSubmitting(true);

    if (!title.trim()) {
      setFormError('Please enter a descriptive post title.');
      setSubmitting(false);
      return;
    }

    const filteredPollOpts = pollOpts.filter(opt => opt.trim() !== '');
    if (activeTab === PostType.POLL && filteredPollOpts.length < 2) {
      setFormError('Polls require at least 2 non-empty choices.');
      setSubmitting(false);
      return;
    }

    try {
      await onSubmitPost({
        title,
        content,
        postType: activeTab,
        images: inputImgUrl ? [inputImgUrl] : undefined,
        linkUrl: activeTab === PostType.LINK ? linkUrl : undefined,
        pollOptions: activeTab === PostType.POLL ? filteredPollOpts : undefined
      });

      // Clear Form state
      setTitle('');
      setContent('');
      setInputImgUrl('');
      setLinkUrl('');
      setPollOpts(['', '']);
      setAiVerdict(null);
      setShowCreateModal(false);

      // Clear draft localStorage keys
      localStorage.removeItem(`draft_post_title_${community.id}`);
      localStorage.removeItem(`draft_post_content_${community.id}`);
      localStorage.removeItem(`draft_post_tab_${community.id}`);
      setIsDraftSaved(false);
    } catch (err: any) {
      setFormError(err.message || 'Verification Error. Check content rules.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div id="community-detail-container" className="mb-6 font-sans">
      
      {/* Covered Big Banner */}
      <div className="relative h-44 rounded-3xl overflow-hidden border-2 border-slate-900 bg-gray-900 shadow-[3px_3px_0px_0px_rgba(15,23,42,1)]">
        <img src={community.banner} alt={community.name} className="w-full h-full object-cover blur-sm opacity-60" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
      </div>

      {/* Main Core Banner details */}
      <div className="relative px-6 pb-5 flex flex-col md:flex-row justify-between items-start md:items-end gap-4 -mt-10 mb-2">
        <div className="flex gap-4 items-end">
          <img 
            src={community.logo} 
            alt={community.name} 
            className="w-20 h-20 rounded-3xl object-cover border-4 border-slate-900 shadow-[4px_4px_0px_0px_rgba(15,23,42,1)] bg-white relative z-10" 
          />
          <div>
            <h1 className="text-xl font-display font-black text-slate-950 leading-tight uppercase tracking-tight">
              {community.name}
            </h1>
            <p className="text-sm font-black text-orange-600 font-mono tracking-wide">
              h/{community.slug}
            </p>
          </div>
        </div>

        {currentUser && (
          <div className="flex gap-2.5 z-10">
            <button
              id="com-detail-join-btn"
              onClick={onJoinLeave}
              className={`px-5 py-2.5 text-xs font-black uppercase tracking-wide rounded-xl border-2 border-slate-900 transition-all active:scale-95 cursor-pointer shadow-[3px_3px_0px_0px_rgba(15,23,42,1)] hover:translate-y-[-1px] ${
                isJoined 
                ? 'bg-slate-200 text-slate-700' 
                : 'bg-orange-600 text-white hover:bg-orange-700'
              }`}
            >
              {isJoined ? 'Joined' : 'Join Community'}
            </button>

            <button
              id="com-detail-create-post-btn"
              onClick={() => setShowCreateModal(true)}
              className="px-5 py-2.5 bg-slate-900 text-white text-xs font-black uppercase tracking-wide border-2 border-slate-900 rounded-xl hover:bg-slate-800 active:scale-95 transition-all shadow-[3px_3px_0px_0px_rgba(15,23,42,1)]"
            >
              Write Post
            </button>
          </div>
        )}
      </div>

      {/* Mini Description parameters */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 p-5 bento-card bg-white mt-4 mb-4 text-xs font-bold text-slate-800">
        <div className="flex items-center gap-2">
          <Users className="w-4.5 h-4.5 text-slate-900 stroke-[2.5]" />
          <span>{community.membersCount || 1} Members</span>
        </div>
        <div className="flex items-center gap-2">
          <Globe className="w-4.5 h-4.5 text-slate-900 stroke-[2.5]" />
          <span className="uppercase font-sans tracking-wide text-[10px]">{community.privacy} Cabin</span>
        </div>
        <div className="flex items-center gap-2">
          <Calendar className="w-4.5 h-4.5 text-slate-900 stroke-[2.5]" />
          <span>Since {new Date(community.created_at).toLocaleDateString()}</span>
        </div>
        <button
          id="com-rules-modal-btn"
          onClick={() => setShowRulesModal(true)}
          className="flex items-center gap-2 text-orange-600 hover:text-orange-700 transition-all font-black uppercase text-[11px] tracking-wide cursor-pointer text-left focus:outline-none hover:translate-x-1"
        >
          <FileText className="w-4.5 h-4.5 text-orange-600 stroke-[2.5]" />
          <span>Rules Summary ➔</span>
        </button>
      </div>

      {community.description && (
        <div className="p-4 bg-slate-50 border-2 border-slate-900 rounded-2xl text-xs text-slate-850 leading-relaxed font-bold mb-3 shadow-[1px_1px_0px_0px_rgba(15,23,42,1)]">
          <p className="font-black text-slate-950 mb-1 leading-relaxed uppercase tracking-tight font-display">Description Focus:</p>
          {community.description}
        </div>
      )}

      {/* --- CREATE POST DIRECT ACTION MODAL --- */}
      {showCreateModal && (
        <div id="create-post-modal" className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/45 backdrop-blur-sm">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-2xl bg-white border-2 border-slate-900 rounded-3xl overflow-hidden shadow-[6px_6px_0px_0px_rgba(15,23,42,1)] max-h-[90vh] flex flex-col"
          >
            {/* Modal Head */}
            <div className="p-6 bg-slate-900 text-white flex justify-between items-center border-b-2 border-slate-900 relative">
              <div>
                <h3 className="text-sm font-display font-black text-white uppercase tracking-wider">Create Post in h/{community.slug}</h3>
                <p className="text-[10px] text-slate-400">Share findings, links, images or interactive polls</p>
              </div>
              <button 
                id="create-modal-close"
                onClick={() => setShowCreateModal(false)}
                className="text-slate-450 hover:text-white text-xs font-black uppercase tracking-wider cursor-pointer"
              >
                ✕ Close
              </button>
            </div>

            {/* Modal scrollable form body */}
            <div className="p-6 md:p-8 overflow-y-auto custom-scrollbar flex-1 space-y-5">
              
              {formError && (
                <div className="p-4 bg-red-50 border-2 border-red-200 text-red-700 rounded-2xl text-xs font-bold flex items-center gap-2.5">
                  <span className="font-bold">{formError}</span>
                </div>
              )}

              {/* Type Category Selection tabs */}
              <div className="flex border-b-2 border-slate-900 gap-2 pb-2 flex-wrap">
                {[
                  { type: PostType.TEXT, label: 'Text Post', icon: FileText },
                  { type: PostType.IMAGE, label: 'Photo/Image', icon: Image },
                  { type: PostType.LINK, label: 'External Link', icon: Link },
                  { type: PostType.POLL, label: 'Polls Option', icon: HelpCircle }
                ].map((item) => (
                  <button
                    id={`post-type-tab-${item.type}`}
                    key={item.type}
                    type="button"
                    onClick={() => {
                      setActiveTab(item.type);
                      setFormError('');
                    }}
                    className={`flex items-center gap-1.5 px-4 py-2 text-xs font-black uppercase tracking-tight rounded-xl border-2 border-slate-900 transition-all cursor-pointer ${
                      activeTab === item.type 
                      ? 'bg-slate-900 text-white shadow-[2px_2px_0px_0px_rgba(15,23,42,1)]' 
                      : 'bg-white text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <item.icon className="w-3.5 h-3.5 stroke-[2.5]" />
                    <span>{item.label}</span>
                  </button>
                ))}
              </div>

              <form onSubmit={handleSubmit} className="space-y-5 font-bold text-slate-705">
                {/* Title */}
                <div>
                  <div className="flex justify-between items-center mb-1.5 flex-wrap gap-2">
                    <label htmlFor="post-title-input" className="block text-[10px] font-black text-slate-500 uppercase tracking-widest font-display">
                      Creative Post Title
                    </label>
                    {isDraftSaved && (
                      <span className="text-[9px] text-emerald-600 font-extrabold bg-emerald-50 border-2 border-emerald-300 px-2.5 py-0.5 rounded-lg uppercase tracking-tight animate-pulse flex items-center gap-1.5 shadow-[1px_1px_0px_0px_rgba(15,23,42,1)] select-none">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                        Draft Auto-Saved
                      </span>
                    )}
                  </div>
                  <input
                    id="post-title-input"
                    type="text"
                    required
                    placeholder="Enter an informative, high-interest title..."
                    value={title}
                    onChange={(e) => {
                      setTitle(e.target.value);
                      setFormError('');
                    }}
                    className="block w-full px-4 py-2 bg-slate-50 border-2 border-slate-900 rounded-xl focus:outline-none focus:bg-white text-slate-950 font-bold text-xs"
                  />
                </div>

                {/* Main description context depending on tabs */}
                <div>
                  <label htmlFor="post-content-input" className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5 font-display">
                    Content / Description Body
                  </label>
                  <textarea
                    id="post-content-input"
                    rows={4}
                    placeholder="Write details, thoughts or code examples..."
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    className="block w-full px-4 py-2 bg-slate-50 border-2 border-slate-900 rounded-xl focus:outline-none focus:bg-white text-slate-955 font-bold text-xs"
                  />
                </div>

                {/* IMAGE TAB CONFIG */}
                {activeTab === PostType.IMAGE && (
                  <div>
                    <label htmlFor="post-image-url" className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5 font-display">
                      Hosted Image URL
                    </label>
                    <input
                      id="post-image-url"
                      type="url"
                      placeholder="e.g. https://images.unsplash.com/photo-example-url"
                      value={inputImgUrl}
                      onChange={(e) => setInputImgUrl(e.target.value)}
                      className="block w-full px-4 py-2 bg-slate-50 border-2 border-slate-900 rounded-xl focus:outline-none focus:bg-white text-slate-950 font-mono text-xs"
                    />
                    <p className="text-[10px] text-slate-400 mt-1 font-bold">Please supply a fully qualified image file address link.</p>
                  </div>
                )}

                {/* LINK TAB CONFIG */}
                {activeTab === PostType.LINK && (
                  <div>
                    <label htmlFor="post-link-url" className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5 font-display">
                      Redirect URL Address
                    </label>
                    <input
                      id="post-link-url"
                      type="url"
                      placeholder="e.g. https://github.com/repository-name"
                      value={linkUrl}
                      onChange={(e) => setLinkUrl(e.target.value)}
                      className="block w-full px-4 py-2 bg-slate-50 border-2 border-slate-900 rounded-xl focus:outline-none focus:bg-white text-slate-950 font-mono text-xs"
                    />
                  </div>
                )}

                {/* POLL TAB CONFIG */}
                {activeTab === PostType.POLL && (
                  <div className="space-y-2.5">
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest font-display">Poll Choices / Voting Options</span>
                      {pollOpts.length < 5 && (
                        <button
                          id="add-poll-option"
                          type="button"
                          onClick={handleAddPollOption}
                          className="text-[10px] font-black text-orange-600 hover:underline cursor-pointer uppercase"
                        >
                          + Add choice
                        </button>
                      )}
                    </div>

                    <div className="space-y-2">
                      {pollOpts.map((opt, idx) => (
                        <div key={idx} className="flex gap-2 items-center">
                          <input
                            id={`poll-opt-input-${idx}`}
                            type="text"
                            required
                            placeholder={`Option ${idx + 1}`}
                            value={opt}
                            onChange={(e) => {
                              const updated = [...pollOpts];
                              updated[idx] = e.target.value;
                              setPollOpts(updated);
                            }}
                            className="block w-full px-4 py-2 text-xs bg-slate-50 border-2 border-slate-900 rounded-xl focus:outline-none focus:bg-white text-slate-950"
                          />
                          {pollOpts.length > 2 && (
                            <button
                              id={`remove-poll-opt-${idx}`}
                              type="button"
                              onClick={() => handleRemovePollOption(idx)}
                              className="text-xs text-red-600 hover:text-red-700 font-bold px-1 cursor-pointer"
                            >
                              ✕
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Gemini AI Smart Evaluator block */}
                <div className="bg-orange-50 border-2 border-slate-900 rounded-2xl p-4 flex flex-col gap-3 font-sans shadow-[2px_2px_0px_0px_rgba(15,23,42,1)]">
                  <div className="flex justify-between items-center flex-wrap gap-2">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <Sparkles className="w-4 h-4 text-orange-600 animate-pulse stroke-[2.5]" />
                      <span className="text-xs font-black text-slate-905 uppercase tracking-tight">Gemini AI Smart Assistant</span>
                    </div>

                    <button
                      id="ai-moderation-check"
                      type="button"
                      disabled={aiChecking}
                      onClick={handleAiCheck}
                      className="px-3 py-1.5 bg-white border-2 border-slate-900 text-orange-655 rounded-lg text-[10px] font-black hover:bg-orange-100 shadow-[1px_1px_0px_0px_rgba(15,23,42,1)] tracking-wide transition-all duration-205 cursor-pointer disabled:opacity-50"
                    >
                      {aiChecking ? 'AI evaluating...' : 'Audit with AI'}
                    </button>
                  </div>

                  {aiVerdict && (
                    <div className="text-[11px] leading-relaxed p-3 bg-white border-2 border-slate-350 rounded-xl space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-black text-slate-800">Verdict:</span>
                        <div className={`px-2.5 py-0.5 rounded-lg text-[9px] font-black uppercase border-2 ${
                          aiVerdict.verdict === 'Approved' ? 'bg-emerald-100 border-emerald-950 text-emerald-800' : 'bg-red-105 border-red-900 text-red-800'
                        }`}>
                          {aiVerdict.verdict} ({aiVerdict.rating})
                        </div>
                      </div>
                      <p className="text-slate-650"><span className="font-bold text-slate-850">AI Logic:</span> {aiVerdict.reasoning}</p>
                    </div>
                  )}
                </div>

                <button
                  id="post-submit-confirm"
                  type="submit"
                  disabled={submitting}
                  className="bento-button-primary w-full py-3 text-xs tracking-wider"
                >
                  {submitting ? 'Publishing post to hub...' : 'Confirm & Publish Post'}
                </button>
              </form>

            </div>
          </motion.div>
        </div>
      )}

      {/* --- COMMUNITY RULES MODAL --- */}
      {showRulesModal && (
        <div id="community-rules-modal" className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-sm">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-3xl border-2 border-slate-900 shadow-[6px_6px_0px_0px_rgba(15,23,42,1)] w-full max-w-md font-sans text-xs overflow-hidden"
          >
            
            <div className="p-6 bg-slate-900 text-white flex justify-between items-center border-b-2 border-slate-900">
              <div>
                <h3 className="text-sm font-display font-black text-white uppercase tracking-wider">Guidelines & Rules</h3>
                <p className="text-[10px] text-slate-400">Maintained for h/{community.slug}</p>
              </div>
              <button 
                id="close-rules-modal"
                onClick={() => setShowRulesModal(false)}
                className="text-slate-400 hover:text-white font-black text-sm cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="space-y-3 font-bold text-slate-705">
                {(!community.rules || community.rules.length === 0) ? (
                  <div className="p-4 bg-slate-50/50 border-2 border-slate-900 rounded-2xl flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-slate-900 stroke-[2.5] mt-0.5 flex-shrink-0" />
                    <div>
                      <h4 className="text-[11px] font-black text-slate-950 uppercase tracking-tight">Be Excellent to Each Other</h4>
                      <p className="text-[11.5px] text-slate-500 mt-0.5 leading-relaxed">Please default to polite code/design dialogue, show mutual respect, avoid explicit marketing spam, and share constructive posts.</p>
                    </div>
                  </div>
                ) : (
                  community.rules.map((rule, idx) => (
                    <div key={idx} className="p-4 bg-orange-50/50 border-2 border-slate-900 rounded-2xl flex items-start gap-3.5 shadow-[2px_2px_0px_0px_rgba(15,23,42,1)]">
                      <div className="w-6 h-6 rounded-lg bg-orange-600 text-white flex items-center justify-center text-xs font-black border-2 border-slate-900 shadow-[1px_1px_0px_0px_rgba(15,23,42,1)] flex-shrink-0">
                        {idx + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[11.5px] text-slate-900 leading-normal font-bold">{rule}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>

              <button
                id="rules-modal-ack"
                onClick={() => setShowRulesModal(false)}
                className="bento-button-primary w-full py-3 text-xs tracking-wide cursor-pointer uppercase font-black"
              >
                I Understand & Agree
              </button>
            </div>

          </motion.div>
        </div>
      )}

    </div>
  );
}
