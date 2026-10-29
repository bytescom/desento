"use client"
import React, { useState, useEffect, useRef } from 'react'
import {
    FiArrowLeft, FiCheck, FiMail, FiUsers, FiPaperclip,
    FiSettings, FiUpload, FiSearch, FiEdit2, FiX,
    FiChevronDown, FiAlertCircle, FiPlus, FiLoader
} from 'react-icons/fi';
import TemplateEditorModal from './TemplateEditorModal';
import LaunchConfirmationModal from './LaunchConfirmationModal';
import { useScrollLock } from "@/lib/useScrollLock";


const CampaignBuilder = ({ onClose, initialData }) => {
    const isEditing = !!initialData;

    // ── Form State ─────────────────────────────────────────────────────────
    const [campaignName, setCampaignName] = useState(initialData?.name || '');
    const [senderEmail, setSenderEmail] = useState(initialData?.senderEmail || '');

    // Email Template
    const [selectedTemplate, setSelectedTemplate] = useState(initialData?.templateSnapshot?.name ? initialData.templateSnapshot : null);
    const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);

    // Attachments
    const [attachments, setAttachments] = useState(initialData?.attachments || []);
    const fileInputRef = useRef(null);

    // Audience
    const [leads, setLeads] = useState([]);
    const [leadsLoading, setLeadsLoading] = useState(true);
    const [selectedLeadIds, setSelectedLeadIds] = useState(
        (initialData?.audienceIds || []).map(id => id.toString())
    );
    const [audienceSearch, setAudienceSearch] = useState('');
    const [audienceTab, setAudienceTab] = useState('NOT_SENT'); // 'NOT_SENT', 'SENT', 'ALL'
    const [selectedRoleFilter, setSelectedRoleFilter] = useState('All Roles');
    const [selectedTagFilter, setSelectedTagFilter] = useState('All Tags');
    const [isQuickAddOpen, setIsQuickAddOpen] = useState(false);

    // Quick Add Form State
    const [quickName, setQuickName] = useState('');
    const [quickEmail, setQuickEmail] = useState('');
    const [quickCompany, setQuickCompany] = useState('');
    const [quickRole, setQuickRole] = useState('');
    const [quickAddError, setQuickAddError] = useState('');

    // Settings
    const [trackOpens, setTrackOpens] = useState(initialData?.trackOpens ?? true);
    const [trackReplies, setTrackReplies] = useState(initialData?.trackReplies ?? true);
    const [stopAfterReply, setStopAfterReply] = useState(initialData?.stopAfterReply ?? true);

    // UI
    const [isLaunchModalOpen, setIsLaunchModalOpen] = useState(false);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');

    // ── Fetch real leads ───────────────────────────────────────────────────
    useScrollLock(isTemplateModalOpen || isLaunchModalOpen || isQuickAddOpen);
    useEffect(() => {
        const fetchLeads = async () => {
            setLeadsLoading(true);
            try {
                const res = await fetch('/api/leads');
                const data = await res.json();
                if (data.contacts) setLeads(data.contacts);
            } catch (e) {
                console.error('Failed to fetch leads', e);
            } finally {
                setLeadsLoading(false);
            }
        };
        fetchLeads();
    }, []);

    // ── Validations ────────────────────────────────────────────────────────
    const isGmailConnected = true;
    const isTemplateSelected = selectedTemplate !== null;
    const isAudienceSelected = selectedLeadIds.length > 0;
    const isReadyToLaunch = isGmailConnected && isTemplateSelected && isAudienceSelected && !!campaignName;

    // ── File Attachment ────────────────────────────────────────────────────
    const handleFileSelect = (files) => {
        const newFiles = Array.from(files).map(f => ({
            name: f.name,
            size: `${(f.size / 1024).toFixed(0)} KB`,
            contentType: f.type || "application/octet-stream",
            file: f,
        }));
        setAttachments(prev => [...prev, ...newFiles]);
    };

    // Convert kept File objects to base64 for the campaign payload.
    // Total cap ~4 MB keeps the request under serverless body limits.
    const attachmentsToPayload = () =>
        Promise.all(
            attachments.map(att => {
                if (!att.file) return { name: att.name, size: att.size, contentType: att.contentType, data: att.data };
                return new Promise((resolve, reject) => {
                    const reader = new FileReader();
                    reader.onload = () => {
                        const base64 = String(reader.result).split(",")[1] || "";
                        resolve({ name: att.name, size: att.size, contentType: att.contentType, data: base64 });
                    };
                    reader.onerror = () => reject(new Error(`Could not read ${att.name}`));
                    reader.readAsDataURL(att.file);
                });
            })
        );

    // ── Save Campaign (Draft or Launch) ───────────────────────────────────
    const saveCampaign = async (status = 'Draft') => {
        if (!campaignName.trim()) { setError('Campaign name is required.'); return null; }
        setSaving(true);
        setError('');
        try {
            let attachmentPayload = [];
            if (attachments.length) {
                attachmentPayload = await attachmentsToPayload();
                const totalBytes = attachmentPayload.reduce((sum, a) => sum + Math.ceil((a.data || "").length * 0.75), 0);
                if (totalBytes > 4 * 1024 * 1024) {
                    setError('Attachments are too large — keep the total under 4 MB.');
                    return null;
                }
            }
            const payload = {
                name: campaignName,
                senderEmail,
                templateId: selectedTemplate?._id || null,
                templateSnapshot: selectedTemplate ? { name: selectedTemplate.name, subject: selectedTemplate.subject, body: selectedTemplate.content || selectedTemplate.body || '' } : {},
                audienceIds: selectedLeadIds,
                attachments: attachmentPayload,
                trackOpens,
                trackReplies,
                stopAfterReply,
                status,
            };

            const url = isEditing ? `/api/outreach/campaigns/${initialData._id}` : '/api/outreach/campaigns';
            const method = isEditing ? 'PATCH' : 'POST';
            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });
            const data = await res.json();
            if (!res.ok) { setError(data.error || 'Something went wrong.'); return null; }
            return data.campaign;
        } catch (e) {
            setError('Network error. Please try again.');
            return null;
        } finally {
            setSaving(false);
        }
    };

    const handleSaveDraft = async () => {
        const campaign = await saveCampaign('Draft');
        if (campaign) onClose();
    };

    const handleConfirmLaunch = async () => {
        // 1. Save / update the campaign in DB (as Draft so /send can pick it up)
        const campaign = await saveCampaign('Draft');
        if (!campaign) return; // save failed

        setIsLaunchModalOpen(false);
        setSaving(true);
        setError('');

        try {
            // 2. Call the send endpoint repeatedly — large campaigns send in
            // batches and stay "Running" until every batch is done.
            let status = 'Running';
            let lastError = null;
            for (let attempt = 0; attempt < 40 && status === 'Running'; attempt++) {
                const res = await fetch(`/api/outreach/campaigns/${campaign._id}/send`, { method: 'POST' });
                const data = await res.json();
                if (!res.ok) {
                    lastError = data.error || 'Failed to send campaign.';
                    break;
                }
                status = data.status;
            }
            if (status === 'Running') {
                // Ran out of retry attempts — the campaign stays resumable
                setError(lastError || 'Sending is still in progress. You can relaunch this campaign to continue the remaining batch.');
                onClose();
                return;
            }
            if (lastError) {
                setError(lastError);
                return;
            }
            // Success — return to list
            onClose();
        } catch (e) {
            setError('Network error while sending campaign.');
        } finally {
            setSaving(false);
        }
    };

    // Dynamic lists for filters
    const uniqueRoles = [...new Set(leads.map(l => l.jobRole).filter(Boolean))];
    const uniqueTags = [...new Set(leads.flatMap(l => l.tags || []).filter(Boolean))];

    // ── Audience filter ────────────────────────────────────────────────────
    const filteredLeads = leads.filter(l => {
        // Tab Filter
        if (audienceTab === 'NOT_SENT' && l.status === 'contacted') return false;
        if (audienceTab === 'SENT' && l.status !== 'contacted') return false;

        // Role Filter
        if (selectedRoleFilter !== 'All Roles' && l.jobRole !== selectedRoleFilter) return false;

        // Tag Filter
        if (selectedTagFilter !== 'All Tags' && !(l.tags || []).includes(selectedTagFilter)) return false;

        // Search text Filter
        const query = audienceSearch.toLowerCase();
        return (
            (l.hrName || '').toLowerCase().includes(query) ||
            (l.email || '').toLowerCase().includes(query) ||
            (l.company || '').toLowerCase().includes(query) ||
            (l.jobRole || '').toLowerCase().includes(query)
        );
    });

    const allSelected = filteredLeads.length > 0 && filteredLeads.every(l => selectedLeadIds.includes(l._id.toString()));
    const toggleAll = () => {
        const ids = filteredLeads.map(l => l._id.toString());
        if (allSelected) {
            setSelectedLeadIds(prev => prev.filter(id => !ids.includes(id)));
        } else {
            setSelectedLeadIds(prev => [...new Set([...prev, ...ids])]);
        }
    };
    const toggleLead = (id) => {
        const strId = id.toString();
        setSelectedLeadIds(prev => prev.includes(strId) ? prev.filter(i => i !== strId) : [...prev, strId]);
    };

    const handleQuickAdd = async (e) => {
        e.preventDefault();
        if (!quickEmail.trim() || !quickCompany.trim() || !quickRole.trim()) {
            setQuickAddError('Email, Company, and Role are required.');
            return;
        }
        setQuickAddError('');
        try {
            const res = await fetch('/api/leads', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email: quickEmail,
                    company: quickCompany,
                    jobRole: quickRole,
                    hrName: quickName,
                }),
            });
            const data = await res.json();
            if (!res.ok) {
                setQuickAddError(data.error || 'Failed to add contact.');
                return;
            }
            // Insert the new contact
            setLeads(prev => [data.contact, ...prev]);
            setSelectedLeadIds(prev => [...prev, data.contact._id.toString()]);
            
            // Reset
            setQuickName('');
            setQuickEmail('');
            setQuickCompany('');
            setQuickRole('');
            setIsQuickAddOpen(false);
        } catch (err) {
            setQuickAddError('Network error. Failed to add contact.');
        }
    };

    return (
        <div className="flex flex-col h-[calc(100vh-2rem)] lg:h-full w-full min-h-0 bg-[#f9f9f9]">

            {/* Header */}
            <div className="flex items-center justify-between shrink-0 mb-6 mt-2 px-2 sm:px-4">
                <div className="flex items-center gap-3">
                    <button onClick={onClose} className="p-2 rounded-lg bg-white border border-border/60 hover:bg-surface text-text-dark shadow-sm transition-colors cursor-pointer">
                        <FiArrowLeft size={16} />
                    </button>
                    <div>
                        <div className="text-[12px] font-bold text-muted mb-0.5">Campaign Builder</div>
                        <h1 className={`text-[20px] sm:text-[24px] font-extrabold text-text-dark leading-tight tracking-tight`}>
                            {isEditing ? 'Edit Campaign' : 'Create New Campaign'}
                        </h1>
                    </div>
                </div>
            </div>

            {/* Error Banner */}
            {error && (
                <div className="mx-4 mb-4 px-4 py-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-[13px] font-semibold flex items-center gap-2 shrink-0">
                    <FiAlertCircle size={16} /> {error}
                </div>
            )}

            {/* Main Content */}
            <div className="flex-1 overflow-hidden flex flex-col lg:flex-row gap-6 px-2 sm:px-4 pb-4">

                {/* Left Column */}
                <div className="flex-1 overflow-y-auto pr-1 sm:pr-2 flex flex-col gap-5 scrollbar-hide">

                    {/* Campaign Details */}
                    <section className="bg-white border border-border/60 rounded-[14px] shadow-sm p-5 sm:p-6">
                        <div className="flex items-center gap-2 mb-4">
                            <div className="w-8 h-8 rounded-lg bg-[#1a1a1a] text-white flex items-center justify-center shrink-0"><FiSettings size={14} /></div>
                            <h2 className={`text-[17px] font-bold text-text-dark`}>Campaign Details</h2>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-[11px] font-bold text-muted uppercase tracking-wider mb-2">Campaign Name <span className="text-red-500">*</span></label>
                                <input
                                    type="text"
                                    value={campaignName}
                                    onChange={(e) => setCampaignName(e.target.value)}
                                    placeholder="e.g. Q3 SWE Outreach"
                                    className="w-full px-4 py-3 bg-[#f9f9f9] border border-border/60 rounded-xl text-[14px] font-bold text-text-dark outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all"
                                />
                            </div>
                            <div>
                                <label className="block text-[11px] font-bold text-muted uppercase tracking-wider mb-2">Sender Email</label>
                                <input
                                    type="email"
                                    value={senderEmail}
                                    onChange={(e) => setSenderEmail(e.target.value)}
                                    placeholder="your@gmail.com"
                                    className="w-full px-4 py-3 bg-[#f9f9f9] border border-border/60 rounded-xl text-[14px] font-bold text-text-dark outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all"
                                />
                            </div>
                        </div>
                    </section>

                    {/* Email Template */}
                    <section className="bg-white border border-border/60 rounded-[14px] shadow-sm p-5 sm:p-6">
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-2">
                                <div className="w-8 h-8 rounded-lg bg-[#1a1a1a] text-white flex items-center justify-center shrink-0"><FiMail size={14} /></div>
                                <div>
                                    <h2 className={`text-[17px] font-bold text-text-dark`}>Email Template</h2>
                                    <p className="text-[12px] font-medium text-muted">Select or create the template for this campaign</p>
                                </div>
                            </div>
                            <button onClick={() => { setSelectedTemplate(null); setIsTemplateModalOpen(true); }} className="flex items-center gap-2 px-3 py-1.5 bg-background border border-border rounded-lg text-[12px] font-bold text-text-dark hover:bg-surface transition-colors cursor-pointer shadow-sm">
                                <FiPlus size={12} /> New Template
                            </button>
                        </div>

                        {selectedTemplate ? (
                            <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 relative group">
                                <div className="absolute right-4 top-4 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button onClick={() => setIsTemplateModalOpen(true)} className="px-3 py-1 bg-white border border-border rounded-md text-[12px] font-bold text-text-dark shadow-sm hover:bg-surface cursor-pointer">Edit</button>
                                    <button onClick={() => setSelectedTemplate(null)} className="p-1 bg-white border border-border rounded-md text-muted shadow-sm hover:bg-red-50 hover:text-red-600 cursor-pointer"><FiX size={12} /></button>
                                </div>
                                <div className="flex items-center gap-2 mb-2">
                                    <div className="w-2 h-2 rounded-full bg-primary" />
                                    <h3 className="text-[14px] font-bold text-primary">{selectedTemplate.name}</h3>
                                </div>
                                <p className="text-[13px] font-medium text-text-dark">Subject: {selectedTemplate.subject}</p>
                                {selectedTemplate.content && (
                                    <p className="text-[12px] text-muted mt-2 line-clamp-2">{selectedTemplate.content}</p>
                                )}
                            </div>
                        ) : (
                            <div
                                className="border-2 border-dashed border-border/60 rounded-xl p-8 flex flex-col items-center justify-center text-center cursor-pointer hover:bg-[#f9f9f9] transition-colors"
                                onClick={() => setIsTemplateModalOpen(true)}
                            >
                                <FiMail size={24} className="text-muted mb-2" />
                                <p className="text-[14px] font-bold text-text-dark mb-1">No Template Selected</p>
                                <p className="text-[12px] text-muted font-medium">Click to create or select an email template</p>
                            </div>
                        )}
                    </section>

                    {/* Attachments */}
                    <section className="bg-white border border-border/60 rounded-[14px] shadow-sm p-5 sm:p-6">
                        <div className="flex items-center gap-2 mb-4">
                            <div className="w-8 h-8 rounded-lg bg-[#1a1a1a] text-white flex items-center justify-center shrink-0"><FiPaperclip size={14} /></div>
                            <h2 className={`text-[17px] font-bold text-text-dark`}>Attachments <span className="text-muted text-[12px] font-medium">(Optional)</span></h2>
                        </div>

                        <div
                            className="border-2 border-dashed border-border/60 rounded-xl p-6 flex flex-col items-center justify-center text-center hover:border-primary/30 transition-colors mb-4 bg-[#f9f9f9] cursor-pointer"
                            onClick={() => fileInputRef.current?.click()}
                            onDragOver={(e) => e.preventDefault()}
                            onDrop={(e) => { e.preventDefault(); handleFileSelect(e.dataTransfer.files); }}
                        >
                            <input ref={fileInputRef} type="file" multiple accept=".pdf,.doc,.docx" className="hidden" onChange={(e) => handleFileSelect(e.target.files)} />
                            <div className="w-10 h-10 rounded-full bg-white shadow-sm flex items-center justify-center mb-3"><FiUpload size={16} className="text-muted" /></div>
                            <p className="text-[14px] font-bold text-text-dark mb-1">Drag & drop or click to upload</p>
                            <p className="text-[12px] text-muted font-medium">PDF, DOC, DOCX — up to 10MB each</p>
                        </div>

                        {attachments.length > 0 && (
                            <div className="flex flex-col gap-2">
                                {attachments.map((file, i) => (
                                    <div key={i} className="flex items-center justify-between p-3 border border-border/50 rounded-lg bg-surface/30">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-md bg-blue-50 text-blue-600 flex items-center justify-center shrink-0"><FiPaperclip size={14} /></div>
                                            <div>
                                                <p className="text-[13px] font-bold text-text-dark">{file.name}</p>
                                                <p className="text-[11px] font-medium text-muted">{file.size}</p>
                                            </div>
                                        </div>
                                        <button onClick={() => setAttachments(prev => prev.filter((_, fi) => fi !== i))} className="p-1.5 text-muted hover:text-red-600 hover:bg-red-50 rounded-md transition-colors cursor-pointer">
                                            <FiX size={14} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </section>

                    {/* Audience */}
                    <section className="bg-white border border-border/60 rounded-[14px] shadow-sm p-5 sm:p-6">
                        <div className="flex items-center justify-between mb-5">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-[#1f9160] text-white flex items-center justify-center shrink-0">
                                    <FiUsers size={18} />
                                </div>
                                <div>
                                    <h2 className={`text-[18px] font-bold text-text-dark`}>3. Targeted Leads</h2>
                                    <p className="text-[12px] font-medium text-muted">{selectedLeadIds.length} leads selected</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => setIsQuickAddOpen(true)}
                                    className="flex items-center gap-1.5 px-3 py-1.5 bg-[#1f9160] hover:bg-[#1a7a51] text-white rounded-lg text-[12px] font-bold transition-colors cursor-pointer shadow-sm shadow-[#1f9160]/10 font-sans"
                                >
                                    <FiPlus size={14} /> QUICK ADD
                                </button>
                                <button
                                    onClick={toggleAll}
                                    className="px-3 py-1.5 bg-white border border-border/60 text-text-dark rounded-lg text-[12px] font-bold hover:bg-[#f9f9f9] transition-colors cursor-pointer font-sans"
                                >
                                    {allSelected ? 'DESELECT ALL' : 'SELECT ALL'}
                                </button>
                            </div>
                        </div>

                        {/* Segmented controls / Tabs */}
                        <div className="bg-[#f0f2f5] p-1 rounded-xl flex gap-1 mb-4">
                            {[
                                { id: 'NOT_SENT', label: `NOT SENT (${leads.filter(l => l.status !== 'contacted').length})` },
                                { id: 'SENT', label: `SENT (${leads.filter(l => l.status === 'contacted').length})` },
                                { id: 'ALL', label: `ALL (${leads.length})` },
                            ].map(tab => (
                                <button
                                    key={tab.id}
                                    type="button"
                                    onClick={() => setAudienceTab(tab.id)}
                                    className={`flex-1 py-2 text-[12px] rounded-lg transition-all cursor-pointer text-center ${
                                        audienceTab === tab.id
                                            ? 'bg-white shadow text-[#1f9160] font-bold'
                                            : 'text-muted hover:text-text-dark font-semibold'
                                    }`}
                                >
                                    {tab.label}
                                </button>
                            ))}
                        </div>

                        {/* Search & Filters */}
                        <div className="flex flex-col sm:flex-row gap-3 mb-4">
                            <div className="relative flex-1">
                                <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" size={14} />
                                <input
                                    type="text"
                                    placeholder="Search contacts..."
                                    value={audienceSearch}
                                    onChange={(e) => setAudienceSearch(e.target.value)}
                                    className="w-full pl-9 pr-4 py-2 bg-[#f9f9f9] border border-border/60 rounded-lg text-[13px] font-medium placeholder:text-muted outline-none focus:border-[#1f9160] focus:ring-2 focus:ring-[#1f9160]/10 transition-all"
                                />
                            </div>
                            
                            {/* Role Filter dropdown */}
                            <div className="relative shrink-0">
                                <select
                                    value={selectedRoleFilter}
                                    onChange={(e) => setSelectedRoleFilter(e.target.value)}
                                    className="pl-3 pr-8 py-2 bg-[#f9f9f9] border border-border/60 rounded-lg text-[13px] font-bold text-text-dark outline-none focus:border-[#1f9160] transition-all appearance-none cursor-pointer"
                                >
                                    <option value="All Roles">All Roles</option>
                                    {uniqueRoles.map(role => (
                                        <option key={role} value={role}>{role}</option>
                                    ))}
                                </select>
                                <FiChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted pointer-events-none" size={14} />
                            </div>

                            {/* Tag Filter dropdown */}
                            <div className="relative shrink-0">
                                <select
                                    value={selectedTagFilter}
                                    onChange={(e) => setSelectedTagFilter(e.target.value)}
                                    className="pl-3 pr-8 py-2 bg-[#f9f9f9] border border-border/60 rounded-lg text-[13px] font-bold text-text-dark outline-none focus:border-[#1f9160] transition-all appearance-none cursor-pointer"
                                >
                                    <option value="All Tags">All Tags</option>
                                    {uniqueTags.map(tag => (
                                        <option key={tag} value={tag}>{tag}</option>
                                    ))}
                                </select>
                                <FiChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted pointer-events-none" size={14} />
                            </div>
                        </div>

                        {/* Two-Column Grid Layout */}
                        {leadsLoading ? (
                            <div className="py-8 text-center text-muted text-[13px] font-medium flex items-center justify-center gap-2">
                                <div className="w-4 h-4 border-2 border-border border-t-[#1f9160] rounded-full animate-spin" />
                                Loading contacts...
                            </div>
                        ) : filteredLeads.length === 0 ? (
                            <div className="py-8 text-center text-muted text-[13px] font-medium border border-dashed border-border/60 rounded-xl">
                                No contacts match filters.
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[360px] overflow-y-auto pr-1">
                                {filteredLeads.map(lead => {
                                    const strId = lead._id.toString();
                                    const checked = selectedLeadIds.includes(strId);
                                    return (
                                        <div
                                            key={lead._id}
                                            onClick={() => toggleLead(lead._id)}
                                            className={`border rounded-xl p-4 flex items-center gap-4 cursor-pointer transition-all ${
                                                checked
                                                    ? 'border-[#1f9160] bg-[#1f9160]/5 shadow-sm'
                                                    : 'border-border/60 bg-white hover:border-[#1f9160]/50'
                                            }`}
                                        >
                                            {/* Checkbox indicator */}
                                            <div className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 transition-all ${
                                                checked
                                                    ? 'border-[#1f9160] bg-[#1f9160] text-white'
                                                    : 'border-border/80 bg-white'
                                            }`}>
                                                {checked && <FiCheck size={12} />}
                                            </div>

                                            {/* Contact Details */}
                                            <div className="flex-1 min-w-0">
                                                <p className="text-[14px] font-bold text-text-dark truncate">
                                                    {lead.email}
                                                </p>
                                                <p className="text-[12px] text-muted font-medium truncate mt-0.5">
                                                    {lead.company ? `${lead.company} • ${lead.jobRole || 'HR'}` : lead.jobRole || lead.hrName || '—'}
                                                </p>
                                            </div>
                                        </div>
                                );
                            })}
                        </div>
                    )}
                </section>

                    {/* Campaign Settings */}
                    <section className="bg-white border border-border/60 rounded-[14px] shadow-sm p-5 sm:p-6">
                        <div className="flex items-center gap-2 mb-4">
                            <div className="w-8 h-8 rounded-lg bg-[#1a1a1a] text-white flex items-center justify-center shrink-0"><FiSettings size={14} /></div>
                            <h2 className={`text-[17px] font-bold text-text-dark`}>Campaign Settings</h2>
                        </div>
                        <div className="flex flex-col gap-3">
                            {[
                                { label: 'Track Opens', value: trackOpens, set: setTrackOpens },
                                { label: 'Track Replies', value: trackReplies, set: setTrackReplies },
                                { label: 'Stop sending after first reply', value: stopAfterReply, set: setStopAfterReply },
                            ].map(({ label, value, set }) => (
                                <div key={label} className="flex items-center justify-between py-2 border-b border-border/40 last:border-0">
                                    <span className="text-[14px] font-semibold text-text-dark">{label}</span>
                                    <button
                                        onClick={() => set(!value)}
                                        className={`relative w-10 h-5 rounded-full transition-colors cursor-pointer ${value ? 'bg-primary' : 'bg-border'}`}
                                    >
                                        <span className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${value ? 'translate-x-5' : ''}`} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </section>
                </div>

                {/* Right Column — Sticky Summary */}
                <div className="w-full lg:w-[320px] xl:w-[360px] shrink-0">
                    <div className="sticky top-0 bg-white border border-border/60 rounded-[14px] shadow-sm flex flex-col p-5">
                        <h3 className="text-[15px] font-bold text-text-dark mb-4 uppercase tracking-wider">Campaign Summary</h3>

                        <div className="flex flex-col gap-4 mb-6">
                            <div className="flex gap-3 items-start">
                                <div className="mt-0.5 text-muted"><FiEdit2 size={16} /></div>
                                <div>
                                    <p className="text-[11px] font-bold text-muted uppercase tracking-wider">Name</p>
                                    <p className="text-[13px] font-bold text-text-dark mt-0.5">{campaignName || '—'}</p>
                                </div>
                            </div>
                            <div className="flex gap-3 items-start">
                                <div className="mt-0.5 text-muted"><FiMail size={16} /></div>
                                <div>
                                    <p className="text-[11px] font-bold text-muted uppercase tracking-wider">Template</p>
                                    <p className="text-[13px] font-bold text-text-dark mt-0.5">{selectedTemplate?.name || '—'}</p>
                                </div>
                            </div>
                            <div className="flex gap-3 items-start">
                                <div className="mt-0.5 text-muted"><FiUsers size={16} /></div>
                                <div>
                                    <p className="text-[11px] font-bold text-muted uppercase tracking-wider">Audience</p>
                                    <p className="text-[13px] font-bold text-text-dark mt-0.5">{selectedLeadIds.length} contact{selectedLeadIds.length !== 1 ? 's' : ''} selected</p>
                                </div>
                            </div>
                            <div className="flex gap-3 items-start">
                                <div className="mt-0.5 text-muted"><FiPaperclip size={16} /></div>
                                <div>
                                    <p className="text-[11px] font-bold text-muted uppercase tracking-wider">Attachments</p>
                                    <p className="text-[13px] font-bold text-text-dark mt-0.5">{attachments.length > 0 ? `${attachments.length} file${attachments.length !== 1 ? 's' : ''}` : 'None'}</p>
                                </div>
                            </div>
                        </div>

                        {/* Validations */}
                        <div className="bg-[#f9f9f9] border border-border/50 rounded-xl p-4 mb-6">
                            <p className="text-[11px] font-bold text-muted uppercase tracking-wider mb-3">Validation</p>
                            <div className="flex flex-col gap-2.5">
                                {[
                                    { label: 'Campaign Named', ok: !!campaignName },
                                    { label: 'Gmail Connected', ok: isGmailConnected },
                                    { label: 'Template Selected', ok: isTemplateSelected },
                                    { label: 'Audience Selected', ok: isAudienceSelected },
                                ].map(({ label, ok }) => (
                                    <div key={label} className="flex items-center gap-2">
                                        <div className={`w-4 h-4 rounded-full flex items-center justify-center shrink-0 ${ok ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-500'}`}>
                                            {ok ? <FiCheck size={10} /> : <FiAlertCircle size={10} />}
                                        </div>
                                        <span className="text-[12.5px] font-semibold text-text-dark">{label}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="flex flex-col gap-3">
                            <button
                                onClick={() => setIsLaunchModalOpen(true)}
                                disabled={!isReadyToLaunch || saving}
                                className="w-full py-3 bg-[#1a1a1a] text-white rounded-xl text-[14px] font-bold hover:bg-black transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                                <FiMail size={15} /> Launch Campaign
                            </button>
                            <button
                                onClick={handleSaveDraft}
                                disabled={saving}
                                className="w-full py-3 bg-white border border-border text-text-dark rounded-xl text-[14px] font-bold hover:bg-surface transition-colors shadow-sm disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                                {saving ? <><div className="w-4 h-4 border-2 border-border border-t-text-dark rounded-full animate-spin" /> Saving...</> : 'Save Draft'}
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {isTemplateModalOpen && (
                <TemplateEditorModal
                    onClose={() => setIsTemplateModalOpen(false)}
                    onSave={(t) => { setSelectedTemplate(t); setIsTemplateModalOpen(false); }}
                    initialData={selectedTemplate}
                    saveToDb={true}
                />
            )}

            {isLaunchModalOpen && (
                <LaunchConfirmationModal
                    onClose={() => setIsLaunchModalOpen(false)}
                    onConfirm={handleConfirmLaunch}
                    campaignName={campaignName}
                    audienceCount={selectedLeadIds.length}
                />
            )}

            {/* Quick Add Modal */}
            {isQuickAddOpen && (
                <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setIsQuickAddOpen(false)} />
                    <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl p-6 border border-border/50 animate-in zoom-in-95 duration-200">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className={`text-[18px] font-bold text-text-dark`}>Quick Add Lead</h3>
                            <button onClick={() => setIsQuickAddOpen(false)} className="p-1.5 hover:bg-surface rounded-lg text-muted hover:text-text-dark transition-colors">
                                <FiX size={18} />
                            </button>
                        </div>
                        {quickAddError && (
                            <div className="mb-3 p-2.5 bg-red-50 border border-red-200 text-red-600 rounded-lg text-[12px] font-bold flex items-center gap-1.5">
                                <FiAlertCircle size={14} /> {quickAddError}
                            </div>
                        )}
                        <form onSubmit={handleQuickAdd} className="flex flex-col gap-3">
                            <div>
                                <label className="block text-[11px] font-bold text-muted uppercase tracking-wider mb-1">HR / Contact Name</label>
                                <input
                                    type="text"
                                    value={quickName}
                                    onChange={(e) => setQuickName(e.target.value)}
                                    placeholder="e.g. Saloni"
                                    className="w-full px-3 py-2 bg-[#f9f9f9] border border-border/60 rounded-lg text-[13px] outline-none focus:border-[#1f9160] transition-all"
                                />
                            </div>
                            <div>
                                <label className="block text-[11px] font-bold text-muted uppercase tracking-wider mb-1">Email <span className="text-red-500">*</span></label>
                                <input
                                    type="email"
                                    value={quickEmail}
                                    onChange={(e) => setQuickEmail(e.target.value)}
                                    placeholder="saloni@cloudeagle.ai"
                                    required
                                    className="w-full px-3 py-2 bg-[#f9f9f9] border border-border/60 rounded-lg text-[13px] outline-none focus:border-[#1f9160] transition-all"
                                />
                            </div>
                            <div>
                                <label className="block text-[11px] font-bold text-muted uppercase tracking-wider mb-1">Company <span className="text-red-500">*</span></label>
                                <input
                                    type="text"
                                    value={quickCompany}
                                    onChange={(e) => setQuickCompany(e.target.value)}
                                    placeholder="CloudEagle.ai"
                                    required
                                    className="w-full px-3 py-2 bg-[#f9f9f9] border border-border/60 rounded-lg text-[13px] outline-none focus:border-[#1f9160] transition-all"
                                />
                            </div>
                            <div>
                                <label className="block text-[11px] font-bold text-muted uppercase tracking-wider mb-1">Job Role <span className="text-red-500">*</span></label>
                                <input
                                    type="text"
                                    value={quickRole}
                                    onChange={(e) => setQuickRole(e.target.value)}
                                    placeholder="Associate Product Manager"
                                    required
                                    className="w-full px-3 py-2 bg-[#f9f9f9] border border-border/60 rounded-lg text-[13px] outline-none focus:border-[#1f9160] transition-all"
                                />
                            </div>
                            <div className="flex gap-2 justify-end mt-4">
                                <button
                                    type="button"
                                    onClick={() => setIsQuickAddOpen(false)}
                                    className="px-4 py-2 bg-white border border-border text-text-dark rounded-lg text-[13px] font-bold hover:bg-surface cursor-pointer"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-2 bg-[#1f9160] hover:bg-[#1a7a51] text-white rounded-lg text-[13px] font-bold cursor-pointer"
                                >
                                    Add & Select
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CampaignBuilder;
