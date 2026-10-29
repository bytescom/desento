"use client";

import React, { useState, useRef, useEffect, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import { FiBell, FiCheckCircle, FiAlertCircle, FiInfo, FiMail, FiX, FiCheck } from "react-icons/fi";
import toast from "react-hot-toast";

const emptySubscribe = () => () => {};
const getSnapshot = () => true;
const getServerSnapshot = () => false;

// Map backend Notification.type -> UI style buckets
const typeStyleMap = {
    campaign: { icon: "success", bg: "bg-emerald-50 border-emerald-100" },
    hr_sync: { icon: "mail", bg: "bg-violet-50 border-violet-100" },
    security: { icon: "alert", bg: "bg-amber-50 border-amber-100" },
    system: { icon: "alert", bg: "bg-amber-50 border-amber-100" },
    info: { icon: "info", bg: "bg-sky-50 border-sky-100" },
};

const iconMap = {
    success: <FiCheckCircle className="text-emerald-500" size={16} />,
    info: <FiInfo className="text-sky-500" size={16} />,
    alert: <FiAlertCircle className="text-amber-500" size={16} />,
    mail: <FiMail className="text-violet-500" size={16} />,
};

function timeAgo(iso) {
    if (!iso) return "";
    const diff = Date.now() - new Date(iso).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "Just now";
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days}d ago`;
    return new Date(iso).toLocaleDateString("en-IN", { day: "2-digit", month: "short" });
}

export default function NotificationPanel() {
    const [open, setOpen] = useState(false);
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(false);
    const [panelStyle, setPanelStyle] = useState({});
    const mounted = useSyncExternalStore(emptySubscribe, getSnapshot, getServerSnapshot);
    const bellRef = useRef(null);
    const panelRef = useRef(null);

    const unreadCount = notifications.filter((n) => !n.isRead).length;

    const loadNotifications = async () => {
        setLoading(true);
        try {
            const res = await fetch("/api/notifications");
            if (res.ok) {
                const data = await res.json();
                setNotifications(data.notifications || []);
            }
        } catch {
            // keep current list on failure
        } finally {
            setLoading(false);
        }
    };

    // Load on mount (so the unread badge is accurate) and on every open
    useEffect(() => {
        if (mounted) loadNotifications();
    }, [mounted]);

    useEffect(() => {
        if (open) loadNotifications();
    }, [open]);

    // Recalculate panel position whenever open state changes
    useEffect(() => {
        if (!open || !bellRef.current) return;

        const calc = () => {
            const rect = bellRef.current?.getBoundingClientRect();
            if (!rect) return;

            const panelWidth = 340;
            const viewportWidth = window.innerWidth;

            // Flip left if it would overflow right edge
            let left = rect.left;
            if (left + panelWidth > viewportWidth - 8) {
                left = rect.right - panelWidth;
            }

            setPanelStyle({
                top: rect.bottom + 8,
                left: Math.max(8, left),
            });
        };

        calc();
        window.addEventListener("resize", calc);
        window.addEventListener("scroll", calc, true);
        return () => {
            window.removeEventListener("resize", calc);
            window.removeEventListener("scroll", calc, true);
        };
    }, [open]);

    // Close on outside click
    useEffect(() => {
        if (!open) return;
        function handleClickOutside(e) {
            if (
                panelRef.current && !panelRef.current.contains(e.target) &&
                bellRef.current && !bellRef.current.contains(e.target)
            ) {
                setOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [open]);

    const markAllRead = async () => {
        setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
        await fetch("/api/notifications", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({}) }).catch(() => {});
        toast.success("All notifications marked as read");
    };

    const dismiss = async (id) => {
        setNotifications((prev) => prev.filter((n) => n.id !== id));
        await fetch("/api/notifications", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) }).catch(() => {});
    };

    const markRead = async (id) => {
        setNotifications((prev) =>
            prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
        );
        await fetch("/api/notifications", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) }).catch(() => {});
    };

    const clearAll = async () => {
        setNotifications([]);
        await fetch("/api/notifications", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({}) }).catch(() => {});
        toast.success("All notifications cleared");
    };

    const dropdown = (
        <>
            {/* Backdrop */}
            <div
                style={{ position: "fixed", inset: 0, zIndex: 9998 }}
                onClick={() => setOpen(false)}
            />

            {/* Panel */}
            <div
                ref={panelRef}
                style={{
                    position: "fixed",
                    zIndex: 9999,
                    width: 340,
                    maxHeight: 480,
                    ...panelStyle,
                }}
                className="bg-background border border-border rounded-2xl shadow-2xl overflow-hidden flex flex-col"
            >
                {/* Header */}
                <div className="flex items-center justify-between px-4 py-3.5 border-b border-border bg-surface/60">
                    <div className="flex items-center gap-2">
                        <FiBell size={16} className="text-primary" />
                        <h3 className="text-[14px] font-bold text-text-dark">Notifications</h3>
                        {unreadCount > 0 && (
                            <span className="text-[11px] font-semibold bg-primary/10 text-primary px-1.5 py-0.5 rounded-full">
                                {unreadCount} new
                            </span>
                        )}
                    </div>
                    {unreadCount > 0 && (
                        <button
                            onClick={markAllRead}
                            className="text-[12px] font-semibold text-primary hover:text-primary/70 transition-colors flex items-center gap-1 cursor-pointer"
                        >
                            <FiCheck size={12} />
                            Mark all read
                        </button>
                    )}
                </div>

                {/* List */}
                <div className="overflow-y-auto flex-1 no-scrollbar">
                    {loading && notifications.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12 gap-3 text-center px-6">
                            <div className="w-12 h-12 rounded-full bg-surface flex items-center justify-center animate-pulse">
                                <FiBell size={22} className="text-muted" />
                            </div>
                            <p className="text-[12px] text-muted">Loading notifications…</p>
                        </div>
                    ) : notifications.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12 gap-3 text-center px-6">
                            <div className="w-12 h-12 rounded-full bg-surface flex items-center justify-center">
                                <FiBell size={22} className="text-muted" />
                            </div>
                            <p className="text-[13px] font-semibold text-text">All caught up!</p>
                            <p className="text-[12px] text-muted">No new notifications at the moment.</p>
                        </div>
                    ) : (
                        <ul className="divide-y divide-border/50">
                            {notifications.map((n) => {
                                const style = typeStyleMap[n.type] || typeStyleMap.info;
                                return (
                                <li
                                    key={n.id}
                                    onClick={() => !n.isRead && markRead(n.id)}
                                    className={`flex items-start gap-3 px-4 py-3.5 cursor-pointer group transition-colors ${
                                        n.isRead ? "hover:bg-surface/50" : "bg-primary/[0.03] hover:bg-primary/[0.06]"
                                    }`}
                                >
                                    {/* Icon badge */}
                                    <div className={`mt-0.5 shrink-0 w-7 h-7 rounded-lg border flex items-center justify-center ${style.bg}`}>
                                        {iconMap[style.icon]}
                                    </div>

                                    {/* Content */}
                                    <div className="flex-1 min-w-0">
                                        <p className={`text-[13px] leading-snug ${n.isRead ? "font-medium text-text" : "font-bold text-text-dark"}`}>
                                            {n.title}
                                        </p>
                                        <p className="text-[12px] text-muted mt-0.5 leading-relaxed">{n.message}</p>
                                        <p className="text-[11px] text-muted/60 mt-1 font-medium">{timeAgo(n.createdAt)}</p>
                                    </div>

                                    {/* Unread dot + dismiss */}
                                    <div className="flex flex-col items-center gap-2 shrink-0">
                                        {!n.isRead && (
                                            <span className="w-2 h-2 rounded-full bg-primary mt-1" />
                                        )}
                                        <button
                                            onClick={(e) => { e.stopPropagation(); dismiss(n.id); }}
                                            className="opacity-0 group-hover:opacity-100 p-1 rounded-lg hover:bg-surface text-muted hover:text-text-dark transition-all cursor-pointer"
                                            aria-label="Dismiss"
                                        >
                                            <FiX size={12} />
                                        </button>
                                    </div>
                                </li>
                                );
                            })}
                        </ul>
                    )}
                </div>

                {/* Footer */}
                {notifications.length > 0 && (
                    <div className="px-4 py-3 border-t border-border bg-surface/40">
                        <button
                            onClick={clearAll}
                            className="w-full text-[12px] font-semibold text-muted hover:text-red-500 transition-colors cursor-pointer"
                        >
                            Clear all notifications
                        </button>
                    </div>
                )}
            </div>
        </>
    );

    return (
        <>
            {/* Bell button */}
            <button
                ref={bellRef}
                onClick={() => setOpen((prev) => !prev)}
                className={`relative flex items-center justify-center w-9 h-9 rounded-xl border transition-all duration-200 cursor-pointer
                    ${open
                        ? "bg-primary border-primary text-white shadow-md shadow-primary/20"
                        : "bg-surface border-border text-primary hover:bg-primary/10 hover:border-primary/30"
                    }`}
                aria-label="Notifications"
            >
                <FiBell size={18} strokeWidth={1.8} />
                {unreadCount > 0 && (
                    <span className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] px-1 flex items-center justify-center bg-red-500 text-white text-[10px] font-bold rounded-full leading-none shadow-sm border-2 border-background">
                        {unreadCount > 9 ? "9+" : unreadCount}
                    </span>
                )}
            </button>

            {/* Portal dropdown — renders at document.body to escape backdrop-filter/overflow constraints */}
            {mounted && open && createPortal(dropdown, document.body)}
        </>
    );
}
