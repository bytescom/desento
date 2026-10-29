"use client"
import React, { useState, useRef } from 'react'
import { FiX, FiInfo } from 'react-icons/fi';
import { useScrollLock } from "@/lib/useScrollLock";


const TemplateEditorModal = ({ onClose, onSave, initialData, saveToDb }) => {
    useScrollLock(true);
    const [name, setName] = useState(initialData?.name || '');
    const [subject, setSubject] = useState(initialData?.subject || '');
    const [content, setContent] = useState(initialData?.body || initialData?.content || 'Hi {{name}},\n\n');
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const textareaRef = useRef(null);

    const handleSave = async () => {
        if (!name.trim() || !subject.trim() || !content.trim()) {
            setError('Name, subject, and content are required.');
            return;
        }
        if (!saveToDb) {
            onSave({ name: name.trim(), subject: subject.trim(), body: content, content });
            return;
        }
        // Persist to DB so the campaign keeps a real templateId and the
        // template appears in the Templates tab.
        setSaving(true);
        setError('');
        try {
            const res = await fetch('/api/outreach/templates', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: name.trim(), subject: subject.trim(), body: content }),
            });
            const data = await res.json();
            if (!res.ok) {
                setError(data.error || 'Failed to save template.');
                setSaving(false);
                return;
            }
            onSave(data.template);
        } catch {
            setError('Network error. Please try again.');
            setSaving(false);
        }
    };

    const insertVariable = (variable) => {
        const start = textareaRef.current.selectionStart;
        const end = textareaRef.current.selectionEnd;
        const newContent = content.substring(0, start) + variable + content.substring(end);
        setContent(newContent);
        
        // Reset cursor position
        setTimeout(() => {
            textareaRef.current.focus();
            textareaRef.current.setSelectionRange(start + variable.length, start + variable.length);
        }, 0);
    };

    const variables = [
        { label: 'Full Name', tag: '{{name}}' },
        { label: 'Company', tag: '{{company}}' },
        { label: 'Job Role', tag: '{{job_role}}' },
        { label: 'Location', tag: '{{location}}' },
        { label: 'Industry', tag: '{{industry}}' },
    ];

    return (
        <div className="fixed inset-0 z-[100] flex justify-end">
            {/* Backdrop */}
            <div 
                className="absolute inset-0 bg-black/20 backdrop-blur-sm transition-opacity animate-in fade-in duration-200" 
                onClick={onClose} 
            />
            
            {/* Slide Panel */}
            <div className="relative w-full sm:w-[600px] h-full bg-white shadow-2xl border-l border-border/50 flex flex-col animate-in slide-in-from-right duration-300">
                
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-border/50 bg-[#f9f9f9]">
                    <div className="flex flex-col">
                        <h2 className={`text-[20px] font-bold text-text-dark`}>Create Email Template</h2>
                        <p className="text-[12px] font-medium text-muted">Design a reusable template for your campaigns.</p>
                    </div>
                    <button 
                        onClick={onClose}
                        className="p-2 rounded-lg hover:bg-border/50 text-muted hover:text-text-dark transition-colors cursor-pointer"
                    >
                        <FiX size={18} />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-5">

                    {error && (
                        <div className="px-4 py-3 bg-red-50 border border-red-100 rounded-lg text-[13px] font-medium text-red-600 flex items-center gap-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0" />
                            {error}
                        </div>
                    )}

                    <div>
                        <label className="block text-[13px] font-bold text-text-dark mb-1">Template Name</label>
                        <input
                            type="text"
                            placeholder="e.g., Initial Outreach - Tech Founders"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="w-full px-4 py-3 bg-[#f9f9f9] border border-border/60 rounded-xl text-[14px] font-medium text-text-dark outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all"
                        />
                        <p className="text-[11px] text-muted mt-1.5 font-medium">This is for internal organization only.</p>
                    </div>

                    <div>
                        <label className="block text-[13px] font-bold text-text-dark mb-1">Subject Line</label>
                        <input
                            type="text"
                            placeholder="Quick question about {{company}}"
                            value={subject}
                            onChange={(e) => setSubject(e.target.value)}
                            className="w-full px-4 py-3 bg-[#f9f9f9] border border-border/60 rounded-xl text-[14px] font-medium text-text-dark outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all"
                        />
                    </div>

                    <div className="flex flex-col flex-1 min-h-[300px]">
                        <label className="block text-[13px] font-bold text-text-dark mb-1">Email Content</label>
                        <div className="flex-1 border border-border/60 rounded-xl overflow-hidden flex flex-col bg-[#f9f9f9] focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/10 transition-all">
                            {/* Rich text formatting bar placeholder */}
                            <div className="px-4 py-2 border-b border-border/60 bg-white flex items-center gap-4">
                                <span className="font-bold text-[14px] cursor-pointer text-text-dark">B</span>
                                <span className="italic font-serif text-[14px] cursor-pointer text-text-dark">I</span>
                                <span className="cursor-pointer text-muted"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="8" y1="6" x2="21" y2="6"></line><line x1="8" y1="12" x2="21" y2="12"></line><line x1="8" y1="18" x2="21" y2="18"></line><line x1="3" y1="6" x2="3.01" y2="6"></line><line x1="3" y1="12" x2="3.01" y2="12"></line><line x1="3" y1="18" x2="3.01" y2="18"></line></svg></span>
                                <span className="cursor-pointer text-muted"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="8" y1="6" x2="21" y2="6"></line><line x1="8" y1="12" x2="21" y2="12"></line><line x1="8" y1="18" x2="21" y2="18"></line><line x1="3" y1="6" x2="4" y2="6"></line><line x1="3" y1="12" x2="4" y2="12"></line><line x1="3" y1="18" x2="4" y2="18"></line></svg></span>
                                <span className="cursor-pointer text-muted"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path></svg></span>
                            </div>
                            <textarea
                                ref={textareaRef}
                                value={content}
                                onChange={(e) => setContent(e.target.value)}
                                className="flex-1 w-full p-4 bg-transparent outline-none resize-none text-[14px] text-text-dark leading-relaxed"
                                placeholder="Write your email template here..."
                            />
                        </div>
                    </div>

                    {/* Variables Panel */}
                    <div className="bg-[#f9f9f9] border border-border/60 rounded-xl p-4">
                        <div className="flex items-center gap-2 mb-3">
                            <h3 className="text-[13px] font-bold text-text-dark">Available Variables</h3>
                            <span className="px-2 py-0.5 bg-white border border-border/60 rounded text-[10px] font-bold text-muted">Personalization</span>
                        </div>
                        <p className="text-[12px] text-muted mb-3 font-medium">Click a variable to insert it at your cursor position.</p>
                        
                        <div className="flex flex-wrap gap-2">
                            {variables.map((v, i) => (
                                <button
                                    key={i}
                                    onClick={() => insertVariable(v.tag)}
                                    className="px-3 py-1.5 bg-white border border-border/60 rounded-lg text-[12px] font-medium text-text-dark hover:border-primary/40 hover:bg-primary/5 transition-colors cursor-pointer flex items-center gap-1.5 shadow-sm"
                                >
                                    <span className="text-primary bg-primary/10 px-1.5 py-0.5 rounded">{v.tag}</span>
                                    <span className="font-bold text-muted">{v.label}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                </div>

                {/* Footer Actions */}
                <div className="p-5 border-t border-border/50 bg-white flex justify-end gap-3 shrink-0">
                    <button 
                        onClick={onClose}
                        className="px-6 py-2.5 bg-white border border-border text-text-dark text-[14px] font-bold rounded-xl hover:bg-surface transition-colors cursor-pointer shadow-sm"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="px-6 py-2.5 bg-primary text-white text-[14px] font-bold rounded-xl hover:bg-primary/90 transition-colors cursor-pointer shadow-sm disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                        {saving ? 'Saving...' : 'Save Template'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default TemplateEditorModal;
