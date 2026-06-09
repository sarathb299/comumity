/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { User, Report, PlatformAnalytics, UserRole, UserStatus } from '../types';
import { 
  ShieldCheck, ShieldAlert, CheckCircle, Trash2, Shield, 
  Ban, RefreshCcw, Database, AlertCircle, Info, ChevronRight, BarChart2 
} from 'lucide-react';

interface AdminPanelProps {
  currentUser: User;
  onNavigate: (view: string) => void;
}

export default function AdminPanel({ currentUser, onNavigate }: AdminPanelProps) {
  const [users, setUsers] = useState<User[]>([]);
  const [reports, setReports] = useState<Report[]>([]);
  const [analytics, setAnalytics] = useState<PlatformAnalytics | null>(null);
  const [dbStatus, setDbStatus] = useState<{ isFallback: boolean; statusMessage: string; dbFileLocation: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [submittingId, setSubmittingId] = useState<string | null>(null);

  const fetchAdminData = async () => {
    setLoading(true);
    try {
      const [uRes, rRes, aRes, dRes] = await Promise.all([
        fetch('/api/admin/users'),
        fetch('/api/reports'),
        fetch('/api/admin/analytics'),
        fetch('/api/db-get-status')
      ]);

      if (uRes.ok) setUsers(await uRes.json());
      if (rRes.ok) setReports(await rRes.json());
      if (aRes.ok) setAnalytics(await aRes.json());
      if (dRes.ok) setDbStatus(await dRes.json());
    } catch (err) {
      console.warn('Failed admin sync', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchAdminData();
  }, []);

  const handleUpdateUserStatus = async (targetUserId: string, newRole?: UserRole, newStatus?: UserStatus) => {
    setSubmittingId(targetUserId);
    try {
      const res = await fetch('/api/admin/users/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentUserId: currentUser.id,
          targetUserId,
          newRole,
          newStatus
        })
      });

      if (res.ok) {
        // Refresh
        await fetchAdminData();
      } else {
        const errorData = await res.json();
        alert(errorData.error || 'Failed updating status');
      }
    } catch (err) {
      console.warn(err);
    } finally {
      setSubmittingId(null);
    }
  };

  const handleResolveReport = async (reportId: string, status: 'RESOLVED' | 'DISMISSED') => {
    try {
      const res = await fetch('/api/reports/resolve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reportId, status })
      });

      if (res.ok) {
        await fetchAdminData();
      }
    } catch (err) {
      console.warn(err);
    }
  };

  if (loading) {
    return (
      <div className="p-12 text-center text-gray-500 font-sans">
        <RefreshCcw className="w-8 h-8 text-orange-500 animate-spin mx-auto mb-3" />
        <p className="text-sm font-semibold">Synchronizing Administrator Cabin...</p>
      </div>
    );
  }

  // Calculate chart parameters for SVG charts
  const maxPostsTimeline = analytics ? Math.max(...analytics.activityTimeline.map(t => t.posts)) || 1 : 1;
  const maxCommentsTimeline = analytics ? Math.max(...analytics.activityTimeline.map(t => t.comments)) || 1 : 1;
  const postsByType = (analytics ? analytics.postsByType : {}) as Record<string, number>;

  return (
    <div id="admin-panel" className="flex-1 space-y-6 font-sans">
      
      {/* Admin Title Banner */}
      <div className="flex items-center justify-between gap-4 bg-slate-900 text-white p-6 rounded-3xl border-2 border-slate-900 shadow-[4px_4px_0px_0px_rgba(15,23,42,1)] relative overflow-hidden">
        <div className="flex items-center gap-3 relative z-10">
          <div className="p-2.5 bg-slate-800 rounded-xl border-2 border-slate-700">
            <ShieldCheck className="w-6 h-6 text-emerald-400 stroke-[2.5]" />
          </div>
          <div>
            <h1 className="text-sm font-display font-black text-white uppercase tracking-wider">CommunityHub Security Cabin</h1>
            <p className="text-[11px] text-slate-400 font-bold">Perform user auditing, check spam files, and read relational metrics</p>
          </div>
        </div>

        <button
          id="fetch-admin-data"
          onClick={() => void fetchAdminData()}
          className="p-2.5 bg-slate-800 hover:bg-slate-700 rounded-xl border-2 border-slate-700 text-white font-semibold flex items-center justify-center transition-all cursor-pointer shadow-[2px_2px_0px_0px_rgba(255,255,255,1)]"
          title="Refresh statistics"
        >
          <RefreshCcw className="w-4 h-4 text-emerald-400 stroke-[2.5]" />
        </button>
      </div>

      {/* Database Connection indicator guide box */}
      {dbStatus && (
        <div className={`p-5 rounded-3xl border-2 border-slate-900 flex gap-4 shadow-[3px_3px_0px_0px_rgba(15,23,42,1)] ${
          dbStatus.isFallback 
          ? 'bg-amber-15 px-6 py-4' 
          : 'bg-emerald-15 px-6 py-4'
        }`}>
          <div className="p-2.5 bg-white rounded-xl border-2 border-slate-900 self-start shadow-[2px_2px_0px_0px_rgba(15,23,42,1)]">
            <Database className={`w-5 h-5 stroke-[2.5] ${dbStatus.isFallback ? 'text-amber-650' : 'text-emerald-700'}`} />
          </div>
          <div className="space-y-1.5 text-xs text-slate-850">
            <h4 className="font-black font-display uppercase tracking-wider flex items-center gap-1.5">
              <span>Relational Host Status:</span>
              <span className={`px-2.5 py-0.5 rounded-lg text-[9px] font-black uppercase border-2 ${dbStatus.isFallback ? 'bg-amber-100 border-amber-950 text-amber-800' : 'bg-emerald-100 border-emerald-950 text-emerald-800'}`}>
                {dbStatus.isFallback ? 'Integrated Fallback Active' : 'MySQL Cloud Engaged'}
              </span>
            </h4>
            <p className="text-slate-700 leading-relaxed max-w-2xl font-bold">
              {dbStatus.statusMessage}
            </p>
            {dbStatus.isFallback && (
              <div className="bg-white/95 border-2 border-amber-900 rounded-2xl p-4.5 mt-2.5 font-sans text-xs text-slate-800 leading-relaxed max-w-2xl space-y-2.5 shadow-[2px_2px_0px_0px_rgba(15,23,42,1)]">
                <span className="font-black text-amber-800 uppercase tracking-widest text-[10px] block border-b border-amber-900/25 pb-1">⚡ How to Solve Hostinger / phpMyAdmin Remote Connection Issues:</span>
                <p className="font-bold text-slate-700">Hostinger blocks database requests from external servers (this App container) by default. Follow these steps to grant permission:</p>
                <ol className="list-decimal pl-5 space-y-1.5 font-bold text-slate-700">
                  <li>Log in to your <span className="text-amber-900">Hostinger hPanel</span> dashboard.</li>
                  <li>In the sidebar, navigate to <span className="text-amber-900">Databases</span> &gt; <span className="text-amber-900">Remote MySQL</span>.</li>
                  <li>In the <span className="font-extrabold text-slate-900">IP (IPv4 or IPv6) or Host</span> field, enter:
                    <ul className="list-disc pl-5 mt-1 space-y-1">
                      <li>Type <code className="bg-slate-100 text-indigo-700 font-mono px-1.5 py-0.5 rounded font-black">%</code> (this acts as a wildcard, allowing connections from any IP - highly recommended as cloud addresses spin up dynamically).</li>
                      <li>Or, type <code className="bg-slate-100 text-indigo-700 font-mono px-1.5 py-0.5 rounded font-black">2600:1900:0:3803::f00</code> to authorize this specific container node alone.</li>
                    </ul>
                  </li>
                  <li>Choose the database <code className="bg-slate-100 text-slate-900 font-mono px-1 rounded font-black">u923048970_community_data</code> in the dropdown selection.</li>
                  <li>Click <span className="bg-emerald-600 text-white px-2 py-0.5 rounded text-[10px] font-black uppercase">Create</span> / <span className="bg-emerald-600 text-white px-2 py-0.5 rounded text-[10px] font-black uppercase">Add Host</span> to save.</li>
                </ol>
                <div className="pt-1.5 border-t border-amber-900/25 text-[11px] text-slate-500 font-medium">
                  Once set up, Hostinger-hosted phpMyAdmin will seamlessly allow secure queries from this app. In the meantime, the application continues to run on a fully featured, locally persistent JSON backup!
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Core telemetry stats grid */}
      {analytics && (
        <div id="analytics-grid" className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'Active Sessions (DAU)', val: analytics.dau, spec: '75% Active Ratio' },
            { label: 'Total Topics Created', val: analytics.postsCreated, spec: `Growth at +${analytics.growthRate}%` },
            { label: 'Comments Published', val: analytics.commentsCreated, spec: 'Nested Unlimited' },
            { label: 'Sub Hubs Launched', val: analytics.communitiesCount, spec: 'Niche Subreddits' }
          ].map((item, idx) => (
            <div key={idx} className="bg-white p-5 bento-card select-none">
              <span className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5 font-display">{item.label}</span>
              <div className="text-2xl font-display font-black text-slate-950 tracking-tight leading-none mb-1">
                {item.val}
              </div>
              <span className="text-[10px] text-slate-550 font-bold font-mono uppercase tracking-wide">{item.spec}</span>
            </div>
          ))}
        </div>
      )}

      {/* CUSTOM BESPOKE INTERACTIVE ANIMATED SVG ACTIVITY CHARTS */}
      {analytics && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Timeline Linear Metric Chart */}
          <div className="bg-white p-5 bento-card">
            <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest mb-4 flex items-center gap-1.5 font-display">
              <BarChart2 className="w-4 h-4 text-orange-600 stroke-[2.5]" />
              <span>Community Activity Timeline</span>
            </h3>

            {/* Handcrafted Responsive SVG Trend line */}
            <div className="relative w-full h-44 border-b-2 border-l-2 border-slate-900 pl-4 py-2 flex items-end bg-slate-50 rounded-bl-xl">
              {analytics.activityTimeline.map((item, index) => {
                const stepX = (100 / (analytics.activityTimeline.length - 1)) * index;
                const postH = (item.posts / maxPostsTimeline) * 80;
                const commentH = (item.comments / maxCommentsTimeline) * 80;

                return (
                  <div key={index} className="flex-1 flex flex-col items-center justify-end h-full relative group">
                    <div className="flex gap-1.5 w-full justify-center items-end h-5/6">
                      {/* Posts Bar */}
                      <div 
                        className="w-3 bg-orange-500 rounded-t border-t-2 border-r-2 border-l-2 border-slate-900 group-hover:bg-orange-600 transition-all duration-300 shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]"
                        style={{ height: `${postH}%` }}
                        title={`${item.posts} Posts`}
                      />
                      {/* Comments Bar */}
                      <div 
                        className="w-3 bg-indigo-500 rounded-t border-t-2 border-r-2 border-l-2 border-slate-900 group-hover:bg-indigo-600 transition-all duration-300 shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]"
                        style={{ height: `${commentH}%` }}
                        title={`${item.comments} Comments`}
                      />
                    </div>
                    {/* Date label */}
                    <span className="text-[9px] font-black text-slate-500 font-mono mt-2 select-none uppercase">
                      {item.date}
                    </span>

                    {/* Pop value over hover */}
                    <div className="opacity-0 group-hover:opacity-100 absolute -top-5 bg-slate-900 text-white rounded-lg text-[8px] p-1 border border-slate-700 pointer-events-none transition-all duration-150 font-mono font-bold whitespace-nowrap z-30">
                      P: {item.posts} | C: {item.comments}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="flex gap-4 mt-3 justify-center text-[10px] font-black text-slate-650 uppercase">
              <div className="flex items-center gap-1">
                <div className="w-2.5 h-2.5 bg-orange-500 border border-slate-900 rounded" />
                <span>Posts</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-2.5 h-2.5 bg-indigo-500 border border-slate-900 rounded" />
                <span>Comments</span>
              </div>
            </div>
          </div>

          {/* Posts Category distribution Pie / Bar chart */}
          <div className="bg-white p-5 bento-card">
            <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest mb-4 font-display">
              Post Type Distribution
            </h3>

            <div className="space-y-3">
              {Object.entries(postsByType).map(([type, score]) => {
                const highestVal = Math.max(...Object.values(postsByType)) || 1;
                const widthPercent = (score / highestVal) * 100;
                
                const typeColors: Record<string, string> = {
                  TEXT: 'bg-indigo-500',
                  IMAGE: 'bg-emerald-500',
                  VIDEO: 'bg-amber-500',
                  LINK: 'bg-purple-500',
                  POLL: 'bg-orange-500'
                };
                const barColor = typeColors[type] || 'bg-slate-400';

                return (
                  <div key={type} className="text-xs font-black text-slate-700">
                    <div className="flex justify-between items-center mb-1 uppercase tracking-wide">
                      <span className="font-extrabold text-[10px] tracking-widest text-slate-900 font-display">{type}</span>
                      <span className="font-mono text-[10px] text-slate-500">{score} items</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden border-2 border-slate-900 shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]">
                      <div className={`${barColor} h-full border-r-2 border-slate-900 transition-all duration-500`} style={{ width: `${widthPercent}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Two lists: reports queue and user auditing lists */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
        
        {/* Reports audits module */}
        <div className="bg-white bento-card p-5 space-y-4">
          <h3 className="text-xs font-black text-red-605 uppercase tracking-widest flex items-center gap-1.5 font-display">
            <ShieldAlert className="w-4 h-4 text-red-650 stroke-[2.5]" />
            <span>Reports & Moderation Audits</span>
          </h3>

          <div className="space-y-3.5 max-h-96 overflow-y-auto custom-scrollbar">
            {reports.length === 0 ? (
              <div className="p-6 text-center text-xs font-bold text-slate-500 uppercase tracking-wider">
                All report queues cleared! Clean environment maintained.
              </div>
            ) : (
              reports.map((rep) => (
                <div key={rep.id} className="p-4 bg-slate-50 border-2 border-slate-900 rounded-xl space-y-2.5 font-sans text-xs shadow-[1.5px_1.5px_0px_0px_rgba(15,23,42,1)]">
                  <div className="flex justify-between items-center flex-wrap gap-2">
                    <span className="font-mono font-black text-[10px] uppercase text-slate-400">Report #{rep.id}</span>
                    <div className={`px-2 py-0.5 rounded-lg text-[9px] font-black uppercase border-2 ${
                      rep.status === 'PENDING' ? 'bg-amber-100 border-amber-950 text-amber-800' : 'bg-slate-200 border-slate-900 text-slate-650'
                    }`}>
                      {rep.status}
                    </div>
                  </div>

                  <div className="space-y-1.5 pr-1 text-slate-800 font-bold">
                    <p className="leading-relaxed">
                      <span className="text-slate-400 uppercase tracking-widest text-[9px]">Target Type:</span> {rep.target_type} ({rep.target_title})
                    </p>
                    <p className="p-2 bg-white rounded-lg border-2 border-slate-300 italic truncate max-w-full">
                      {rep.target_content}
                    </p>
                    <p className="text-red-700 leading-relaxed font-black mt-1.5">
                      <span className="text-slate-400 uppercase tracking-widest text-[9px]">Reason:</span> {rep.reason}
                    </p>
                  </div>

                  {rep.status === 'PENDING' && (
                    <div className="flex gap-2 justify-end pt-1">
                      <button
                        id={`dismiss-report-${rep.id}`}
                        onClick={() => handleResolveReport(rep.id, 'DISMISSED')}
                        className="px-3 py-1 bg-white border-2 border-slate-900 text-slate-700 rounded-lg hover:bg-slate-100 text-[10px] font-black uppercase tracking-wider cursor-pointer"
                      >
                        Dismiss
                      </button>
                      <button
                        id={`resolve-report-${rep.id}`}
                        onClick={() => handleResolveReport(rep.id, 'RESOLVED')}
                        className="px-3 py-1 bg-red-655 text-white border-2 border-slate-900 rounded-lg hover:bg-red-700 text-[10px] font-black uppercase tracking-wider cursor-pointer shadow-[1.5px_1.5px_0px_0px_rgba(15,23,42,1)]"
                      >
                        Sanction Target
                      </button>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        {/* User Role auditing module */}
        <div className="bg-white bento-card p-5 space-y-4">
          <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest flex items-center gap-1.5 font-display">
            <Shield className="w-4 h-4 text-indigo-650 stroke-[2.5]" />
            <span>Auditing Hub Memberships</span>
          </h3>

          <div className="space-y-3.5 max-h-96 overflow-y-auto custom-scrollbar">
            {users.map((item) => {
              const isMe = item.id === currentUser.id;
              return (
                <div key={item.id} className="flex items-center justify-between gap-3 p-3 bg-slate-50 border-2 border-slate-900 rounded-xl shadow-[1.5px_1.5px_0px_0px_rgba(15,23,42,1)]">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <img src={item.avatar} alt={item.username} className="w-8.5 h-8.5 rounded-full object-cover border-2 border-slate-900" />
                    <div className="min-w-0">
                      <p className="text-xs font-black text-slate-950 truncate uppercase tracking-tight">
                        u/{item.username} {isMe && <span className="text-[10px] text-orange-600 font-black font-sans">(Self)</span>}
                      </p>
                      <p className="text-[10px] text-slate-500 font-black font-sans uppercase tracking-wide">{item.role} • {item.karma} Karma</p>
                    </div>
                  </div>

                  <div className="flex gap-1.5">
                    {/* Role Adjustment Toggle */}
                    {!isMe && (
                      <select
                        id={`role-select-${item.id}`}
                        disabled={submittingId === item.id}
                        value={item.role}
                        onChange={(e) => handleUpdateUserStatus(item.id, e.target.value as UserRole, undefined)}
                        className="py-1 px-1.5 border-2 border-slate-900 rounded-lg text-[10px] font-black uppercase tracking-tight bg-white text-slate-705 cursor-pointer shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]"
                      >
                        <option value={UserRole.MEMBER}>Member</option>
                        <option value={UserRole.MODERATOR}>Mod</option>
                        <option value={UserRole.ADMIN}>Admin</option>
                      </select>
                    )}

                    {/* Suspend/Ban Status Option */}
                    {!isMe && (
                      <select
                        id={`status-select-${item.id}`}
                        disabled={submittingId === item.id}
                        value={item.status}
                        onChange={(e) => handleUpdateUserStatus(item.id, undefined, e.target.value as UserStatus)}
                        className={`py-1 px-1.5 border-2 rounded-lg text-[10px] font-black uppercase tracking-tight bg-white cursor-pointer shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] ${
                          item.status === 'ACTIVE' ? 'border-slate-900 text-slate-800' : 'border-red-900 text-red-655'
                        }`}
                      >
                        <option value={UserStatus.ACTIVE}>Active</option>
                        <option value={UserStatus.SUSPENDED}>Suspend</option>
                        <option value={UserStatus.BANNED}>Banned</option>
                      </select>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </div>

    </div>
  );
}
