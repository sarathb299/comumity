/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Sparkles } from 'lucide-react';

interface SkeletonLoaderProps {
  idPrefix?: string;
  variant: 'feed-item' | 'feed-filter' | 'community-item' | 'community-sidebar-list';
  count?: number;
}

export default function SkeletonLoader({
  idPrefix = 'bento-skeleton',
  variant,
  count = 3
}: SkeletonLoaderProps) {
  if (variant === 'feed-filter') {
    return (
      <div 
        id={`${idPrefix}-filter-bar`} 
        className="bento-card p-3.5 bg-white border-2 border-slate-900 shadow-[3px_3px_0px_0px_rgba(15,23,42,1)] flex items-center justify-between animate-pulse"
      >
        <div className="flex gap-2.5">
          <div id={`${idPrefix}-filter-btn-1`} className="h-7 w-12 bg-slate-200 rounded-xl" />
          <div id={`${idPrefix}-filter-btn-2`} className="h-7 w-12 bg-slate-100 rounded-xl" />
          <div id={`${idPrefix}-filter-btn-3`} className="h-7 w-12 bg-slate-100 rounded-xl" />
        </div>
        <div id={`${idPrefix}-filter-indicator`} className="h-3 w-24 bg-slate-150 rounded" />
      </div>
    );
  }

  if (variant === 'feed-item') {
    return (
      <div id={`${idPrefix}-feed-items-container`} className="flex flex-col gap-6 w-full">
        {Array.from({ length: count }).map((_, idx) => (
          <div 
            id={`${idPrefix}-post-card-${idx}`}
            key={idx} 
            className="bento-card bg-white p-5 space-y-4 border-2 border-slate-900 shadow-[4px_4px_0px_0px_rgba(15,23,42,1)] animate-pulse relative overflow-hidden"
          >
            {/* Sparkle badge placeholder for AI accentuation */}
            <div className="absolute top-2 right-2 flex items-center gap-1 opacity-20">
              <Sparkles className="w-3.5 h-3.5 text-slate-400" />
            </div>

            <div className="flex items-center gap-3">
              {/* Community icon avatar frame */}
              <div id={`${idPrefix}-post-avatar-${idx}`} className="w-8 h-8 rounded-xl bg-slate-200 border-2 border-slate-900 shadow-[1px_1px_0px_0px_rgba(15,23,42,1)]" />
              <div className="space-y-1.5 flex-1">
                <div id={`${idPrefix}-post-header-line1-${idx}`} className="h-3 bg-slate-200 rounded w-1/4" />
                <div id={`${idPrefix}-post-header-line2-${idx}`} className="h-2 bg-slate-150 rounded w-1/3" />
              </div>
            </div>

            <div className="space-y-2 mt-4 pt-1">
              {/* Title representation */}
              <div id={`${idPrefix}-post-title-${idx}`} className="h-4.5 bg-slate-250 rounded w-5/6" />
              {/* Content representation body paragraphs */}
              <div id={`${idPrefix}-post-body-l1-${idx}`} className="h-3 bg-slate-150 rounded w-full" />
              <div id={`${idPrefix}-post-body-l2-${idx}`} className="h-3 bg-slate-150 rounded w-3/4" />
            </div>

            {/* Interactive footer line */}
            <div id={`${idPrefix}-post-footer-${idx}`} className="pt-3 border-t-2 border-slate-100 flex justify-between items-center bg-slate-50/50 -mx-5 -mb-5 p-5">
              <div className="flex gap-1.5">
                <div id={`${idPrefix}-post-footer-btn-1-${idx}`} className="w-14 h-7 bg-slate-200 rounded-xl border border-slate-350" />
                <div id={`${idPrefix}-post-footer-btn-2-${idx}`} className="w-14 h-7 bg-slate-200 rounded-xl border border-slate-350" />
              </div>
              <div id={`${idPrefix}-post-footer-saved-${idx}`} className="w-16 h-7 bg-slate-150 rounded-xl" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (variant === 'community-item') {
    return (
      <div id={`${idPrefix}-community-item-block`} className="flex items-center gap-3 animate-pulse">
        <div id={`${idPrefix}-community-logo`} className="w-9 h-9 rounded-xl bg-slate-200 border-2 border-slate-900 shadow-[1px_1px_0px_0px_rgba(15,23,42,1)]" />
        <div className="flex-1 space-y-1.5">
          <div id={`${idPrefix}-community-title`} className="h-3.5 bg-slate-200 rounded w-1/2" />
          <div id={`${idPrefix}-community-meta`} className="h-2.5 bg-slate-150 rounded w-1/3" />
        </div>
      </div>
    );
  }

  if (variant === 'community-sidebar-list') {
    return (
      <div id={`${idPrefix}-sidebar-list-container`} className="flex flex-col gap-3.5">
        {Array.from({ length: count }).map((_, idx) => (
          <div 
            id={`${idPrefix}-sidebar-item-${idx}`} 
            key={idx} 
            className="flex items-center gap-3 animate-pulse"
          >
            {/* Logo frame */}
            <div id={`${idPrefix}-sidebar-avatar-${idx}`} className="w-9 h-9 rounded-xl bg-slate-200 border-2 border-slate-900 shadow-[1px_1px_0px_0px_rgba(15,23,42,1)]" />
            {/* Detail lines */}
            <div className="flex-1 space-y-1.5">
              <div id={`${idPrefix}-sidebar-name-${idx}`} className="h-3.5 bg-slate-200 rounded w-1/2" />
              <div id={`${idPrefix}-sidebar-members-${idx}`} className="h-2.5 bg-slate-150 rounded w-1/3" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return null;
}
