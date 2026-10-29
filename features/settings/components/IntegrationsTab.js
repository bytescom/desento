"use client"
import React, { useEffect, useState } from 'react'
import { useSession, signIn } from 'next-auth/react'
import { FiCheckCircle, FiAlertTriangle, FiX, FiZap, FiLoader } from 'react-icons/fi'

const IntegrationsTab = () => {
    const { data: session, status } = useSession();
    const [gmailConnected, setGmailConnected] = useState(null); // null = loading
    const [disconnecting, setDisconnecting] = useState(false);
    const [disconnectError, setDisconnectError] = useState('');

    useEffect(() => {
        async function loadConnection() {
            try {
                const res = await fetch('/api/user/profile');
                const { data } = await res.json();
                setGmailConnected(!!data?.gmailConnected);
            } catch {
                setGmailConnected(!!session?.user?.email);
            }
        }
        if (status === 'authenticated') loadConnection();
    }, [status, session]);

    const gmailEmail = session?.user?.email;
    const isConnected = status === 'authenticated' && gmailConnected === true;

    const handleDisconnect = async () => {
        if (!window.confirm('Disconnect Gmail? You will stay signed in to Desento, but campaigns cannot send emails until you reconnect.')) return;
        setDisconnecting(true);
        setDisconnectError('');
        try {
            const res = await fetch('/api/user/disconnect-gmail', { method: 'POST' });
            const data = await res.json();
            if (!res.ok || !data.success) {
                setDisconnectError(data.error || 'Failed to disconnect Gmail.');
            } else {
                setGmailConnected(false);
            }
        } catch {
            setDisconnectError('Network error. Please try again.');
        } finally {
            setDisconnecting(false);
        }
    };

    return (
        <div className="animate-in fade-in slide-in-from-bottom-2 duration-300 w-full max-w-full">
            {/* Gmail / Google OAuth */}
            <div className="grid grid-cols-1 md:grid-cols-[280px_1fr] gap-6 py-8 border-b border-border last:border-0 first:pt-0 w-full">
                <div>
                    <h3 className="text-[15px] font-bold text-text-dark mb-1">Google Workspace</h3>
                    <p className="text-[13px] text-muted leading-relaxed">Required to dispatch emails and track replies on your behalf.</p>
                </div>
                <div className="flex flex-col gap-4 w-full lg:w-3/4">
                    <div className="flex items-center justify-between px-5 py-4 bg-background border border-border rounded-xl">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-surface border border-border rounded-md flex items-center justify-center shrink-0">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                                </svg>
                            </div>
                            <div>
                                <h4 className="text-[14px] font-bold text-text-dark">Gmail Account</h4>
                                {isConnected ? (
                                    <p className="text-[13px] text-emerald-600 flex items-center gap-1.5 font-medium">
                                        <FiCheckCircle size={12} /> {gmailEmail}
                                    </p>
                                ) : (
                                    <p className="text-[13px] text-muted">Not connected</p>
                                )}
                            </div>
                        </div>

                        {status !== 'authenticated' ? (
                            <button
                                onClick={() => signIn('google')}
                                className="flex items-center gap-1.5 px-4 py-2 bg-primary text-white rounded-lg text-[13px] font-bold hover:opacity-90 transition-colors cursor-pointer"
                            >
                                Connect Gmail
                            </button>
                        ) : gmailConnected === null ? (
                            <span className="px-4 py-2 text-[13px] font-bold text-muted">Checking…</span>
                        ) : isConnected ? (
                            <button
                                onClick={handleDisconnect}
                                disabled={disconnecting}
                                className="flex items-center gap-1.5 px-4 py-2 border border-red-200 bg-red-50 text-red-500 rounded-lg text-[13px] font-bold hover:bg-red-100 transition-colors cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
                            >
                                {disconnecting ? <FiLoader size={13} className="animate-spin" /> : <FiX size={13} />}
                                {disconnecting ? 'Disconnecting…' : 'Disconnect'}
                            </button>
                        ) : (
                            <button
                                onClick={() => signIn('google')}
                                className="flex items-center gap-1.5 px-4 py-2 bg-primary text-white rounded-lg text-[13px] font-bold hover:opacity-90 transition-colors cursor-pointer"
                            >
                                Connect Gmail
                            </button>
                        )}
                    </div>

                    {disconnectError && (
                        <div className="px-4 py-3 bg-red-50 border border-red-100 rounded-lg text-[13px] font-medium text-red-600">
                            {disconnectError}
                        </div>
                    )}

                    {/* Status banner */}
                    {!isConnected ? (
                        <div className="p-4 bg-surface border border-border rounded-xl flex items-start gap-3">
                            <FiAlertTriangle className="text-orange-400 mt-0.5 shrink-0" size={15} />
                            <p className="text-[13px] text-text leading-relaxed">
                                We use OAuth to securely connect to your Gmail. We never store passwords — only permission to <strong>send emails</strong> on your behalf.
                            </p>
                        </div>
                    ) : (
                        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-start gap-3">
                            <FiCheckCircle className="text-emerald-500 mt-0.5 shrink-0" size={15} />
                            <p className="text-[13px] text-emerald-700 leading-relaxed font-medium">
                                Gmail connected. Emails from the Outreach page will be sent from <strong>{gmailEmail}</strong>.
                            </p>
                        </div>
                    )}
                </div>
            </div>

            {/* AI Engine — Coming Soon */}
            <div className="grid grid-cols-1 md:grid-cols-[280px_1fr] gap-6 py-8 w-full">
                <div>
                    <h3 className="text-[15px] font-bold text-text-dark mb-1">AI Engine</h3>
                    <p className="text-[13px] text-muted leading-relaxed">Configure the AI model powering your email generation.</p>
                </div>
                <div className="w-full lg:w-3/4">
                    <div className="flex items-center gap-4 px-5 py-4 bg-background border border-border rounded-xl">
                        <div className="w-10 h-10 bg-surface border border-border rounded-md flex items-center justify-center shrink-0">
                            <FiZap size={18} className="text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <h4 className="text-[14px] font-bold text-text-dark">Gemini 2.0 Flash</h4>
                            <p className="text-[13px] text-muted font-medium">Default model for all email generation tasks</p>
                        </div>
                        <span className="px-2.5 py-1 bg-primary/10 text-primary text-[11px] font-extrabold rounded-full border border-primary/20">ACTIVE</span>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default IntegrationsTab;
