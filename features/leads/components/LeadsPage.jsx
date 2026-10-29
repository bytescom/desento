"use client"
import React, { useState, useEffect, useRef } from 'react'
import {
    FiUser, FiMoreHorizontal, FiUpload, FiPlus, FiSearch,
    FiX, FiTrash2, FiFileText, FiChevronDown, FiEdit2, FiMail,
    FiUsers, FiLink, FiClock
} from 'react-icons/fi';
import { useSearchParams } from 'next/navigation';


// ── UTILS ──────────────────────────────────────────────────────────────────
const pastelColors = ['#fdf4ff', '#eff6ff', '#f0fdf4', '#fffbeb', '#fef2f2', '#f3f4f6'];
const textColors = ['#a21caf', '#1d4ed8', '#15803d', '#b45309', '#b91c1c', '#374151'];

const getAvatarStyle = (name) => {
    const char = (name || '?').charAt(0).toUpperCase();
    const index = char.charCodeAt(0) % pastelColors.length;
    return {
        backgroundColor: pastelColors[index],
        color: textColors[index],
        border: `1px solid ${pastelColors[index]}`
    };
};

const getTagStyle = (tag) => {
    const t = tag.toLowerCase();
    if (t.includes('remote')) return 'bg-purple-50 text-purple-600 border-purple-200';
    if (t.includes('city') || t.includes('location')) return 'bg-blue-50 text-blue-600 border-blue-200';
    if (t.includes('applied')) return 'bg-green-50 text-green-600 border-green-200';
    if (t.includes('follow up') || t.includes('pending')) return 'bg-yellow-50 text-yellow-600 border-yellow-200';
    if (t.includes('urgent') || t.includes('high')) return 'bg-red-50 text-red-600 border-red-200';
    return 'bg-surface text-text-dark border-border';
};

// ── Mobile Accordion Row ───────────────────────────────────────────────────
const LeadAccordionRow = ({ lead, onDelete, onEdit }) => {
    const [open, setOpen] = useState(false);
    const initials = lead.company?.charAt(0).toUpperCase() || '?';
    const avatarStyle = getAvatarStyle(lead.company);

    return (
        <div className={`bg-background border rounded-xl transition-all shadow-sm ${open ? 'border-primary/30 ring-1 ring-primary/10' : 'border-border'}`}>
            <button
                onClick={() => setOpen(v => !v)}
                className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-surface/50 transition-colors text-left rounded-xl cursor-pointer"
            >
                <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 font-bold text-[14px]" style={avatarStyle}>
                    {initials}
                </div>
                <div className="flex-1 min-w-0">
                    <p className="text-[14px] font-bold text-text-dark truncate">{lead.company}</p>
                    <p className="text-[12px] text-muted font-medium truncate">{lead.jobRole}</p>
                </div>
                <FiChevronDown className={`text-muted shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} size={16} />
            </button>

            {open && (
                <div className="bg-surface/30 border-t border-border px-4 py-4 flex flex-col gap-3 rounded-b-xl">
                    <div className="flex items-start gap-2">
                        <FiMail size={13} className="text-muted mt-0.5 shrink-0" />
                        <div>
                            <p className="text-[10px] font-extrabold text-muted uppercase tracking-[0.1em] mb-0.5">HR Email</p>
                            <p className="text-[13px] font-semibold text-text-dark break-all">{lead.email}</p>
                        </div>
                    </div>
                    {lead.hrName && lead.hrName !== "—" && (
                        <div className="flex items-start gap-2">
                            <FiUser size={13} className="text-muted mt-0.5 shrink-0" />
                            <div>
                                <p className="text-[10px] font-extrabold text-muted uppercase tracking-[0.1em] mb-0.5">HR Name</p>
                                <p className="text-[13px] font-semibold text-text-dark">{lead.hrName}</p>
                            </div>
                        </div>
                    )}
                    {lead.tags?.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mt-1">
                            {lead.tags.map(tag => (
                                <span key={tag} className={`px-2.5 py-1 border text-[11px] font-bold rounded-full ${getTagStyle(tag)}`}>{tag}</span>
                            ))}
                        </div>
                    )}
                    <div className="flex gap-2 mt-2 pt-3 border-t border-border/50">
                        <button
                            onClick={(e) => { e.stopPropagation(); onEdit(lead); }}
                            className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2 bg-background border border-border text-text-dark text-[12px] font-bold rounded-lg hover:bg-surface transition-colors cursor-pointer"
                        >
                            <FiEdit2 size={13} /> Edit
                        </button>
                        <button
                            onClick={(e) => { e.stopPropagation(); onDelete(lead._id); }}
                            className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2 bg-red-50 border border-red-100 text-red-600 text-[12px] font-bold rounded-lg hover:bg-red-100 transition-colors cursor-pointer"
                        >
                            <FiTrash2 size={13} /> Delete
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

// ── Contact Details Side Panel ─────────────────────────────────────────────
const ContactDetailsPanel = ({ lead, onClose, onEdit }) => {
    const avatarStyle = getAvatarStyle(lead.company);
    const initials = (lead.company || '?').charAt(0).toUpperCase();

    // Prevent scrolling on body when panel is open
    useEffect(() => {
        document.body.style.overflow = 'hidden';
        return () => { document.body.style.overflow = 'auto'; };
    }, []);

    return (
        <div className="fixed inset-0 z-[100] flex justify-end">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/20 backdrop-blur-sm transition-opacity animate-in fade-in duration-200"
                onClick={onClose}
            />

            {/* Slide Panel */}
            <div className="relative w-full sm:w-[400px] h-full bg-background shadow-2xl border-l border-border/50 flex flex-col animate-in slide-in-from-right duration-300">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-border/50 bg-surface/30">
                    <div className="flex items-center gap-2 text-text-dark">
                        <FiUser size={15} className="text-muted" />
                        <span className="text-[14px] font-bold">Contact Details</span>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-1.5 rounded-lg hover:bg-border/50 text-muted hover:text-text-dark transition-colors cursor-pointer"
                    >
                        <FiX size={18} />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-6">
                    {/* Profile Header */}
                    <div className="flex items-center gap-4">
                        <div className="w-16 h-16 rounded-full flex items-center justify-center shrink-0 font-bold text-[24px] shadow-sm" style={avatarStyle}>
                            {initials}
                        </div>
                        <div className="flex-1 min-w-0">
                            <h2 className={`text-[20px] font-bold text-text-dark truncate`}>{lead.company}</h2>
                            <div className="flex items-center gap-1.5 text-[13px] text-muted font-medium mt-0.5">
                                <FiMail size={12} className="shrink-0" />
                                <span className="truncate">{lead.email}</span>
                            </div>
                            {lead.tags?.length > 0 && (
                                <div className="flex flex-wrap gap-1.5 mt-2.5">
                                    {lead.tags.map(tag => (
                                        <span key={tag} className={`px-2 py-0.5 border text-[10.5px] font-bold rounded-full ${getTagStyle(tag)}`}>{tag}</span>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Quick Info Cards */}
                    <div className="grid grid-cols-2 gap-3">
                        <div className="p-3.5 bg-surface/50 border border-border/50 rounded-xl">
                            <p className="text-[10.5px] font-extrabold text-muted uppercase tracking-[0.05em] mb-1">Job Role</p>
                            <p className="text-[13px] font-semibold text-text-dark truncate" title={lead.jobRole}>{lead.jobRole}</p>
                        </div>
                        <div className="p-3.5 bg-surface/50 border border-border/50 rounded-xl">
                            <p className="text-[10.5px] font-extrabold text-muted uppercase tracking-[0.05em] mb-1">HR Name</p>
                            <p className="text-[13px] font-semibold text-text-dark truncate" title={lead.hrName}>{lead.hrName || '—'}</p>
                        </div>
                    </div>

                    {/* Detailed Sections */}
                    <div className="flex flex-col gap-4">
                        <div className="p-4 bg-background border border-border/80 rounded-xl shadow-sm">
                            <div className="flex items-center justify-between mb-3">
                                <h3 className="text-[13px] font-bold text-text-dark flex items-center gap-1.5">
                                    <FiFileText size={14} className="text-muted" />
                                    Notes & Description
                                </h3>
                            </div>
                            <div className="text-[13px] text-muted leading-relaxed whitespace-pre-wrap font-medium">
                                {lead.notes || lead.jobDescription || (
                                    <span className="italic opacity-60">No additional notes provided for this contact.</span>
                                )}
                            </div>
                        </div>

                        <div className="p-4 bg-background border border-border/80 rounded-xl shadow-sm">
                            <h3 className="text-[13px] font-bold text-text-dark flex items-center gap-1.5 mb-3">
                                <FiClock size={14} className="text-muted" />
                                Activity Status
                            </h3>
                            <div className="flex items-center justify-between p-2.5 bg-surface/50 rounded-lg border border-border/50">
                                <span className="text-[12.5px] font-medium text-text-dark">Last Contacted</span>
                                <span className="text-[12px] font-semibold text-muted">Just now</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer Actions */}
                <div className="p-4 border-t border-border/50 bg-surface/30 flex gap-3 shrink-0">
                    <button
                        onClick={() => { onClose(); onEdit(lead); }}
                        className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-background border border-border text-text-dark text-[13px] font-bold rounded-lg hover:bg-surface transition-colors cursor-pointer shadow-sm"
                    >
                        <FiEdit2 size={14} /> Edit Contact
                    </button>
                    <button className="px-4 py-2.5 bg-primary text-white text-[13px] font-bold rounded-lg hover:bg-primary/90 transition-colors cursor-pointer shadow-sm flex items-center gap-2">
                        <FiMail size={14} /> Send Email
                    </button>
                </div>
            </div>
        </div>
    );
};


// ── Add / Edit Contact Form (Modal) ────────────────────────────────────────
const AddContactForm = ({ onClose, onSave, editingLead }) => {
    const [form, setForm] = useState({
        hrEmail: editingLead?.email || "",
        company: editingLead?.company || "",
        role: editingLead?.jobRole || "",
        hrName: editingLead?.hrName || "",
        jobDescription: editingLead?.notes || "",
        tagInput: ""
    });
    const [tags, setTags] = useState(editingLead?.tags || []);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");

    const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

    const handleTagKey = (e) => {
        if ((e.key === "Enter" || e.key === ",") && form.tagInput.trim()) {
            e.preventDefault();
            const t = form.tagInput.trim().toLowerCase();
            if (!tags.includes(t)) setTags(prev => [...prev, t]);
            set("tagInput", "");
        }
    };

    const handleSubmit = async () => {
        if (!form.hrEmail.trim() || !form.company.trim() || !form.role.trim()) {
            setError("Email, Company, and Role are required.");
            return;
        }

        setSaving(true);
        setError("");

        const payload = {
            email: form.hrEmail.trim(),
            company: form.company.trim(),
            jobRole: form.role.trim(),
            hrName: form.hrName.trim(),
            jobDescription: form.jobDescription.trim(),
            tags,
        };

        try {
            const url = editingLead ? `/api/leads/${editingLead._id}` : "/api/leads";
            const method = editingLead ? "PUT" : "POST";

            const res = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });

            const data = await res.json();

            if (!res.ok) {
                setError(data.error || "Something went wrong");
                setSaving(false);
                return;
            }

            onSave(data.contact, !!editingLead);
            onClose();
        } catch (err) {
            setError("Network error. Please try again.");
            setSaving(false);
        }
    };

    const inputCls = "w-full px-4 py-2.5 bg-background border border-border rounded-lg text-[13.5px] font-medium placeholder:text-muted outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all shadow-sm";

    return (
        <div className="absolute inset-0 z-50 flex items-end sm:items-center justify-center">
            <div className="absolute inset-0 bg-black/20 backdrop-blur-sm transition-opacity" onClick={onClose} />
            <div className="relative bg-background rounded-t-2xl sm:rounded-2xl shadow-xl border border-border/50 w-full sm:max-w-2xl p-6 sm:p-8 z-10 max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0">
                            {editingLead ? <FiEdit2 size={16} /> : <FiUser size={16} />}
                        </div>
                        <h3 className={`text-[20px] font-bold text-text-dark tracking-tight`}>
                            {editingLead ? "Edit Contact" : "Add New Contact"}
                        </h3>
                    </div>
                    <button onClick={onClose} className="p-2 rounded-lg hover:bg-surface text-muted hover:text-text-dark transition-colors cursor-pointer">
                        <FiX size={18} />
                    </button>
                </div>

                {error && (
                    <div className="mb-5 px-4 py-3 bg-red-50 border border-red-100 rounded-lg text-[13px] font-medium text-red-600 flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0" />
                        {error}
                    </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-[12px] font-bold text-text-dark mb-1.5 ml-1">Company *</label>
                        <input type="text" placeholder="e.g. Acme Corp" value={form.company} onChange={e => set("company", e.target.value)} className={inputCls} />
                    </div>
                    <div>
                        <label className="block text-[12px] font-bold text-text-dark mb-1.5 ml-1">HR Email *</label>
                        <input type="email" placeholder="hr@company.com" value={form.hrEmail} onChange={e => set("hrEmail", e.target.value)} className={inputCls} />
                    </div>
                    <div>
                        <label className="block text-[12px] font-bold text-text-dark mb-1.5 ml-1">Role *</label>
                        <input type="text" placeholder="e.g. Senior Recruiter" value={form.role} onChange={e => set("role", e.target.value)} className={inputCls} />
                    </div>
                    <div>
                        <label className="block text-[12px] font-bold text-text-dark mb-1.5 ml-1">HR Name</label>
                        <input type="text" placeholder="e.g. Sarah Smith" value={form.hrName} onChange={e => set("hrName", e.target.value)} className={inputCls} />
                    </div>

                    <div className="sm:col-span-2">
                        <label className="block text-[12px] font-bold text-text-dark mb-1.5 ml-1">Tags</label>
                        <div className="flex flex-wrap gap-1.5 items-center min-h-[44px] px-3 py-1.5 bg-background border border-border rounded-lg shadow-sm focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/10 transition-all">
                            {tags.map(t => (
                                <span key={t} className={`flex items-center gap-1 px-2.5 py-0.5 border rounded-full text-[11.5px] font-bold ${getTagStyle(t)}`}>
                                    {t}
                                    <button onClick={() => setTags(p => p.filter(x => x !== t))} className="hover:opacity-70 transition-opacity ml-0.5">×</button>
                                </span>
                            ))}
                            <input
                                type="text"
                                placeholder={tags.length === 0 ? "Type and press Enter..." : "Add tag..."}
                                value={form.tagInput}
                                onChange={e => set("tagInput", e.target.value)}
                                onKeyDown={handleTagKey}
                                className="flex-1 min-w-[120px] outline-none text-[13px] font-medium bg-transparent text-text-dark placeholder:text-muted py-1"
                            />
                        </div>
                    </div>

                    <div className="sm:col-span-2">
                        <label className="block text-[12px] font-bold text-text-dark mb-1.5 ml-1">Notes</label>
                        <textarea
                            placeholder="Additional details..."
                            value={form.jobDescription}
                            onChange={e => set("jobDescription", e.target.value)}
                            rows={3}
                            className={`${inputCls} resize-none leading-relaxed`}
                        />
                    </div>

                    <div className="sm:col-span-2 flex justify-end gap-3 mt-4 pt-4 border-t border-border">
                        <button
                            onClick={onClose}
                            className="px-5 py-2.5 bg-background border border-border text-text-dark rounded-lg text-[13.5px] font-semibold hover:bg-surface transition-colors cursor-pointer"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleSubmit}
                            disabled={saving}
                            className="px-6 py-2.5 bg-primary text-white rounded-lg text-[13.5px] font-semibold flex items-center justify-center gap-2 hover:bg-primary/90 transition-colors shadow-sm cursor-pointer disabled:opacity-50"
                        >
                            {saving ? (
                                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            ) : (
                                <>
                                    {editingLead ? <FiEdit2 size={15} /> : <FiPlus size={15} />}
                                    {editingLead ? "Save Changes" : "Add Contact"}
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

// ── Bulk CSV Import ────────────────────────────────────────────────────────
// ── Bulk Import (real CSV parse + bulk POST) ────────────────────────────────
const BulkImportModal = ({ onClose, onImported }) => {
    const [fileName, setFileName] = useState("");
    const [rows, setRows] = useState(null);
    const [error, setError] = useState("");
    const [importing, setImporting] = useState(false);
    const [result, setResult] = useState(null);

    // Minimal CSV parser: quoted fields, commas/newlines inside quotes, CRLF
    const parseCSV = (raw) => {
        const rows = [];
        let row = [], field = "", inQuotes = false;
        for (let i = 0; i < raw.length; i++) {
            const ch = raw[i];
            if (inQuotes) {
                if (ch === '"' && raw[i + 1] === '"') { field += '"'; i++; }
                else if (ch === '"') { inQuotes = false; }
                else { field += ch; }
            } else if (ch === '"') {
                inQuotes = true;
            } else if (ch === ",") {
                row.push(field); field = "";
            } else if (ch === "\n" || ch === "\r") {
                if (ch === "\r" && raw[i + 1] === "\n") i++;
                row.push(field); field = "";
                if (row.some(c => c.trim() !== "")) rows.push(row);
                row = [];
            } else {
                field += ch;
            }
        }
        row.push(field);
        if (row.some(c => c.trim() !== "")) rows.push(row);
        return rows;
    };

    const handleFile = (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setError("");
        setResult(null);
        setFileName(file.name);
        const reader = new FileReader();
        reader.onload = () => {
            try {
                const allRows = parseCSV(String(reader.result));
                if (allRows.length < 2) {
                    setError("The file needs a header row and at least one data row.");
                    setRows(null);
                    return;
                }
                const headers = allRows[0].map(h => h.trim().toLowerCase().replace(/\s+/g, "_"));
                const idx = (names) => headers.findIndex(h => names.includes(h));
                const iEmail = idx(["email", "e_mail", "email_address"]);
                const iCompany = idx(["company", "company_name"]);
                const iRole = idx(["role", "job_role", "jobrole", "position"]);
                if (iEmail === -1 || iCompany === -1 || iRole === -1) {
                    setError("Missing required columns. The header row must include email, company, and role.");
                    setRows(null);
                    return;
                }
                const parsed = allRows.slice(1).map(r => ({
                    email: (r[iEmail] || "").trim(),
                    company: (r[iCompany] || "").trim(),
                    jobRole: (r[iRole] || "").trim(),
                    hrName: iEmail > -1 && headers.includes("hr_name") ? (r[headers.indexOf("hr_name")] || "").trim() : (r[idx(["hr_name", "contact_name", "name"])] || "").trim(),
                    notes: headers.includes("notes") ? (r[headers.indexOf("notes")] || "").trim() : "",
                    tags: headers.includes("tags") ? (r[headers.indexOf("tags")] || "").split(/[|;]/).map(t => t.trim()).filter(Boolean) : [],
                }));
                setRows(parsed);
            } catch {
                setError("Could not read the file. Make sure it's a valid CSV.");
                setRows(null);
            }
        };
        reader.readAsText(file);
    };

    const handleImport = async () => {
        if (!rows?.length) return;
        setImporting(true);
        setError("");
        try {
            const res = await fetch("/api/leads/bulk", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ leads: rows }),
            });
            const data = await res.json();
            if (!res.ok) {
                setError(data.error || "Import failed.");
            } else {
                setResult(data);
                onImported?.();
            }
        } catch {
            setError("Network error during import.");
        } finally {
            setImporting(false);
        }
    };

    return (
        <div className="absolute inset-0 z-50 flex items-end sm:items-center justify-center">
            <div className="absolute inset-0 bg-black/20 backdrop-blur-sm transition-opacity" onClick={onClose} />
            <div className="relative bg-background rounded-t-2xl sm:rounded-2xl shadow-xl border border-border/50 w-full sm:max-w-md p-6 sm:p-8 z-10 max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between mb-5">
                    <h3 className={`text-[18px] font-bold text-text-dark`}>Import Contacts</h3>
                    <button onClick={onClose} className="p-2 rounded-lg hover:bg-surface text-muted hover:text-text-dark transition-colors cursor-pointer"><FiX size={18} /></button>
                </div>

                {error && (
                    <div className="mb-5 px-4 py-3 bg-red-50 border border-red-100 rounded-lg text-[13px] font-medium text-red-600">{error}</div>
                )}

                {result ? (
                    <div className="mb-5">
                        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-[13px] text-emerald-800 font-medium space-y-1">
                            <p className="font-bold text-emerald-900">Import finished</p>
                            <p>Imported: <strong>{result.imported}</strong></p>
                            <p>Duplicates skipped: <strong>{result.duplicates}</strong></p>
                            <p>Invalid rows: <strong>{result.invalid?.length || 0}</strong> of {result.total}</p>
                            {result.invalid?.length > 0 && (
                                <ul className="mt-2 text-[12px] list-disc list-inside max-h-32 overflow-y-auto">
                                    {result.invalid.slice(0, 10).map((r, i) => (
                                        <li key={i}>{r.email} — {r.reason}</li>
                                    ))}
                                </ul>
                            )}
                        </div>
                        <button onClick={onClose} className="mt-4 w-full py-2.5 bg-primary text-white rounded-lg font-semibold text-[13.5px] hover:bg-primary/90 transition-colors cursor-pointer">
                            Done
                        </button>
                    </div>
                ) : (
                    <>
                        <div className="mb-5 p-3.5 bg-blue-50/50 border border-blue-100 rounded-xl text-[12px] text-blue-800 font-medium">
                            <p className="font-bold text-blue-900 mb-1">CSV Format Requirements:</p>
                            <p>Include columns: <code className="bg-white/50 px-1 py-0.5 rounded text-blue-700">email</code>, <code className="bg-white/50 px-1 py-0.5 rounded text-blue-700">company</code>, <code className="bg-white/50 px-1 py-0.5 rounded text-blue-700">role</code> — optional: <code className="bg-white/50 px-1 py-0.5 rounded text-blue-700">hr_name</code>, <code className="bg-white/50 px-1 py-0.5 rounded text-blue-700">notes</code>, <code className="bg-white/50 px-1 py-0.5 rounded text-blue-700">tags</code></p>
                        </div>

                        <label className="block mb-5 cursor-pointer border-2 border-dashed border-border rounded-xl p-8 text-center hover:border-primary/50 hover:bg-primary/5 transition-all group">
                            <div className="w-12 h-12 rounded-full bg-surface group-hover:bg-white flex items-center justify-center mx-auto mb-3 shadow-sm transition-colors">
                                <FiUpload size={20} className="text-muted group-hover:text-primary transition-colors" />
                            </div>
                            <p className="text-[14px] font-bold text-text-dark group-hover:text-primary transition-colors mb-1">{fileName || "Click to upload CSV"}</p>
                            <p className="text-[12px] text-muted font-medium">{rows ? `${rows.length} contacts ready to import` : "or drag and drop file here"}</p>
                            <input type="file" accept=".csv,text/csv" className="hidden" onChange={handleFile} />
                        </label>

                        <button
                            onClick={handleImport}
                            disabled={!rows || importing}
                            className="w-full py-2.5 bg-primary text-white rounded-lg font-semibold text-[13.5px] flex items-center justify-center hover:bg-primary/90 transition-colors cursor-pointer shadow-sm disabled:opacity-50 disabled:cursor-not-allowed mb-2"
                        >
                            {importing ? "Importing…" : rows ? `Import ${rows.length} contacts` : "Import"}
                        </button>
                        <button onClick={onClose} className="w-full py-2.5 bg-background border border-border text-text-dark rounded-lg font-semibold text-[13.5px] flex items-center justify-center hover:bg-surface transition-colors cursor-pointer shadow-sm">
                            Cancel
                        </button>
                    </>
                )}
            </div>
        </div>
    );
};

// ── Main Component ─────────────────────────────────────────────────────────
const Leads = () => {
    const searchParams = useSearchParams();
    const [leads, setLeads] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [showForm, setShowForm] = useState(false);
    const [showBulk, setShowBulk] = useState(false);
    const [editingLead, setEditingLead] = useState(null);
    const [viewingLead, setViewingLead] = useState(null);
    const [addDropdownOpen, setAddDropdownOpen] = useState(false);

    // Advanced Filters state
    const [dateFilter, setDateFilter] = useState('All Time');
    const [statusFilter, setStatusFilter] = useState('All');

    // Pagination state
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 20;

    const addDropdownRef = useRef(null);
    const searchInputRef = useRef(null);

    // Handle URL actions from sidebar
    useEffect(() => {
        const action = searchParams.get('action');
        if (action === 'add') {
            setEditingLead(null);
            setShowForm(true);
        } else if (action === 'import') {
            setShowBulk(true);
        }
    }, [searchParams]);

    // Fetch leads from DB
    const loadLeads = async () => {
        try {
            const res = await fetch("/api/leads");
            const data = await res.json();
            if (res.ok) {
                setLeads(data.contacts || []);
            }
        } catch (error) {
            console.error("Failed to fetch leads:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadLeads();
    }, []);

    // Close dropdown on outside click
    useEffect(() => {
        function handleClickOutside(e) {
            if (addDropdownOpen && addDropdownRef.current && !addDropdownRef.current.contains(e.target)) {
                setAddDropdownOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [addDropdownOpen]);

    // Keyboard shortcut for search
    useEffect(() => {
        const handleKeyDown = (e) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
                e.preventDefault();
                searchInputRef.current?.focus();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    // Save handler — add or update
    const handleSave = (contact, isEdit) => {
        if (isEdit) {
            setLeads(prev => prev.map(l => l._id === contact._id ? contact : l));
        } else {
            setLeads(prev => [contact, ...prev]);
        }
    };

    // Delete handler
    const handleDelete = async (id) => {
        if (!window.confirm("Are you sure you want to delete this contact?")) return;
        try {
            const res = await fetch(`/api/leads/${id}`, { method: "DELETE" });
            if (res.ok) {
                setLeads(prev => prev.filter(l => l._id !== id));
            }
        } catch (error) {
            console.error("Delete failed:", error);
        }
    };

    // Edit handler
    const handleEdit = (lead) => {
        setEditingLead(lead);
        setShowForm(true);
    };

    const filteredLeads = leads.filter(l => {
        // Text Search
        const matchesSearch = (l.company || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
            (l.email || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
            (l.jobRole || '').toLowerCase().includes(searchQuery.toLowerCase());

        // Status Filter — uses the real HrEmail.status field (active/contacted/responded/archived)
        let matchesStatus = true;
        if (statusFilter === 'New') {
            matchesStatus = !l.status || l.status === 'active';
        } else if (statusFilter === 'Contacted') {
            matchesStatus = l.status === 'contacted' || l.status === 'responded';
        }

        // Date Filter (Placeholder: Assuming 'createdAt' exists. If not, this is a no-op for now)
        let matchesDate = true;
        if (dateFilter !== 'All Time' && l.createdAt) {
            const date = new Date(l.createdAt);
            const now = new Date();
            const diffTime = Math.abs(now - date);
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

            if (dateFilter === 'Today') matchesDate = diffDays <= 1;
            if (dateFilter === 'Last 7 Days') matchesDate = diffDays <= 7;
            if (dateFilter === 'Last 30 Days') matchesDate = diffDays <= 30;
        }

        return matchesSearch && matchesStatus && matchesDate;
    });

    // Pagination logic
    const totalPages = Math.ceil(filteredLeads.length / itemsPerPage);
    const paginatedLeads = filteredLeads.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

    // Stats calculations
    const totalContacts = leads.length;
    const totalCompanies = new Set(leads.filter(l => l.company).map(l => l.company)).size;
    const followUps = leads.filter(l => l.tags?.some(t => t.toLowerCase().includes('follow up') || t.toLowerCase().includes('pending'))).length || 0;
    // Real count: leads not yet contacted (status 'active'); fall back to 'active' when status is missing
    const pendingOutreach = leads.filter(l => (l.status || 'active') === 'active').length;

    const stats = [
        { label: "Total Contacts", value: totalContacts },
        { label: "Companies", value: totalCompanies },
        { label: "Pending Outreach", value: pendingOutreach },
        { label: "Follow Ups Due", value: followUps },
    ];

    return (
        <div className="relative flex flex-col min-h-full h-full w-full max-w-full overflow-x-hidden px-1 sm:px-2 pb-2">

            {showBulk && <BulkImportModal onClose={() => setShowBulk(false)} onImported={loadLeads} />}

            {viewingLead && (
                <ContactDetailsPanel
                    lead={viewingLead}
                    onClose={() => setViewingLead(null)}
                    onEdit={handleEdit}
                />
            )}

            {showForm && (
                <AddContactForm
                    onClose={() => { setShowForm(false); setEditingLead(null); }}
                    onSave={handleSave}
                    editingLead={editingLead}
                />
            )}

            {/* Header & Stats */}
            <div className="flex flex-col gap-5 shrink-0 mb-6 mt-2">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className={`text-[28px] md:text-[32px] font-extrabold text-text-dark leading-[1.1] mb-1.5 tracking-tight`}>Contacts</h1>
                        <p className="text-[14px] font-medium text-muted">Manage your HR network and recruitment professionals.</p>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                        <button
                            onClick={() => setShowBulk(true)}
                            className="flex items-center gap-2 px-4 py-2 bg-background border border-border rounded-lg text-[13px] font-semibold text-text-dark hover:bg-surface transition-colors shadow-sm cursor-pointer"
                        >
                            <FiUpload size={14} className="text-muted" /> Import CSV
                        </button>

                        <div className="relative" ref={addDropdownRef}>
                            <button
                                onClick={() => setAddDropdownOpen(!addDropdownOpen)}
                                className="flex items-center gap-2 px-4 py-2 bg-primary shadow-sm rounded-lg text-[13px] font-semibold text-white hover:bg-primary/90 transition-colors cursor-pointer"
                            >
                                <FiPlus size={14} /> Add Contact <FiChevronDown size={14} className={`transition-transform duration-200 ${addDropdownOpen ? 'rotate-180' : ''}`} />
                            </button>

                            {addDropdownOpen && (
                                <div className="absolute right-0 top-full mt-1.5 w-48 bg-background border border-border/50 rounded-xl shadow-xl py-1.5 z-20 overflow-hidden">
                                    <button onClick={() => { setAddDropdownOpen(false); setEditingLead(null); setShowForm(true); }} className="w-full flex items-center gap-2.5 px-4 py-2.5 text-[13px] font-medium text-text-dark hover:bg-surface hover:text-primary transition-colors text-left">
                                        <FiUser size={14} className="text-muted" /> Add Manually
                                    </button>
                                    <button onClick={() => { setAddDropdownOpen(false); setShowBulk(true); }} className="w-full flex items-center gap-2.5 px-4 py-2.5 text-[13px] font-medium text-text-dark hover:bg-surface hover:text-primary transition-colors text-left">
                                        <FiUpload size={14} className="text-muted" /> Import CSV
                                    </button>
                                    <button className="w-full flex items-center gap-2.5 px-4 py-2.5 text-[13px] font-medium text-text-dark hover:bg-surface hover:text-primary transition-colors text-left">
                                        <FiLink size={14} className="text-muted" /> Import LinkedIn CSV
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {stats.map((stat, i) => (
                        <div key={i} className="bg-background border border-border/60 rounded-xl p-4 shadow-sm flex flex-col gap-1 hover:border-border transition-colors">
                            <span className="text-[12px] font-semibold text-muted">{stat.label}</span>
                            <span className="text-[22px] font-bold text-text-dark tracking-tight">{loading ? '-' : stat.value}</span>
                        </div>
                    ))}
                </div>
            </div>

            <section className="flex-1 flex flex-col min-h-0 border border-border/60 bg-background shadow-sm rounded-xl max-w-full overflow-hidden">

                {/* Search & Filters */}
                <div className="w-full p-3 border-b border-border/40 flex flex-col sm:flex-row gap-3 shrink-0 bg-background">
                    <div className="relative flex-1">
                        <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" size={15} />
                        <input
                            ref={searchInputRef}
                            type="text"
                            value={searchQuery}
                            onChange={e => {
                                setSearchQuery(e.target.value);
                                setCurrentPage(1);
                            }}
                            placeholder="Search contacts..."
                            className="w-full pl-9 pr-14 py-2 bg-background border border-border/60 rounded-lg text-[13px] font-medium placeholder:text-muted outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all shadow-sm"
                        />
                        <div className="hidden sm:flex absolute right-2.5 top-1/2 -translate-y-1/2 items-center gap-0.5 pointer-events-none">
                            <kbd className="px-1.5 py-0.5 text-[10px] font-bold bg-surface border border-border rounded text-muted">Ctrl</kbd>
                            <kbd className="px-1.5 py-0.5 text-[10px] font-bold bg-surface border border-border rounded text-muted">K</kbd>
                        </div>
                    </div>
                    <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0 scrollbar-hide shrink-0">
                        {['Role', 'Location', 'Tags', 'Company'].map(filter => (
                            <button key={filter} className="flex items-center gap-1.5 px-3 py-2 bg-background border border-border/60 rounded-lg text-[12.5px] font-semibold text-text-dark hover:bg-surface hover:border-border transition-all whitespace-nowrap shadow-sm cursor-pointer">
                                {filter} <FiChevronDown size={13} className="text-muted" />
                            </button>
                        ))}
                    </div>
                </div>

                {/* Secondary Filter Toolbar */}
                <div className="w-full px-3 py-2.5 border-b border-border/60 bg-background flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4 shrink-0 overflow-x-auto scrollbar-hide">

                    {/* Date Range Filter Group */}
                    <div className="flex items-center bg-surface/60 p-1 rounded-lg border border-border/40 shrink-0">
                        {['Today', 'Last 7 Days', 'Last 30 Days', 'All Time'].map(option => (
                            <button
                                key={option}
                                onClick={() => setDateFilter(option)}
                                className={`px-3 py-1.5 text-[12px] font-semibold rounded-md transition-all cursor-pointer ${dateFilter === option ? 'bg-background text-text-dark shadow-sm border border-border/50' : 'text-muted hover:text-text-dark hover:bg-black/5 border border-transparent'}`}
                            >
                                {option}
                            </button>
                        ))}
                    </div>

                    {/* Contact Status Filter Group */}
                    <div className="flex items-center bg-surface/60 p-1 rounded-lg border border-border/40 shrink-0">
                        {['All', 'New', 'Contacted'].map(option => (
                            <button
                                key={option}
                                onClick={() => setStatusFilter(option)}
                                className={`px-3 py-1.5 text-[12px] font-semibold rounded-md transition-all cursor-pointer ${statusFilter === option ? 'bg-background text-text-dark shadow-sm border border-border/50' : 'text-muted hover:text-text-dark hover:bg-black/5 border border-transparent'}`}
                            >
                                {option}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Loading state */}
                {loading ? (
                    <div className="flex-1 flex items-center justify-center py-20">
                        <div className="flex flex-col items-center gap-4">
                            <span className="w-8 h-8 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
                            <p className="text-[13px] font-medium text-muted">Loading contacts…</p>
                        </div>
                    </div>
                ) : filteredLeads.length === 0 ? (
                    /* Empty State */
                    <div className="flex-1 flex flex-col items-center justify-center py-20 px-4 bg-surface/10">
                        <div className="w-24 h-24 rounded-full bg-primary/5 flex items-center justify-center mb-6 border border-primary/10">
                            <FiUsers size={36} className="text-primary/40" />
                        </div>
                        <h3 className={`text-[20px] font-bold text-text-dark mb-2`}>No contacts found</h3>
                        <p className="text-[13.5px] text-muted text-center max-w-sm mb-8 font-medium leading-relaxed">
                            {searchQuery ? "Try adjusting your search or filters to find what you're looking for." : "Build your network by adding contacts manually or importing a CSV file."}
                        </p>
                        <div className="flex flex-col sm:flex-row gap-3">
                            <button onClick={() => setShowBulk(true)} className="px-5 py-2.5 bg-background border border-border rounded-lg text-[13px] font-semibold text-text-dark hover:bg-surface transition-colors shadow-sm">
                                Import CSV
                            </button>
                            <button onClick={() => { setEditingLead(null); setShowForm(true); }} className="px-5 py-2.5 bg-primary text-white rounded-lg text-[13px] font-semibold hover:bg-primary/90 transition-colors shadow-sm">
                                Add Contact
                            </button>
                        </div>
                    </div>
                ) : (
                    <>
                        {/* ── MOBILE: Accordion cards ── */}
                        <div className="lg:hidden flex-1 overflow-y-auto p-4 flex flex-col gap-3 min-h-0 bg-surface/10">
                            {paginatedLeads.map((lead) => (
                                <LeadAccordionRow key={lead._id} lead={lead} onDelete={handleDelete} onEdit={handleEdit} />
                            ))}
                        </div>

                        {/* ── DESKTOP: Full table ── */}
                        <div className="hidden lg:block flex-1 overflow-y-auto overflow-x-auto min-h-0 max-w-full">
                            <table className="w-full text-left border-collapse min-w-[800px]">
                                <thead className="sticky top-0 bg-surface/90 backdrop-blur-md z-20 border-b border-border/60">
                                    <tr>
                                        <th className="px-5 pb-2.5 pt-3.5 text-[11px] font-bold text-text-dark tracking-[0.05em] uppercase w-[25%] sticky left-0 bg-surface/95 backdrop-blur-md z-30 shadow-[1px_0_0_0_rgba(0,0,0,0.05)]">Contact</th>
                                        <th className="px-5 pb-2.5 pt-3.5 text-[11px] font-bold text-text-dark tracking-[0.05em] uppercase w-[20%]">Company</th>
                                        <th className="px-5 pb-2.5 pt-3.5 text-[11px] font-bold text-text-dark tracking-[0.05em] uppercase w-[20%]">Role</th>
                                        <th className="px-5 pb-2.5 pt-3.5 text-[11px] font-bold text-text-dark tracking-[0.05em] uppercase w-[15%]">HR Name</th>
                                        <th className="px-5 pb-2.5 pt-3.5 text-[11px] font-bold text-text-dark tracking-[0.05em] uppercase w-[15%]">Tags</th>
                                        <th className="px-5 pb-2.5 pt-3.5 text-[11px] font-bold text-text-dark tracking-[0.05em] uppercase text-right w-[5%]"></th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border/40">
                                    {paginatedLeads.map((lead) => (
                                        <tr
                                            key={lead._id}
                                            className="group hover:bg-surface/50 transition-colors cursor-pointer"
                                            onClick={() => setViewingLead(lead)}
                                        >
                                            <td className="px-5 py-3 sticky left-0 bg-background group-hover:bg-[#fafafa] transition-colors z-10 border-r border-transparent group-hover:border-border/30">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-9 h-9 rounded-full flex items-center justify-center shrink-0 font-bold text-[13px]" style={getAvatarStyle(lead.company)}>
                                                        {(lead.company || '?').charAt(0).toUpperCase()}
                                                    </div>
                                                    <div className="min-w-0">
                                                        <p className="text-[13px] font-semibold text-text-dark truncate max-w-[180px]">{lead.email}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-5 py-3 text-[13px] font-medium text-text-dark truncate max-w-[150px]">{lead.company}</td>
                                            <td className="px-5 py-3 text-[13px] font-medium text-text-dark truncate max-w-[150px]" title={lead.jobRole}>{lead.jobRole}</td>
                                            <td className="px-5 py-3 text-[13px] text-muted font-medium truncate">{lead.hrName || '—'}</td>
                                            <td className="px-5 py-3">
                                                {lead.tags?.length > 0 ? (
                                                    <div className="flex flex-wrap gap-1.5">
                                                        {lead.tags.slice(0, 2).map(tag => (
                                                            <span key={tag} className={`px-2 py-0.5 border text-[10.5px] font-bold rounded-full ${getTagStyle(tag)}`}>{tag}</span>
                                                        ))}
                                                        {lead.tags.length > 2 && (
                                                            <span className="px-1.5 py-0.5 bg-surface border border-border text-text-dark text-[10px] font-bold rounded-full">+{lead.tags.length - 2}</span>
                                                        )}
                                                    </div>
                                                ) : (
                                                    <span className="text-muted text-[13px]">—</span>
                                                )}
                                            </td>
                                            <td className="px-4 py-3 text-right">
                                                <div className="flex items-center justify-end gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); handleEdit(lead); }}
                                                        className="p-1.5 text-muted hover:text-primary hover:bg-primary/5 border border-transparent hover:border-primary/20 rounded-md transition-all cursor-pointer"
                                                        title="Edit"
                                                        aria-label={`Edit ${lead.email}`}
                                                    >
                                                        <FiEdit2 size={14} />
                                                    </button>
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); handleDelete(lead._id); }}
                                                        className="p-1.5 text-muted hover:text-red-600 hover:bg-red-50 border border-transparent hover:border-red-200 rounded-md transition-all cursor-pointer"
                                                        title="Delete"
                                                        aria-label={`Delete ${lead.email}`}
                                                    >
                                                        <FiTrash2 size={14} />
                                                    </button>
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); }}
                                                        className="p-1.5 text-muted hover:text-text-dark hover:bg-surface border border-transparent hover:border-border rounded-md transition-all cursor-pointer"
                                                        title="More Options"
                                                        aria-label={`More options for ${lead.email}`}
                                                    >
                                                        <FiMoreHorizontal size={14} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination Footer */}
                        {totalPages > 1 && (
                            <div className="px-5 py-3 border-t border-border/60 bg-surface/30 flex items-center justify-between shrink-0">
                                <p className="text-[12.5px] font-medium text-muted">
                                    Showing <span className="font-semibold text-text-dark">{(currentPage - 1) * itemsPerPage + 1}</span>–<span className="font-semibold text-text-dark">{Math.min(currentPage * itemsPerPage, filteredLeads.length)}</span> of <span className="font-semibold text-text-dark">{filteredLeads.length}</span> contacts
                                </p>
                                <div className="flex items-center gap-1">
                                    <button
                                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                        disabled={currentPage === 1}
                                        className="px-3 py-1.5 text-[12.5px] font-semibold text-text-dark hover:bg-background border border-transparent hover:border-border rounded-md transition-all disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:border-transparent cursor-pointer"
                                    >
                                        Previous
                                    </button>

                                    <div className="flex items-center gap-1 px-2">
                                        {[...Array(totalPages)].map((_, i) => {
                                            const page = i + 1;
                                            if (totalPages > 5 && (page < currentPage - 1 || page > currentPage + 1) && page !== 1 && page !== totalPages) {
                                                if (page === currentPage - 2 || page === currentPage + 2) return <span key={page} className="text-muted px-1">...</span>;
                                                return null;
                                            }
                                            return (
                                                <button
                                                    key={page}
                                                    onClick={() => setCurrentPage(page)}
                                                    className={`w-7 h-7 flex items-center justify-center rounded-md text-[12.5px] font-bold transition-all cursor-pointer ${currentPage === page ? 'bg-primary text-white shadow-sm' : 'text-text-dark hover:bg-background border border-transparent hover:border-border'}`}
                                                >
                                                    {page}
                                                </button>
                                            )
                                        })}
                                    </div>

                                    <button
                                        onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                        disabled={currentPage === totalPages}
                                        className="px-3 py-1.5 text-[12.5px] font-semibold text-text-dark hover:bg-background border border-transparent hover:border-border rounded-md transition-all disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:border-transparent cursor-pointer"
                                    >
                                        Next
                                    </button>
                                </div>
                            </div>
                        )}
                    </>
                )}
            </section>
        </div>
    );
};

export default Leads;
