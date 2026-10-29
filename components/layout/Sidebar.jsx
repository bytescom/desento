"use client";

import React, { useState, useRef, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { LuPanelLeftClose, LuPanelRightClose } from "react-icons/lu";
import { FiGrid, FiBriefcase, FiFileText, FiUser, FiClock, FiSettings, FiCheckCircle, FiLogOut, FiChevronUp, FiMenu, FiX } from "react-icons/fi";
import { Playfair_Display } from "next/font/google";


const serif = Playfair_Display({
    subsets: ["latin"],
    weight: ["400", "500", "600", "700"],
});

const navItems = [
    { name: 'Dashboard', path: '/dashboard', icon: <FiGrid size={20} strokeWidth={1.5} /> },
    { name: 'Leads', path: '/dashboard/leads', icon: <FiBriefcase size={20} strokeWidth={1.5} /> },
    { name: 'Outreach', path: '/dashboard/outreach', icon: <FiFileText size={20} strokeWidth={1.5} /> },
    { name: 'Follow Ups', path: '/dashboard/follow-up', icon: <FiUser size={20} strokeWidth={1.5} /> },
    { name: 'Tracking', path: '/dashboard/tracking', icon: <FiClock size={20} strokeWidth={1.5} /> },
    { name: 'Settings', path: '/dashboard/settings', icon: <FiSettings size={20} strokeWidth={1.5} /> },
];

/**
 * UserAvatar — priority order:
 *  1. Google profile image (src prop)
 *  2. DiceBear "notionists-neutral" illustrated avatar (seeded from email)
 *  3. Gradient initials fallback
 */
function UserAvatar({ src, name, email, size = 40, className = "" }) {
    const [googleError, setGoogleError]   = useState(false);
    const [dicebearError, setDicebearError] = useState(false);

    const gradients = [
        "from-violet-500 to-indigo-500",
        "from-rose-500 to-pink-500",
        "from-amber-500 to-orange-500",
        "from-emerald-500 to-teal-500",
        "from-sky-500 to-blue-500",
        "from-fuchsia-500 to-purple-500",
    ];
    const gradientIndex = name ? name.charCodeAt(0) % gradients.length : 0;
    const gradient = gradients[gradientIndex];

    const initials = name
        ? name.split(" ").map(n => n[0]).slice(0, 2).join("").toUpperCase()
        : "?";

    const seed = encodeURIComponent(email || name || "user");
    const dicebearUrl = `https://api.dicebear.com/9.x/notionists-neutral/svg?seed=${seed}&backgroundColor=b6e3f4,c0aede,d1d4f9,ffd5dc,ffdfbf,f0f0f0&backgroundType=gradientLinear&radius=50`;

    if (src && !googleError) {
        return (
            <Image
                src={src}
                alt={name || "User avatar"}
                width={size}
                height={size}
                referrerPolicy="no-referrer"
                className={`w-full h-full object-cover ${className}`}
                onError={() => setGoogleError(true)}
            />
        );
    }

    if (!dicebearError) {
        return (
            // eslint-disable-next-line @next/next/no-img-element
            <img
                src={dicebearUrl}
                alt={name || "Generated avatar"}
                width={size}
                height={size}
                className={`w-full h-full object-cover ${className}`}
                onError={() => setDicebearError(true)}
            />
        );
    }

    return (
        <span className={`flex items-center justify-center w-full h-full text-white font-bold bg-gradient-to-br ${gradient} text-[13px] ${className}`}>
            {initials}
        </span>
    );
}

export default function Sidebar() {
    const pathname = usePathname();
    const { data: session, status } = useSession();
    const [isOpen, setIsOpen] = useState(true);
    const [profileOpen, setProfileOpen] = useState(false);
    const [mobileOpen, setMobileOpen] = useState(false);
    const footerRef = useRef(null);
    const menuRef = useRef(null);

    const toggleSidebar = () => setIsOpen(prev => !prev);

    const [popupStyle, setPopupStyle] = useState({});

    // Derive user info from session
    const userName = session?.user?.name || "User";
    const displayEmail = session?.user?.email || "";
    const avatarSrc = session?.user?.image || null;
    const firstName = userName.split(" ")[0];

    useEffect(() => {
        const updatePosition = () => {
            if (profileOpen && footerRef.current) {
                const rect = footerRef.current.getBoundingClientRect();
                setPopupStyle({
                    bottom: window.innerHeight - rect.top + 8,
                    left: rect.left,
                    width: isOpen ? rect.width : 256,
                });
            }
        };
        updatePosition();
        window.addEventListener('resize', updatePosition);
        return () => window.removeEventListener('resize', updatePosition);
    }, [profileOpen, isOpen]);

    useEffect(() => {
        function handleClickOutside(e) {
            if (
                profileOpen &&
                footerRef.current && !footerRef.current.contains(e.target) &&
                menuRef.current && !menuRef.current.contains(e.target)
            ) {
                setProfileOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [profileOpen]);

    const handleSignOut = () => {
        setProfileOpen(false);
        signOut({ callbackUrl: "/login" });
    };

    return (
        <>
            {/* Mobile Topbar */}
            <div className="md:hidden flex items-center justify-between p-4 bg-background/90 backdrop-blur-xl border border-border/50 rounded-xl shrink-0 w-full shadow-sm relative z-30">
                <Link href="/" className="flex items-center gap-3 group" aria-label="Desento">
                    <Image src="/icon.svg" alt="Desento Logo" width={28} height={28} className="w-7 h-7" />
                    <h1 className="text-xl font-black tracking-tighter text-primary transition-colors">
                        Desento<span className="text-secondary">.</span>
                    </h1>
                </Link>
                <button
                    onClick={() => setMobileOpen(true)}
                    className="p-1.5 rounded-lg text-text hover:bg-surface hover:text-primary transition-colors cursor-pointer"
                >
                    <FiMenu size={24} />
                </button>
            </div>

            {/* Mobile Overlay */}
            {mobileOpen && (
                <div
                    className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 md:hidden"
                    onClick={() => setMobileOpen(false)}
                />
            )}

            {/* Sidebar (Desktop or Mobile Drawer) */}
            <aside className={`
                ${mobileOpen ? "fixed inset-y-2 left-2 z-50 flex h-[calc(100vh-16px)]" : "hidden"} 
                md:sticky md:top-2 md:flex md:h-[calc(100vh-16px)]
                shrink-0 bg-background/90 backdrop-blur-xl border border-border/50 shadow-sm rounded-xl flex-col justify-between transition-all duration-300 
                ${isOpen || mobileOpen ? "w-72" : "w-16"} overflow-visible
            `}>
                <nav className="overflow-y-auto overflow-x-hidden flex-1 no-scrollbar">
                    <div className={`p-5 rounded-t-lg border-b border-text/20 flex items-center ${isOpen || mobileOpen ? "justify-between" : "justify-center"}`}>
                        {(isOpen || mobileOpen) && (
                            <Link href="/" className="flex items-center gap-3 group" aria-label="Desento">
                                <Image src="/icon.svg" alt="Desento Logo" width={28} height={28} className="w-7 h-7" />
                                <h1 className="text-xl font-black tracking-tighter text-primary transition-colors">
                                    Desento<span className="text-secondary">.</span>
                                </h1>
                            </Link>
                        )}

                        {/* Desktop Toggle Button */}
                        <button onClick={toggleSidebar} className='hidden md:block cursor-pointer text-text hover:text-primary transition-colors'>
                            {isOpen ? <LuPanelLeftClose size={22} /> : <LuPanelRightClose size={22} />}
                        </button>

                        {/* Mobile Close Button */}
                        <button onClick={() => setMobileOpen(false)} className='md:hidden cursor-pointer text-text hover:text-primary p-1 rounded-lg hover:bg-surface transition-colors'>
                            <FiX size={22} />
                        </button>
                    </div>

                    <div className={`flex flex-col gap-5 ${isOpen || mobileOpen ? 'p-5' : 'py-5 px-2'}`}>
                        {(isOpen || mobileOpen) && (
                            <div className='flex gap-2'>
                                <h2 className={`text-xl leading-[1.2] text-text ${serif.className}`}>Welcome back,</h2>
                                <h2 className={`text-xl leading-[1.2] font-semibold text-primary ${serif.className}`}>{firstName} :)</h2>
                            </div>
                        )}

                        <div className={isOpen || mobileOpen ? 'grid grid-cols-2 gap-2' : 'flex flex-col gap-2 items-center'}>
                            {navItems.filter(Boolean).map((item) => {
                                if (!item?.path) return null;
                                const isActive = item.path === '/dashboard'
                                    ? pathname === '/dashboard'
                                    : pathname?.startsWith(item.path);
                                return (
                                    <Link
                                        key={item.name}
                                        href={item.path}
                                        onClick={() => setMobileOpen(false)}
                                        className={`cursor-pointer transition-all border flex items-center justify-center rounded-xl shadow-sm ${isOpen || mobileOpen
                                            ? 'min-h-[60px] w-full flex-col gap-1.5 px-2 py-3'
                                            : 'w-10 h-10'
                                            } ${isActive
                                                ? 'bg-primary border-primary text-white shadow-primary/20 hover:opacity-90'
                                                : 'bg-surface border-border text-text hover:bg-surface'
                                            } focus:outline-none focus:ring-2 focus:ring-primary/20`}
                                    >
                                        {React.cloneElement(item.icon, { className: isActive ? 'text-white' : 'text-primary' })}
                                        {(isOpen || mobileOpen) && (
                                            <span className={`text-[14px] leading-tight text-center w-full truncate ${serif.className} ${isActive ? 'text-white' : 'text-text'}`}>
                                                {item.name}
                                            </span>
                                        )}
                                    </Link>
                                );
                            })}
                        </div>
                    </div>
                </nav>

                <div className="border-t border-text/20 relative">
                    {/* Popup menu */}
                    {profileOpen && (
                        <>
                            <div className="fixed inset-0" style={{ zIndex: 9998 }} onClick={() => setProfileOpen(false)} />
                            <div ref={menuRef} className="fixed bg-background border border-border rounded-2xl shadow-xl overflow-hidden" style={{ ...popupStyle, zIndex: 9999 }}>
                                <div className="flex items-center gap-3 px-4 py-4 border-b border-border bg-surface">
                                    <div className="w-11 h-11 rounded-xl overflow-hidden border border-border shrink-0">
                                        <UserAvatar src={avatarSrc} name={userName} email={displayEmail} size={44} />
                                    </div>
                                    <div className="min-w-0 pr-2">
                                        <p className="text-[14px] font-bold text-text-dark flex items-center gap-1 truncate">
                                            {userName} <FiCheckCircle className="text-primary shrink-0" size={12} />
                                        </p>
                                        <p className="text-[12px] text-text font-medium truncate">{displayEmail || "\u00A0"}</p>
                                    </div>
                                </div>
                                <div className="py-1.5">
                                    <Link
                                        href="/dashboard/settings"
                                        onClick={() => setProfileOpen(false)}
                                        className="w-full flex items-center gap-3 px-4 py-3 text-[13px] font-semibold text-text hover:bg-surface hover:text-primary transition-colors"
                                    >
                                        <FiUser size={15} className="text-muted" /> Profile & Settings
                                    </Link>
                                    <div className="mx-4 my-1 border-t border-border" />
                                    <button
                                        onClick={handleSignOut}
                                        className="w-full flex items-center gap-3 px-4 py-3 text-[13px] font-semibold text-red-500 hover:bg-red-50 transition-colors cursor-pointer"
                                    >
                                        <FiLogOut size={15} className="text-red-400" /> Sign out
                                    </button>
                                </div>
                            </div>
                        </>
                    )}

                    {/* Footer button */}
                    <button
                        ref={footerRef}
                        onClick={() => setProfileOpen(prev => !prev)}
                        className={`w-full flex items-center rounded-b-xl cursor-pointer transition-all group active:scale-[0.98] ${isOpen || mobileOpen ? 'justify-between p-5' : 'justify-center py-5 px-2'} ${profileOpen ? 'bg-surface' : 'hover:bg-surface'}`}
                    >
                        <div className="flex items-center gap-3 min-w-0">
                            <div className="w-10 h-10 rounded-lg overflow-hidden border border-border shrink-0">
                                <UserAvatar src={avatarSrc} name={userName} email={displayEmail} size={40} />
                            </div>
                            {(isOpen || mobileOpen) && (
                                <div className="flex flex-col items-start leading-tight min-w-0">
                                    <span className="text-[14px] font-semibold text-text-dark flex items-center gap-1 group-hover:text-primary transition-colors truncate max-w-full">
                                        <span className="truncate">{status === 'loading' ? '…' : firstName}</span>
                                        <FiCheckCircle className="text-primary w-3 h-3 shrink-0" />
                                    </span>
                                    <span className="text-xs text-text font-medium truncate max-w-full">{displayEmail}</span>
                                </div>
                            )}
                        </div>
                        {(isOpen || mobileOpen) && (
                            <div className={`shrink-0 ml-2 rounded-full p-2 transition-colors ${profileOpen ? 'bg-primary/10' : 'bg-surface group-hover:bg-gray-200'}`}>
                                <FiChevronUp className={`h-4 w-4 text-text transition-transform duration-200 ${profileOpen ? 'rotate-0' : 'rotate-180'}`} />
                            </div>
                        )}
                    </button>
                </div>
            </aside>
        </>
    );
}
