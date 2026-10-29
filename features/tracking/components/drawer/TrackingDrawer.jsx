import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { FiX, FiMail, FiBriefcase, FiUser, FiActivity, FiLayers, FiFileText } from 'react-icons/fi';
import { closeDrawer, fetchApplicationDetails } from '../../trackingSlice';


export default function TrackingDrawer() {
    const dispatch = useDispatch();
    const { isDrawerOpen, selectedApplicationId, selectedApplicationDetails, loading } = useSelector(state => state.tracking);
    const [showEmail, setShowEmail] = useState(false);

    useEffect(() => {
        if (isDrawerOpen && selectedApplicationId) {
            dispatch(fetchApplicationDetails(selectedApplicationId));
        }
    }, [isDrawerOpen, selectedApplicationId, dispatch]);

    useEffect(() => {
        setShowEmail(false);
    }, [selectedApplicationId]);

    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'Escape' && isDrawerOpen) {
                dispatch(closeDrawer());
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isDrawerOpen, dispatch]);

    const statusStyles = {
        "Replied": { bg: "bg-emerald-50", border: "border-emerald-200", dot: "bg-emerald-500", text: "text-emerald-600" },
        "Sent": { bg: "bg-blue-50", border: "border-blue-200", dot: "bg-blue-500", text: "text-blue-600" },
        "Interview": { bg: "bg-violet-50", border: "border-violet-200", dot: "bg-violet-500", text: "text-violet-600" },
        "Rejected": { bg: "bg-red-50", border: "border-red-200", dot: "bg-red-500", text: "text-red-600" },
        "Closed": { bg: "bg-surface", border: "border-border", dot: "bg-gray-400", text: "text-text" },
        "Draft": { bg: "bg-gray-50", border: "border-gray-200", dot: "bg-gray-400", text: "text-gray-600" },
    };

    const data = selectedApplicationDetails;
    const ss = data ? (statusStyles[data.status] || statusStyles["Sent"]) : statusStyles["Draft"];

    return (
        <div className={`fixed top-0 right-0 h-screen w-full sm:w-[480px] bg-background border-l border-border/60 shadow-2xl z-50 transform transition-transform duration-300 ease-in-out flex flex-col ${isDrawerOpen ? 'translate-x-0' : 'translate-x-full'}`}>
            
            {/* Header (Sticky) */}
            <div className="flex flex-col border-b border-border/50 bg-surface/30 p-5 shrink-0 sticky top-0 z-10 backdrop-blur-md">
                <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-background border border-border flex items-center justify-center text-[18px] font-extrabold text-text-dark shadow-sm">
                            {data ? data.letter : ''}
                        </div>
                        <div>
                            <h2 className={`text-[20px] font-bold text-text-dark tracking-tight leading-tight`}>
                                {data ? data.company : 'Loading...'}
                            </h2>
                            <div className="flex items-center gap-2 mt-1">
                                <FiBriefcase size={12} className="text-muted" />
                                <span className="text-[12px] font-medium text-muted">{data ? data.role : '...'}</span>
                            </div>
                        </div>
                    </div>
                    <button 
                        onClick={() => dispatch(closeDrawer())}
                        className="p-2 rounded-lg bg-background border border-border/50 text-muted hover:text-text-dark hover:bg-surface transition-colors cursor-pointer"
                    >
                        <FiX size={16} />
                    </button>
                </div>

                {data && (
                    <div className="flex flex-wrap items-center gap-3">
                        <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 ${ss.bg} border ${ss.border} rounded-full`}>
                            <div className={`w-1.5 h-1.5 rounded-full ${ss.dot}`} />
                            <span className={`text-[11px] font-extrabold tracking-wide ${ss.text}`}>{data.status}</span>
                        </div>
                        {data.campaignName && (
                            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-surface border border-border rounded-full">
                                <span className="text-[11px] font-bold text-muted">Campaign:</span>
                                <span className="text-[11px] font-bold text-text">{data.campaignName}</span>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto p-5 flex flex-col gap-6">
                {loading.details || !data ? (
                    <div className="flex flex-col gap-4 animate-pulse">
                        <div className="h-24 bg-surface rounded-xl border border-border"></div>
                        <div className="h-40 bg-surface rounded-xl border border-border"></div>
                        <div className="h-32 bg-surface rounded-xl border border-border"></div>
                    </div>
                ) : (
                    <>
                        {/* HR Contact info */}
                        <div className="bg-background border border-border/60 rounded-xl p-4 shadow-sm">
                            <h3 className="text-[12px] font-bold text-muted tracking-wider uppercase mb-3 flex items-center gap-2">
                                <FiUser size={13} /> HR Contact
                            </h3>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <p className="text-[11px] text-muted font-medium mb-0.5">Name</p>
                                    <p className="text-[13px] font-bold text-text-dark">{data.hrName}</p>
                                </div>
                                <div>
                                    <p className="text-[11px] text-muted font-medium mb-0.5">Email</p>
                                    <div className="flex items-center gap-1.5">
                                        <FiMail size={12} className="text-muted" />
                                        <p className="text-[13px] font-bold text-text-dark truncate">{data.hrEmail}</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Application Overview */}
                        <div className="bg-background border border-border/60 rounded-xl p-4 shadow-sm">
                            <h3 className="text-[12px] font-bold text-muted tracking-wider uppercase mb-3 flex items-center gap-2">
                                <FiLayers size={13} /> Overview
                            </h3>
                            <div className="grid grid-cols-2 gap-y-4 gap-x-4">
                                <div>
                                    <p className="text-[11px] text-muted font-medium mb-0.5">Date Created</p>
                                    <p className="text-[13px] font-semibold text-text">{data.dateCreated}</p>
                                </div>
                                <div>
                                    <p className="text-[11px] text-muted font-medium mb-0.5">Last Updated</p>
                                    <p className="text-[13px] font-semibold text-text">{data.lastUpdated}</p>
                                </div>
                                <div className="col-span-2 pt-3 border-t border-border/50">
                                    <div className="flex justify-between items-center mb-2">
                                        <span className="text-[12px] font-semibold text-text-dark">Follow-ups Completed</span>
                                        <span className="text-[12px] font-bold text-primary">
                                            {data.followUp.completed}{data.followUp.total ? ` / ${data.followUp.total}` : ''}
                                        </span>
                                    </div>
                                    {data.followUp.total ? (
                                        <div className="w-full h-1.5 bg-surface rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-primary rounded-full transition-all duration-500"
                                                style={{ width: `${(data.followUp.completed / data.followUp.total) * 100}%` }}
                                            />
                                        </div>
                                    ) : null}
                                    <p className="text-[11px] text-muted font-medium mt-2">Next follow-up: {data.followUp.nextDate}</p>
                                </div>
                            </div>
                        </div>

                        {/* Timeline */}
                        <div className="bg-background border border-border/60 rounded-xl p-5 shadow-sm">
                            <h3 className="text-[12px] font-bold text-muted tracking-wider uppercase mb-5 flex items-center gap-2">
                                <FiActivity size={13} /> Activity Timeline
                            </h3>
                            <div className="relative pl-3">
                                {/* Vertical line */}
                                <div className="absolute left-[15px] top-2 bottom-2 w-px bg-border/60" />
                                
                                {data.timeline.length > 0 ? data.timeline.map((event, index) => {
                                    // Map icon string to actual icon components if needed, or use a generic one
                                    const isLast = index === data.timeline.length - 1;
                                    return (
                                        <div key={event.id} className={`relative flex gap-4 ${isLast ? '' : 'mb-6'}`}>
                                            <div className="w-8 h-8 rounded-full bg-surface border-2 border-background flex items-center justify-center shrink-0 z-10 text-primary mt-0.5 shadow-sm">
                                                <div className="w-2 h-2 rounded-full bg-primary" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex justify-between items-start gap-2 mb-1">
                                                    <p className="text-[13px] font-bold text-text-dark">{event.title}</p>
                                                    <span className="text-[10px] font-semibold text-muted shrink-0 mt-0.5">{event.timestamp}</span>
                                                </div>
                                                <p className="text-[12px] text-text font-medium leading-relaxed">{event.description}</p>
                                            </div>
                                        </div>
                                    );
                                }) : (
                                    <p className="text-[12px] text-muted">No activity logs found.</p>
                                )}
                            </div>
                        </div>

                        {/* Sent Email Preview */}
                        {showEmail && data?.email && (
                            <div className="bg-background border border-border/60 rounded-xl p-4 shadow-sm">
                                <h3 className="text-[12px] font-bold text-muted tracking-wider uppercase mb-3 flex items-center gap-2">
                                    <FiMail size={13} /> Sent Email
                                </h3>
                                <p className="text-[13px] font-bold text-text-dark mb-1">{data.email.subject}</p>
                                <p className="text-[11px] text-muted font-medium mb-3">Sent {data.email.sentAt || '—'}</p>
                                <div className="text-[13px] text-text font-medium leading-relaxed whitespace-pre-wrap bg-surface/50 p-3 rounded-lg border border-border/40 max-h-64 overflow-y-auto">
                                    {data.email.body}
                                </div>
                            </div>
                        )}

                        {/* Notes Section Placeholder */}
                        <div className="bg-background border border-border/60 rounded-xl p-4 shadow-sm mb-4">
                            <h3 className="text-[12px] font-bold text-muted tracking-wider uppercase mb-3 flex items-center gap-2">
                                <FiFileText size={13} /> Internal Notes
                            </h3>
                            {data.notes ? (
                                <p className="text-[13px] text-text font-medium bg-surface/50 p-3 rounded-lg border border-border/40">{data.notes}</p>
                            ) : (
                                <p className="text-[12px] text-muted italic">No internal notes added yet.</p>
                            )}
                            <button className="mt-3 text-[12px] font-bold text-primary hover:underline">
                                + Add Note
                            </button>
                        </div>
                    </>
                )}
            </div>

            {/* Quick Actions Footer */}
            <div className="p-4 border-t border-border/50 bg-background shrink-0 flex gap-2">
                <button
                    onClick={() => setShowEmail(prev => !prev)}
                    disabled={!data?.email}
                    className="flex-1 py-2.5 bg-primary text-white rounded-xl text-[13px] font-bold hover:bg-primary/90 shadow-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {showEmail ? 'Hide Email' : 'View Email'}
                </button>
            </div>

        </div>
    );
}
