/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, FormEvent } from 'react';
import { Post, Comment, User, UserRole } from '../types';
import { 
  ArrowBigUp, ArrowBigDown, ArrowLeft, Trash2, Eye, Flag, 
  CornerDownRight, CheckCircle2, Copy, Send, Smile, ExternalLink, ShieldAlert, Sparkles 
} from 'lucide-react';

interface PostViewProps {
  post: Post;
  comments: Comment[];
  currentUser: User | null;
  onBack: () => void;
  onVotePost: (postId: string, voteType: number) => void;
  onVoteComment: (commentId: string, voteType: number) => void;
  onSubmitComment: (content: string, parentId: string | null) => Promise<void>;
  onDeleteComment: (commentId: string) => void;
  onSubmitReport: (targetType: 'POST' | 'COMMENT', targetId: string, reason: string) => void;
}

export default function PostView({
  post,
  comments,
  currentUser,
  onBack,
  onVotePost,
  onVoteComment,
  onSubmitComment,
  onDeleteComment,
  onSubmitReport
}: PostViewProps) {
  const [newCommentText, setNewCommentText] = useState('');
  const [replyTargetId, setReplyTargetId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const [reportTarget, setReportTarget] = useState<{ type: 'POST' | 'COMMENT'; id: string } | null>(null);
  const [reportReason, setReportReason] = useState('');
  const [reportSubmitted, setReportSubmitted] = useState(false);
  const [reporting, setReporting] = useState(false);

  // Gemini TL;DR states
  const [tldr, setTldr] = useState<string | null>(null);
  const [tldrLoading, setTldrLoading] = useState(false);
  const [tldrError, setTldrError] = useState<string | null>(null);
  const [isDraftAutosaved, setIsDraftAutosaved] = useState(false);

  // Fetch TL;DR automatically for long text posts (> 100 characters)
  useEffect(() => {
    if (post.content && post.content.length > 100) {
      const fetchTldrSummary = async () => {
        setTldrLoading(true);
        setTldrError(null);
        try {
          const res = await fetch('/api/ai/tldr', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text: post.content, title: post.title }),
          });
          if (res.ok) {
            const data = await res.json();
            setTldr(data.summary);
          } else {
            setTldrError('Failed to fetch summary');
          }
        } catch (e) {
          setTldrError('AI service currently unavailable');
        } finally {
          setTldrLoading(false);
        }
      };
      void fetchTldrSummary();
    } else {
      setTldr(null);
    }
  }, [post.id, post.content, post.title]);

  // Load comment draft from localStorage
  useEffect(() => {
    const savedText = localStorage.getItem(`draft_comment_post_${post.id}`);
    if (savedText) {
      setNewCommentText(savedText);
      setIsDraftAutosaved(true);
    } else {
      setIsDraftAutosaved(false);
    }
  }, [post.id]);

  // Save comment draft to localStorage
  useEffect(() => {
    if (newCommentText) {
      localStorage.setItem(`draft_comment_post_${post.id}`, newCommentText);
      setIsDraftAutosaved(true);
    } else {
      localStorage.removeItem(`draft_comment_post_${post.id}`);
      setIsDraftAutosaved(false);
    }
  }, [newCommentText, post.id]);

  const handlePostMainComment = async (e: FormEvent) => {
    e.preventDefault();
    if (!newCommentText.trim()) return;

    try {
      await onSubmitComment(newCommentText.trim(), null);
      setNewCommentText('');
      localStorage.removeItem(`draft_comment_post_${post.id}`);
      setIsDraftAutosaved(false);
    } catch (e) {
      console.warn('Failed comment submission', e);
    }
  };

  const handlePostReply = async (parentId: string) => {
    if (!replyText.trim()) return;

    try {
      await onSubmitComment(replyText.trim(), parentId);
      setReplyText('');
      setReplyTargetId(null);
    } catch (e) {
      console.warn('Failed reply submission', e);
    }
  };

  const submitReportHandler = () => {
    if (!reportTarget || !reportReason.trim()) return;
    onSubmitReport(reportTarget.type, reportTarget.id, reportReason.trim());
    setReportSubmitted(true);
    setTimeout(() => {
      setReportSubmitted(false);
      setReportTarget(null);
      setReportReason('');
    }, 2000);
  };

  // RECURSIVE COMPONENT TO RENDER NESTED COMMENTS
  const CommentNode = ({ node, depth }: { node: Comment; depth: number; key?: any }) => {
    const isReplying = replyTargetId === node.id;
    const canDelete = currentUser && (
      currentUser.role === UserRole.ADMIN || 
      currentUser.role === UserRole.MODERATOR || 
      currentUser.id === node.user_id
    );

    return (
      <div 
        id={`comment-wrapper-${node.id}`}
        className="flex flex-col gap-2 relative mt-4 font-sans text-xs"
        style={{ marginLeft: `${depth > 0 ? Math.min(depth * 14, 42) : 0}px` }}
      >
        {/* Thread nesting line guide */}
        {depth > 0 && (
          <div className="absolute -left-3.5 top-0 bottom-0 w-0.5 bg-slate-900 rounded-full" />
        )}

        <div className="bg-white border-2 border-slate-900 rounded-2xl p-4 shadow-[2px_2px_0px_0px_rgba(15,23,42,1)] relative">
          
          {/* Comment Author metadata */}
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-2">
              <img src={node.userAvatar} alt={node.username} className="w-5.5 h-5.5 rounded-full object-cover border-2 border-slate-900" />
              <span className="font-extrabold text-slate-950">u/{node.username}</span>
              <span className="text-[10px] text-slate-500 font-mono font-bold">{new Date(node.created_at).toLocaleDateString()}</span>
            </div>

            <div className="flex items-center gap-2">
              {/* Vote Actions for Comment */}
              <div className="flex items-center gap-1 bg-slate-100 border-2 border-slate-900 rounded-xl px-2 py-0.5">
                <button
                  id={`comment-vote-up-${node.id}`}
                  onClick={() => onVoteComment(node.id, 1)}
                  className={`p-0.5 rounded-lg transition-all active:scale-90 ${node.userVote === 1 ? 'text-orange-600' : 'text-slate-400 hover:text-slate-600'}`}
                >
                  <ArrowBigUp className="w-4 h-4 fill-current stroke-[2.5]" />
                </button>
                <span className="text-[10px] font-black text-slate-900 font-mono px-0.5">{node.score}</span>
                <button
                  id={`comment-vote-down-${node.id}`}
                  onClick={() => onVoteComment(node.id, -1)}
                  className={`p-0.5 rounded-lg transition-all active:scale-90 ${node.userVote === -1 ? 'text-indigo-600' : 'text-slate-400 hover:text-slate-600'}`}
                >
                  <ArrowBigDown className="w-4 h-4 fill-current stroke-[2.5]" />
                </button>
              </div>

              {/* Delete Comment */}
              {canDelete && (
                <button
                  id={`delete-comment-${node.id}`}
                  onClick={() => onDeleteComment(node.id)}
                  className="p-1 text-red-600 hover:text-red-700 border-2 border-slate-900 bg-white rounded-lg hover:bg-red-50 transition-all font-bold"
                  title="Remove Comment"
                >
                  <Trash2 className="w-3.5 h-3.5 stroke-[2.5]" />
                </button>
              )}

              {/* Report Comment */}
              {currentUser && (
                <button
                  id={`report-comment-btn-${node.id}`}
                  onClick={() => setReportTarget({ type: 'COMMENT', id: node.id })}
                  className="p-1 text-slate-600 hover:text-orange-600 border-2 border-slate-900 bg-white rounded-lg hover:bg-slate-50 transition-all font-bold"
                  title="Report Comment"
                >
                  <Flag className="w-3.5 h-3.5 stroke-[2.5]" />
                </button>
              )}
            </div>
          </div>

          {/* Comment text body */}
          <p className="mt-2 text-xs text-slate-800 leading-relaxed break-words whitespace-pre-wrap pl-1 font-bold">{node.content}</p>

          {/* Comment reply bar triggers */}
          {currentUser && (
            <div className="mt-2.5 flex items-center gap-4 text-[10px] font-black text-slate-500 uppercase tracking-widest select-none">
              <button
                id={`reply-toggle-${node.id}`}
                onClick={() => {
                  setReplyTargetId(isReplying ? null : node.id);
                  setReplyText('');
                }}
                className="hover:text-orange-600 transition-all cursor-pointer flex items-center gap-1.5"
              >
                <CornerDownRight className="w-3.5 h-3.5 text-slate-900 stroke-[2.5]" />
                <span>{isReplying ? 'Cancel' : 'Reply'}</span>
              </button>
            </div>
          )}
        </div>

        {/* Input for active replying thread */}
        {isReplying && (
          <div className="flex gap-2 items-end ml-4 py-1.5 font-sans">
            <input
              id={`comment-reply-input-${node.id}`}
              type="text"
              required
              placeholder={`Replying to u/${node.username}...`}
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              className="block w-full px-4 py-2 text-xs bg-slate-50 border-2 border-slate-900 rounded-xl focus:outline-none focus:bg-white text-slate-950 font-bold"
            />
            <button
              id={`confirm-reply-btn-${node.id}`}
              onClick={() => handlePostReply(node.id)}
              className="p-2 py-2.5 bg-orange-600 hover:bg-orange-700 border-2 border-slate-900 rounded-xl text-white flex items-center justify-center transition-all cursor-pointer shadow-[2px_2px_0px_0px_rgba(15,23,42,1)] hover:translate-y-[-1px]"
            >
              <Send className="w-4 h-4 stroke-[2.5]" />
            </button>
          </div>
        )}

        {/* RECURSIVE REPLIES IN NESTED STRUCTURE */}
        {node.replies && node.replies.map(reply => (
          <CommentNode key={reply.id} node={reply} depth={depth + 1} />
        ))}
      </div>
    );
  };

  return (
    <div id="full-post-thread-container" className="flex-1 space-y-6 font-sans">
      
      {/* Return to Feed button */}
      <button
        id="post-view-back-btn"
        onClick={onBack}
        className="flex items-center gap-1.5 text-xs font-black uppercase tracking-wider text-slate-700 hover:text-orange-600 transition-all py-1 cursor-pointer"
      >
        <ArrowLeft className="w-4 h-4 stroke-[2.5]" />
        <span>Return to Feed list</span>
      </button>

      {/* Gemini TL;DR Bento Card for long text posts */}
      {post.content && post.content.length > 100 && (
        <div 
          id="post-tldr-card" 
          className="bg-amber-50 rounded-3xl border-2 border-slate-900 p-5 shadow-[4px_4px_0px_0px_rgba(15,23,42,1)] relative overflow-hidden flex gap-4 items-start"
        >
          {/* Sparkly visual accent */}
          <div className="absolute top-0 right-0 p-2.5 bg-slate-900 text-amber-300 rounded-bl-2xl border-l-2 border-b-2 border-slate-900 flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span className="text-[9px] font-black uppercase tracking-wider font-mono">Gemini AI</span>
          </div>

          <div className="p-2.5 bg-amber-200 rounded-2xl border-2 border-slate-900 shadow-[2px_2px_0px_0px_rgba(15,23,42,1)] flex-shrink-0 text-slate-900">
            <Sparkles className="w-4 h-4 stroke-[2.5]" />
          </div>

          <div className="space-y-1 my-0.5 flex-1 min-w-0 pr-16 md:pr-24">
            <h4 className="text-[10px] font-mono font-black text-slate-500 uppercase tracking-widest">
              AI Generated Post Summary
            </h4>
            
            {tldrLoading ? (
              <div className="space-y-2 mt-2 animate-pulse pointer-events-none">
                <div className="h-3.5 bg-amber-250/50 rounded w-11/12 border border-amber-300" />
                <div className="h-3 bg-amber-250/50 rounded w-4/5 border border-amber-300" />
              </div>
            ) : tldrError ? (
              <div className="flex items-center gap-2 text-rose-800 font-bold text-xs mt-2">
                <span>{tldrError}</span>
                <button 
                  type="button"
                  onClick={async () => {
                    setTldrLoading(true);
                    setTldrError(null);
                    try {
                      const res = await fetch('/api/ai/tldr', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ text: post.content, title: post.title }),
                      });
                      if (res.ok) {
                        const data = await res.json();
                        setTldr(data.summary);
                      } else {
                        setTldrError('Failed to fetch summary');
                      }
                    } catch (e) {
                      setTldrError('AI service currently unavailable');
                    } finally {
                      setTldrLoading(false);
                    }
                  }}
                  className="px-2.5 py-1 border-2 border-slate-900 rounded-lg bg-white hover:bg-slate-100 text-[9px] uppercase font-black tracking-tight cursor-pointer"
                >
                  Retry
                </button>
              </div>
            ) : (
              <p className="text-xs text-slate-900 font-bold leading-relaxed pr-2 mt-1 whitespace-pre-wrap">
                {tldr || "Synthesizing briefing..."}
              </p>
            )}
          </div>
        </div>
      )}

      {/* Main post layout Card banner */}
      <div className="bg-white rounded-3xl border-2 border-slate-900 overflow-hidden shadow-[4px_4px_0px_0px_rgba(15,23,42,1)]">
        
        {/* Post header metadata */}
        <div className="p-6 pb-4">
          <div className="flex gap-3 items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xs font-black uppercase tracking-widest text-orange-600 font-mono">h/{post.communitySlug}</span>
              <span className="text-slate-300 font-bold">•</span>
              <span className="text-[11px] font-bold text-slate-600">Posted by u/{post.username}</span>
              <span className="text-[11px] text-slate-500 font-mono font-semibold">{new Date(post.created_at).toLocaleDateString()}</span>
            </div>

            <div className="flex items-center gap-1">
              <Eye className="w-3.5 h-3.5 text-slate-500 stroke-[2.5]" />
              <span className="text-[10px] text-slate-500 font-mono font-bold">{post.views} Views</span>

              {currentUser && (
                <button
                  id="report-post-btn"
                  onClick={() => setReportTarget({ type: 'POST', id: post.id })}
                  className="p-1 px-1.5 text-slate-500 hover:text-orange-655 rounded text-xs flex items-center gap-1 cursor-pointer"
                  title="Report Post"
                >
                  <Flag className="w-3.5 h-3.5 stroke-[2.5]" />
                </button>
              )}
            </div>
          </div>

          <h2 className="text-base md:text-lg font-display font-black text-slate-950 uppercase tracking-tight mt-3 mb-2.5">
            {post.title}
          </h2>

          <p className="text-xs text-slate-800 leading-relaxed font-sans font-bold whitespace-pre-wrap">{post.content}</p>

          {post.images && post.images.length > 0 && (
            <div className="my-4 rounded-2xl overflow-hidden border-2 border-slate-900 max-h-[420px] bg-slate-50 flex justify-center items-center shadow-[2px_2px_0px_0px_rgba(15,23,42,1)]">
              <img src={post.images[0]} alt={post.title} className="max-h-full object-contain" referrerPolicy="no-referrer" />
            </div>
          )}

          {post.linkUrl && (
            <div className="my-4 p-4 bg-slate-50 border-2 border-slate-900 rounded-2xl shadow-[2px_2px_0px_0px_rgba(15,23,42,1)]">
              <a 
                id="post-view-external-link"
                href={post.linkUrl} 
                target="_blank" 
                rel="noreferrer" 
                className="flex items-center justify-between text-xs text-indigo-700 font-black tracking-wide truncate hover:underline"
              >
                <span className="truncate">{post.linkUrl}</span>
                <ExternalLink className="w-4 h-4 flex-shrink-0 stroke-[2.5]" />
              </a>
            </div>
          )}
        </div>

        {/* Voting row footer */}
        <div className="border-t-2 border-slate-900 bg-slate-50 px-6 py-3 flex justify-between items-center">
          <div className="flex items-center gap-2 bg-white border-2 border-slate-900 rounded-xl p-0.5 shadow-[2px_2px_0px_0px_rgba(15,23,42,1)]">
            <button
              id="post-view-vote-up"
              onClick={() => onVotePost(post.id, 1)}
              className={`p-1.5 rounded-lg transition-all ${post.userVote === 1 ? 'text-orange-600 bg-orange-100' : 'text-slate-400 hover:text-slate-600'}`}
              title="Upvote Post"
            >
              <ArrowBigUp className="w-5 h-5 fill-current stroke-[2.5]" />
            </button>
            <span className="text-xs font-black text-slate-900 font-mono px-1">{post.score}</span>
            <button
              id="post-view-vote-down"
              onClick={() => onVotePost(post.id, -1)}
              className={`p-1.5 rounded-lg transition-all ${post.userVote === -1 ? 'text-indigo-600 bg-indigo-100' : 'text-slate-400 hover:text-slate-600'}`}
              title="Downvote Post"
            >
              <ArrowBigDown className="w-5 h-5 fill-current stroke-[2.5]" />
            </button>
          </div>

          <span className="text-[10px] font-mono font-black text-slate-550 uppercase tracking-widest">
            {comments.length} Base Root Comments
          </span>
        </div>
      </div>

      {/* --- RECIPIENT MAIN POST COMMENT BAR --- */}
      {currentUser ? (
        <form onSubmit={handlePostMainComment} className="p-5 bg-white border-2 border-slate-900 rounded-3xl shadow-[3px_3px_0px_0px_rgba(15,23,42,1)] flex gap-4 items-end font-sans">
          <div className="flex-1">
            <div className="flex justify-between items-center mb-1.5 flex-wrap gap-2">
              <label htmlFor="main-comment-input" className="block text-[10px] font-black text-slate-500 uppercase tracking-widest">
                Leave a Reply Comment
              </label>
              {isDraftAutosaved && (
                <span className="text-[9px] text-emerald-600 font-extrabold bg-emerald-50 border-2 border-emerald-300 px-2.5 py-0.5 rounded-lg uppercase tracking-tight animate-pulse flex items-center gap-1.5 shadow-[1px_1px_0px_0px_rgba(15,23,42,1)] select-none">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  Draft Auto-Saved
                </span>
              )}
            </div>
            <textarea
              id="main-comment-input"
              rows={2}
              required
              placeholder="What are your thoughts on this topic?"
              value={newCommentText}
              onChange={(e) => setNewCommentText(e.target.value)}
              className="block w-full p-3 bg-slate-50 border-2 border-slate-900 rounded-xl text-xs focus:outline-none focus:bg-white text-slate-950 font-bold"
            />
          </div>
          <button
            id="main-comment-submit"
            type="submit"
            className="bento-button-primary px-5 py-3 shadow-[2px_2px_0px_0px_rgba(15,23,42,1)] text-xs font-black uppercase tracking-wide cursor-pointer transition-all active:scale-95 hover:translate-y-[-1px]"
          >
            Post Comment
          </button>
        </form>
      ) : (
        <div className="p-4 bg-orange-50 border-2 border-slate-900 rounded-2xl text-center text-xs text-slate-800 font-extrabold shadow-[2px_2px_0px_0px_rgba(15,23,42,1)]">
          Please sign in to leave nested replies and vote on comment scores.
        </div>
      )}

      {/* --- NESTED COMMENTS CONTAINER --- */}
      <div id="nested-comments-tree" className="space-y-4">
        {comments.map((comment) => (
          <CommentNode key={comment.id} node={comment} depth={0} />
        ))}
      </div>

      {/* --- REPORT DIALOG OVERLAY --- */}
      {reportTarget && (
        <div id="report-dialog" className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/45 backdrop-blur-sm font-sans">
          <div className="bg-white border-2 border-slate-900 text-slate-955 rounded-3xl w-full max-w-md p-6 shadow-[6px_6px_0px_0px_rgba(15,23,42,1)]">
            <h3 className="text-sm font-display font-black text-slate-900 border-b-2 border-slate-900 pb-3 flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-orange-605 animate-pulse stroke-[2.5]" />
              <span className="uppercase tracking-wide">Submit Report Abuse Ticket</span>
            </h3>

            {reportSubmitted ? (
              <div className="py-6 text-center text-xs text-emerald-600 font-black space-y-2">
                <CheckCircle2 className="w-10 h-10 mx-auto animate-bounce text-emerald-600 stroke-[2.5]" />
                <p>Report has been successfully submitted to Moderators!</p>
              </div>
            ) : (
              <div className="py-4 space-y-4 text-xs font-bold text-slate-700">
                <p className="uppercase tracking-wider text-[10px] text-slate-400">Why are you flagging this target content?</p>
                
                <textarea
                  id="report-reason-input"
                  rows={3}
                  required
                  placeholder="e.g. contains harassment, offensive remarks, or keyword spam..."
                  value={reportReason}
                  onChange={(e) => setReportReason(e.target.value)}
                  className="block w-full p-3 bg-slate-50 border-2 border-slate-900 rounded-xl focus:outline-none focus:bg-white text-slate-950"
                />

                <div className="flex gap-3 justify-end pt-2">
                  <button
                    id="report-cancel-btn"
                    type="button"
                    onClick={() => setReportTarget(null)}
                    className="px-4 py-2 rounded-xl border-2 border-slate-900 text-slate-700 text-xs font-black uppercase tracking-wide hover:bg-slate-50 cursor-pointer"
                  >
                    Cancel
                  </button>

                  <button
                    id="report-confirm-btn"
                    type="button"
                    onClick={submitReportHandler}
                    className="px-4 py-2 rounded-xl bg-orange-600 hover:bg-orange-700 text-white text-xs font-black uppercase border-2 border-slate-900 shadow-[2px_2px_0px_0px_rgba(15,23,42,1)] tracking-wide transition-all duration-150 cursor-pointer"
                  >
                    Send Report
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
}
