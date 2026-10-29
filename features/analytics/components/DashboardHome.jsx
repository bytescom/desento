"use client"

import React, { useEffect, useState, useCallback } from 'react'
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import {
  FiBriefcase, FiSend, FiRepeat, FiThumbsUp,
  FiFileText, FiBell, FiArrowUpRight,
  FiChevronLeft, FiChevronRight, FiX,
  FiMail, FiUser, FiMessageSquare, FiCalendar,
  FiClock, FiAlertCircle,
} from 'react-icons/fi';
import { Playfair_Display } from "next/font/google";
import NotificationPanel from "@/components/layout/NotificationPanel";

const serif = Playfair_Display({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

// ─── Helpers ──────────────────────────────────────────────────────────────────

const STATUS_STYLES = {
  sent:             { dot: 'bg-primary',      badge: 'bg-primary/10 text-primary',         label: 'Sent' },
  'follow-up-sent': { dot: 'bg-amber-500',    badge: 'bg-amber-500/10 text-amber-600',     label: 'Follow-up' },
  replied:          { dot: 'bg-emerald-500',  badge: 'bg-emerald-500/10 text-emerald-600', label: 'Replied' },
  interview:        { dot: 'bg-blue-500',     badge: 'bg-blue-500/10 text-blue-600',       label: 'Interview' },
  rejected:         { dot: 'bg-red-500',      badge: 'bg-red-500/10 text-red-600',         label: 'Rejected' },
  closed:           { dot: 'bg-gray-400',     badge: 'bg-gray-100 text-gray-500',          label: 'Closed' },
  draft:            { dot: 'bg-gray-300',     badge: 'bg-gray-100 text-gray-500',          label: 'Draft' },
};

const REPLY_STYLES = {
  positive: 'bg-emerald-500/10 text-emerald-600 border-emerald-200',
  interview:'bg-blue-500/10 text-blue-600 border-blue-200',
  neutral:  'bg-amber-500/10 text-amber-600 border-amber-200',
  negative: 'bg-red-500/10 text-red-600 border-red-200',
};

function fmt(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function StatSkeleton() {
  return (
    <article className="bg-background px-4 py-3 rounded-xl border border-border min-h-[110px] flex flex-col justify-between animate-pulse">
      <div className="w-10 h-10 rounded-full bg-surface" />
      <div>
        <div className="h-2.5 w-20 bg-surface rounded mb-3" />
        <div className="h-6 w-12 bg-surface rounded" />
      </div>
    </article>
  );
}

function ActivitySkeleton() {
  return (
    <div className="flex flex-col gap-1 pt-1">
      {[...Array(5)].map((_, i) => (
        <div key={i} className="grid grid-cols-1 sm:grid-cols-[2fr_2fr_1fr_1fr] items-center px-4 py-4 border border-border rounded-lg animate-pulse">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-surface shrink-0" />
            <div className="flex flex-col gap-1.5 flex-1 min-w-0">
              <div className="h-3 bg-surface rounded w-32" />
              <div className="h-2.5 bg-surface rounded w-40" />
            </div>
          </div>
          <div className="hidden sm:block h-3 bg-surface rounded w-28 ml-2" />
          <div className="hidden sm:block h-5 bg-surface rounded w-14" />
          <div className="hidden sm:block h-3 bg-surface rounded w-16 ml-auto" />
        </div>
      ))}
    </div>
  );
}

// ─── Detail Modal (right slide-over) ──────────────────────────────────────────

function DetailModal({ app, onClose }) {
  const s = STATUS_STYLES[app.status] || STATUS_STYLES.draft;
  const replyStyle = app.replyType ? REPLY_STYLES[app.replyType] : null;

  // Close on Escape
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);

  // Prevent body scroll while open
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/30 backdrop-blur-[2px] z-[60]"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Slide-over panel */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label={`${app.company} application details`}
        className="fixed inset-y-0 right-0 z-[70] w-full max-w-md bg-background border-l border-border shadow-2xl flex flex-col animate-slide-in-right"
        style={{ animation: 'slideInRight 0.25s cubic-bezier(0.16,1,0.3,1)' }}
      >
        {/* Header */}
        <div className="flex items-start justify-between p-6 border-b border-border shrink-0">
          <div className="flex items-center gap-4 min-w-0">
            <div className="w-12 h-12 rounded-xl bg-surface border border-border flex items-center justify-center shrink-0">
              <span className="font-extrabold text-text-dark text-[20px]">{app.logo}</span>
            </div>
            <div className="min-w-0">
              <h2 className={`text-[18px] font-bold text-text-dark truncate ${serif.className}`}>{app.company}</h2>
              <p className="text-[13px] text-muted font-medium truncate">{app.role}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-text hover:bg-surface hover:text-primary transition-colors shrink-0 ml-2 cursor-pointer"
            aria-label="Close"
          >
            <FiX size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-5">

          {/* Status + Reply badges */}
          <div className="flex flex-wrap gap-2">
            <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[12px] font-bold border ${s.badge} border-current/20`}>
              <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
              {s.label}
            </span>
            {app.replyType && (
              <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-[12px] font-bold border ${replyStyle}`}>
                {app.replyType.charAt(0).toUpperCase() + app.replyType.slice(1)} reply
              </span>
            )}
          </div>

          {/* HR Contact */}
          <div className="bg-surface rounded-xl border border-border p-4 flex flex-col gap-2">
            <p className="text-[11px] font-extrabold text-muted tracking-[0.1em] uppercase mb-1">HR Contact</p>
            {app.hrName && (
              <div className="flex items-center gap-2 text-[13px]">
                <FiUser size={14} className="text-muted shrink-0" />
                <span className="font-semibold text-text-dark">{app.hrName}</span>
              </div>
            )}
            <div className="flex items-center gap-2 text-[13px]">
              <FiMail size={14} className="text-muted shrink-0" />
              <a href={`mailto:${app.hrEmail}`} className="font-medium text-primary hover:underline truncate">{app.hrEmail}</a>
            </div>
          </div>

          {/* Timeline */}
          <div className="bg-surface rounded-xl border border-border p-4 flex flex-col gap-3">
            <p className="text-[11px] font-extrabold text-muted tracking-[0.1em] uppercase mb-1">Timeline</p>
            <div className="flex items-center gap-2 text-[13px]">
              <FiCalendar size={14} className="text-muted shrink-0" />
              <span className="text-text font-medium">Applied on</span>
              <span className="font-bold text-text-dark ml-auto">{app.sentDate}</span>
            </div>
            {app.lastActionDate && (
              <div className="flex items-center gap-2 text-[13px]">
                <FiClock size={14} className="text-muted shrink-0" />
                <span className="text-text font-medium">Last action</span>
                <span className="font-bold text-text-dark ml-auto">{fmt(app.lastActionDate)}</span>
              </div>
            )}
            {app.followUpDate && (
              <div className="flex items-center gap-2 text-[13px]">
                <FiRepeat size={14} className="text-amber-500 shrink-0" />
                <span className="text-text font-medium">Follow-up scheduled</span>
                <span className="font-bold text-amber-600 ml-auto">{fmt(app.followUpDate)}</span>
              </div>
            )}
            {app.followUpCount > 0 && (
              <div className="flex items-center gap-2 text-[13px]">
                <FiRepeat size={14} className="text-muted shrink-0" />
                <span className="text-text font-medium">Follow-ups sent</span>
                <span className="font-bold text-text-dark ml-auto">{app.followUpCount}</span>
              </div>
            )}
          </div>

          {/* Reply preview */}
          {app.lastReplyPreview && (
            <div className="bg-surface rounded-xl border border-border p-4">
              <div className="flex items-center gap-2 mb-2">
                <FiMessageSquare size={14} className="text-muted" />
                <p className="text-[11px] font-extrabold text-muted tracking-[0.1em] uppercase">Last Reply</p>
                {app.replyConfidence != null && (
                  <span className="ml-auto text-[11px] font-bold text-muted">
                    {Math.round(app.replyConfidence * 100)}% confidence
                  </span>
                )}
              </div>
              <p className="text-[13px] text-text font-medium leading-relaxed italic">
                &ldquo;{app.lastReplyPreview}&rdquo;
              </p>
            </div>
          )}

          {/* Notes */}
          {app.notes && (
            <div className="bg-surface rounded-xl border border-border p-4">
              <div className="flex items-center gap-2 mb-2">
                <FiAlertCircle size={14} className="text-muted" />
                <p className="text-[11px] font-extrabold text-muted tracking-[0.1em] uppercase">Notes</p>
              </div>
              <p className="text-[13px] text-text font-medium leading-relaxed">{app.notes}</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-border shrink-0">
          <Link
            href="/dashboard/tracking"
            onClick={onClose}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-primary text-white text-[13px] font-bold rounded-xl hover:opacity-90 transition-opacity"
          >
            View in Tracking <FiArrowUpRight size={15} />
          </Link>
        </div>
      </div>

      <style jsx global>{`
        @keyframes slideInRight {
          from { transform: translateX(100%); opacity: 0; }
          to   { transform: translateX(0);    opacity: 1; }
        }
      `}</style>
    </>
  );
}

// ─── Main Dashboard ───────────────────────────────────────────────────────────

const LIMIT = 20;

const Dashboard = () => {
  const { data: session } = useSession();

  const [stats, setStats]           = useState(null);
  const [activityLog, setActivityLog] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, totalActivity: 0 });
  const [overview, setOverview]     = useState(null);
  const [loading, setLoading]       = useState(true);
  const [pageLoading, setPageLoading] = useState(false);
  const [error, setError]           = useState(null);
  const [selectedApp, setSelectedApp] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);

  const fetchDashboard = useCallback(async (page = 1, isInitial = false) => {
    try {
      if (isInitial) setLoading(true);
      else setPageLoading(true);

      const res = await fetch(`/api/dashboard?page=${page}&limit=${LIMIT}`);
      if (!res.ok) throw new Error('Failed to load dashboard data');
      const data = await res.json();

      if (isInitial) {
        setStats(data.stats);
        setOverview(data.overview);
      }
      setActivityLog(data.activityLog || []);
      setPagination(data.pagination || { page, totalPages: 1, totalActivity: 0 });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
      setPageLoading(false);
    }
  }, []);

  useEffect(() => { fetchDashboard(1, true); }, [fetchDashboard]);

  const goToPage = (p) => {
    if (p < 1 || p > pagination.totalPages || pageLoading) return;
    setCurrentPage(p);
    fetchDashboard(p);
  };

  const firstName = session?.user?.name?.split(' ')[0] || 'there';

  const quickStats = stats
    ? [
        { title: "Total Leads",     value: stats.totalLeads.toLocaleString(),    icon: <FiBriefcase size={18} />, colorClass: "bg-primary/10 border-primary/20 text-primary",      stroke: "var(--color-primary)",   graphPoints: "0,15 10,10 20,12 30,5 40,2" },
        { title: "Total Sent",      value: stats.totalSent.toLocaleString(),     icon: <FiSend size={18} />,      colorClass: "bg-secondary/10 border-secondary/20 text-secondary", stroke: "var(--color-secondary)", graphPoints: "0,12 10,8 20,10 30,5 40,2" },
        { title: "Follow-ups Sent", value: stats.followUpsSent.toLocaleString(), icon: <FiRepeat size={18} />,    colorClass: "bg-amber-500/10 border-amber-500/20 text-amber-600",  stroke: "#f59e0b",                graphPoints: "0,18 10,14 20,10 30,6 40,2" },
        { title: "Good Replies",    value: stats.goodReplies.toLocaleString(),   icon: <FiThumbsUp size={18} />,  colorClass: "bg-emerald-500/10 border-emerald-500/20 text-emerald-600", stroke: "#10b981",           graphPoints: "0,18 10,12 20,10 30,8 40,2" },
      ]
    : null;

  // Pagination page numbers
  const pageNumbers = (() => {
    const { totalPages } = pagination;
    if (totalPages <= 5) return Array.from({ length: totalPages }, (_, i) => i + 1);
    if (currentPage <= 3) return [1, 2, 3, 4, '…', totalPages];
    if (currentPage >= totalPages - 2) return [1, '…', totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
    return [1, '…', currentPage - 1, currentPage, currentPage + 1, '…', totalPages];
  })();

  return (
    <>
      {/* ── Header ── */}
      <header className="flex items-center justify-between">
        <h1 className={`text-[32px] md:text-[36px] font-bold text-text-dark leading-[1.1] tracking-tight ${serif.className}`}>
          Dashboard
        </h1>
        <div className="flex items-center gap-2">
          <NotificationPanel isOpen={true} mobileOpen={false} />
        </div>
      </header>

      {error && (
        <div className="px-4 py-3 rounded-xl border border-red-200 bg-red-50 text-red-600 text-[13px] font-medium">
          ⚠️ {error}
        </div>
      )}

      {/* ── Quick Stats ── */}
      <section aria-label="Quick Stats" className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {loading
          ? [...Array(4)].map((_, i) => <StatSkeleton key={i} />)
          : quickStats?.map((stat, i) => (
              <article key={i} className="bg-background px-4 py-3 rounded-xl border border-border shadow-[0_2px_8px_-4px_rgba(0,0,0,0.02)] flex flex-col justify-between min-h-[110px] hover:-translate-y-0.5 transition-transform group">
                <div className="flex items-start justify-between mb-4">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center border ${stat.colorClass}`}>
                    {stat.icon}
                  </div>
                </div>
                <div>
                  <h3 className="text-[11px] text-muted font-bold tracking-[0.1em] uppercase mb-1.5">{stat.title}</h3>
                  <div className="flex items-end justify-between">
                    <p className="text-[22px] font-extrabold text-text-dark leading-none">{stat.value}</p>
                    <div className="w-16 h-6 opacity-70 group-hover:opacity-100 transition-opacity">
                      <svg viewBox="-2 -2 44 24" className="w-full h-full" preserveAspectRatio="none">
                        <polyline points={stat.graphPoints} fill="none" stroke={stat.stroke} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </div>
                  </div>
                </div>
              </article>
            ))}
      </section>

      {/* ── Platform Highlights + Activity Overview ── */}
      <section aria-label="Platform Highlights" className='flex flex-col xl:flex-row gap-5'>
        <article className="relative w-full xl:w-1/2 min-h-[200px] rounded-xl overflow-hidden p-8 flex flex-col justify-center items-start border border-border shadow-sm">
          <div className="absolute inset-0 bg-linear-to-r from-primary/5 to-secondary/5 opacity-90" />
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary/20 rounded-full blur-[80px]" />
          <div className="absolute bottom-0 left-32 w-48 h-48 bg-secondary/20 rounded-full blur-[60px]" />
          <div className={`relative z-10 max-w-sm ${serif.className}`}>
            <h2 className="text-[24px] lg:text-[28px] leading-[1.2] font-semibold text-text-dark mb-3 tracking-tight">
              Desento 3.0 launch will be live on 25&apos; July.
            </h2>
            <p className="text-[14px] text-text font-medium tracking-wide mb-6">
              Set a reminder and tune in live to catch all the latest updates.
            </p>
          </div>
        </article>

        <article className="w-full xl:w-1/2 bg-background p-6 sm:p-8 rounded-xl border border-border shadow-sm flex flex-col justify-between">
          <div className="flex items-start justify-between mb-8">
            <div>
              <h3 className="text-[22px] font-extrabold text-text-dark mb-1 tracking-tight">Activity Overview</h3>
              <p className="text-[14px] text-text font-medium">
                {loading ? '—' : `${(overview?.total || 0).toLocaleString()} total emails sent`}
              </p>
            </div>
            {!loading && overview && (overview.interviews > 0 || overview.replied > 0) && (
              <div className="flex items-center gap-1 text-[24px] font-extrabold text-text-dark">
                {Math.round(((overview.replied + overview.interviews) / Math.max(overview.total, 1)) * 100)}%
                <FiArrowUpRight size={22} className="text-emerald-500 ml-1" />
              </div>
            )}
          </div>
          <div>
            <div className="flex h-[18px] rounded-xl overflow-hidden mb-5">
              {loading ? (
                <div className="w-full bg-surface animate-pulse rounded-xl" />
              ) : (
                <>
                  <div className="bg-primary transition-all duration-1000 ease-out hover:opacity-90" style={{ width: `${overview?.sentPct || 0}%` }} />
                  <div className="bg-secondary transition-all duration-1000 ease-out hover:opacity-90" style={{ width: `${overview?.repliedPct || 0}%` }} />
                  <div className="bg-emerald-500 transition-all duration-1000 ease-out hover:opacity-90" style={{ width: `${overview?.interviewPct || 0}%` }} />
                  {(overview?.sentPct + overview?.repliedPct + overview?.interviewPct) < 100 && (
                    <div className="bg-surface flex-1" />
                  )}
                </>
              )}
            </div>
            <div className="flex items-center justify-between text-[11px] font-bold text-muted uppercase tracking-[0.1em]">
              <span className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-full bg-primary" />Sent <span className="text-text-dark ml-0.5">{loading ? '—' : overview?.sent ?? 0}</span></span>
              <span className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-full bg-secondary" />Replied <span className="text-text-dark ml-0.5">{loading ? '—' : overview?.replied ?? 0}</span></span>
              <span className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />Interviews <span className="text-text-dark ml-0.5">{loading ? '—' : overview?.interviews ?? 0}</span></span>
            </div>
          </div>
        </article>
      </section>

      {/* ── Activity Log ── */}
      <section aria-label="Activity Log" className='border border-border bg-background shadow-[0_2px_15px_-5px_rgba(0,0,0,0.03)] rounded-xl p-6 lg:p-8'>
        {/* Section header */}
        <div className="flex items-end justify-between mb-4 lg:mb-5">
          <div>
            <h3 className={`text-[20px] lg:text-[22px] font-medium text-text-dark mb-1 ${serif.className}`}>Activity Log</h3>
            <div className="flex items-center gap-2 flex-wrap">
              <p className="text-[13px] text-text font-medium">Last 7 days — applications, follow-ups & interviews.</p>
              {!loading && (
                <span className="text-[11px] font-bold text-muted bg-surface border border-border px-2 py-0.5 rounded-full">
                  {pagination.totalActivity} record{pagination.totalActivity !== 1 ? 's' : ''}
                </span>
              )}
            </div>
          </div>
          <Link
            href="/dashboard/tracking"
            className="text-[13px] font-semibold text-text-dark hover:text-primary transition-colors flex items-center gap-1"
          >
            See all <FiArrowUpRight size={14} />
          </Link>
        </div>

        {/* Column headers */}
        <div className="hidden sm:grid grid-cols-[2fr_2fr_1fr_1fr] px-4 pb-2 border-b border-border">
          <span className="text-[11px] font-extrabold text-muted tracking-[0.08em] uppercase">Company</span>
          <span className="text-[11px] font-extrabold text-muted tracking-[0.08em] uppercase">Role</span>
          <span className="text-[11px] font-extrabold text-muted tracking-[0.08em] uppercase">Status</span>
          <span className="text-[11px] font-extrabold text-muted tracking-[0.08em] uppercase text-right">Reply / Date</span>
        </div>

        {/* Rows */}
        {loading ? (
          <ActivitySkeleton />
        ) : activityLog.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-14 text-center">
            <div className="w-12 h-12 rounded-full bg-surface border border-border flex items-center justify-center mb-3">
              <FiFileText size={20} className="text-muted" />
            </div>
            <p className="text-[14px] font-semibold text-text-dark mb-1">No activity in the last 7 days</p>
            <p className="text-[13px] text-muted font-medium">Start an outreach campaign to see your activity here.</p>
          </div>
        ) : (
          <div className={`flex flex-col gap-1 pt-1 transition-opacity duration-200 ${pageLoading ? 'opacity-50 pointer-events-none' : 'opacity-100'}`}>
            {activityLog.map((log) => {
              const s = STATUS_STYLES[log.status] || STATUS_STYLES.draft;
              return (
                <button
                  key={log.id}
                  onClick={() => setSelectedApp(log)}
                  className="w-full text-left grid grid-cols-1 sm:grid-cols-[2fr_2fr_1fr_1fr] items-center px-4 py-4 border border-border rounded-lg hover:bg-surface hover:border-primary/30 transition-all cursor-pointer group"
                >
                  {/* Company */}
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-surface border border-border group-hover:border-primary/30 flex items-center justify-center shrink-0 transition-colors">
                      <span className="font-extrabold text-text text-[16px]">{log.logo}</span>
                    </div>
                    <div className="min-w-0">
                      <p className="text-[14px] font-bold text-text-dark truncate group-hover:text-primary transition-colors">{log.company}</p>
                      <p className="text-[12px] text-muted font-medium truncate">{log.hrEmail}</p>
                    </div>
                  </div>
                  {/* Role */}
                  <div className="hidden sm:flex items-center">
                    <p className="text-[14px] font-semibold text-text truncate">{log.role}</p>
                  </div>
                  {/* Status */}
                  <div className="hidden sm:flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full shrink-0 ${s.dot}`} />
                    <span className="text-[13px] font-semibold text-text">{s.label}</span>
                  </div>
                  {/* Reply + Date */}
                  <div className="hidden sm:flex flex-col items-end">
                    {log.replyType ? (
                      <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full border capitalize ${REPLY_STYLES[log.replyType] || ''}`}>
                        {log.replyType}
                      </span>
                    ) : (
                      <span className="text-[13px] font-bold text-muted">—</span>
                    )}
                    <span className="text-[11px] text-muted font-medium mt-1">{log.sentDate}</span>
                  </div>
                </button>
              );
            })}
          </div>
        )}

        {/* ── Pagination ── */}
        {!loading && pagination.totalPages > 1 && (
          <div className="flex items-center justify-between mt-5 pt-4 border-t border-border">
            <p className="text-[12px] text-muted font-medium">
              Page {currentPage} of {pagination.totalPages} &middot; {pagination.totalActivity} records
            </p>
            <div className="flex items-center gap-1">
              {/* Prev */}
              <button
                onClick={() => goToPage(currentPage - 1)}
                disabled={currentPage === 1 || pageLoading}
                className="w-8 h-8 rounded-lg border border-border flex items-center justify-center text-text hover:bg-surface hover:text-primary transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                aria-label="Previous page"
              >
                <FiChevronLeft size={15} />
              </button>

              {/* Page numbers */}
              {pageNumbers.map((p, i) =>
                p === '…' ? (
                  <span key={`ellipsis-${i}`} className="w-8 h-8 flex items-center justify-center text-[12px] text-muted select-none">…</span>
                ) : (
                  <button
                    key={p}
                    onClick={() => goToPage(p)}
                    disabled={pageLoading}
                    className={`w-8 h-8 rounded-lg border text-[12px] font-bold transition-colors cursor-pointer disabled:cursor-not-allowed ${
                      p === currentPage
                        ? 'bg-primary border-primary text-white'
                        : 'border-border text-text hover:bg-surface hover:text-primary'
                    }`}
                  >
                    {p}
                  </button>
                )
              )}

              {/* Next */}
              <button
                onClick={() => goToPage(currentPage + 1)}
                disabled={currentPage === pagination.totalPages || pageLoading}
                className="w-8 h-8 rounded-lg border border-border flex items-center justify-center text-text hover:bg-surface hover:text-primary transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                aria-label="Next page"
              >
                <FiChevronRight size={15} />
              </button>
            </div>
          </div>
        )}
      </section>

      {/* ── Detail Modal ── */}
      {selectedApp && (
        <DetailModal app={selectedApp} onClose={() => setSelectedApp(null)} />
      )}
    </>
  );
};

export default Dashboard;
