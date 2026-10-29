"use client"

import React, { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { FiMenu, FiX } from 'react-icons/fi'

const navLinks = [
    { label: "Features", href: "#features" },
    { label: "Solutions", href: "#how-it-works" },
    { label: "Resources", href: "#faq" },
];

const Navbar = () => {
    const [menuOpen, setMenuOpen] = useState(false);

    const closeMenu = () => setMenuOpen(false);

    return (
        <nav className="relative h-[60px] max-w-[1280px] w-full mx-auto flex justify-between items-center px-6 sm:px-8 lg:px-12">

            {/* Left - Logo */}
            <div className="flex items-center shrink-0">
                <Link href="/" className="flex items-center gap-2" aria-label="Desento">
                    <Image src="/icon.svg" alt="Desento Logo" width={24} height={24} className="w-6 h-6" />
                    <h1 className="text-lg font-bold tracking-tight text-primary">
                        Desento<span className="text-secondary">.</span>
                    </h1>
                </Link>
            </div>

            {/* Center - Links (desktop) */}
            <ul className="hidden lg:flex items-center absolute left-1/2 -translate-x-1/2 gap-7">
                {navLinks.map(({ label, href }) => (
                    <li key={label}>
                        <Link href={href} className="flex items-center gap-1.5 text-base font-medium text-text hover:text-text-dark transition-colors">
                            {label}
                        </Link>
                    </li>
                ))}
            </ul>

            {/* Right - Auth (desktop) */}
            <div className="hidden sm:flex items-center gap-5 shrink-0">
                <Link href="/login" className="text-base font-medium text-text hover:text-text-dark transition-colors">
                    Log in
                </Link>
                <Link
                    href="/signup"
                    className="flex items-center justify-center px-4 py-2 rounded-full border border-border/80 bg-surface/50 text-base font-medium text-text-dark hover:bg-border/30 transition-colors backdrop-blur-sm shadow-sm"
                >
                    Get started
                </Link>
            </div>

            {/* Right - CTA + hamburger (mobile) */}
            <div className="flex sm:hidden items-center gap-2 shrink-0">
                <Link
                    href="/signup"
                    className="flex items-center justify-center px-4 py-2 rounded-full border border-border/80 bg-surface/50 text-[15px] font-medium text-text-dark shadow-sm"
                >
                    Get started
                </Link>
                <button
                    onClick={() => setMenuOpen(o => !o)}
                    aria-label={menuOpen ? "Close menu" : "Open menu"}
                    aria-expanded={menuOpen}
                    className="p-2 rounded-lg text-text-dark hover:bg-surface transition-colors cursor-pointer"
                >
                    {menuOpen ? <FiX size={22} /> : <FiMenu size={22} />}
                </button>
            </div>

            {/* Mobile dropdown menu */}
            {menuOpen && (
                <div className="lg:hidden absolute top-full left-0 right-0 z-50 bg-white border-b border-border shadow-xl rounded-b-xl overflow-hidden">
                    <ul className="flex flex-col py-2">
                        {navLinks.map(({ label, href }) => (
                            <li key={label}>
                                <Link
                                    href={href}
                                    onClick={closeMenu}
                                    className="block px-6 py-3 text-[15px] font-medium text-text hover:text-text-dark hover:bg-surface transition-colors"
                                >
                                    {label}
                                </Link>
                            </li>
                        ))}
                    </ul>
                    <div className="border-t border-border py-2">
                        <Link
                            href="/login"
                            onClick={closeMenu}
                            className="block px-6 py-3 text-[15px] font-medium text-text hover:text-text-dark hover:bg-surface transition-colors"
                        >
                            Log in
                        </Link>
                    </div>
                </div>
            )}

        </nav>
    )
}

export default Navbar
