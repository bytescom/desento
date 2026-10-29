import Link from "next/link";
import Image from "next/image";
import { FiTwitter, FiGithub, } from "react-icons/fi";

export default function Footer() {
    const currentYear = new Date().getFullYear();

    const footerSections = [
        {
            title: "Support",
            links: [{ name: "Contact", href: "/contact" }],
        },
        {
            title: "Legal",
            links: [
                { name: "Privacy Policy", href: "/privacy" },
                { name: "Terms of Service", href: "/terms" },
            ],
        },
        {
            title: "Product",
            links: [
                { name: "Features", href: "/#features" },
                { name: "Pricing", href: "/#cta" },
                { name: "Waitlist", href: "/signup" },
            ],
        },
    ];

    const socialLinks = [
        { name: "Twitter", href: "https://x.com/justpankajk", icon: FiTwitter },
        { name: "GitHub", href: "https://github.com/bytescom", icon: FiGithub },
    ];

    return (
        <footer id="footer" className="w-full border-t border-border bg-surface text-text-dark relative overflow-hidden">
            {/* Background Pattern */}
            <div className="absolute inset-0 -z-10">
                <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent" />
                <div className="absolute inset-0 bg-white opacity-50" />
            </div>

            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
                <div className="grid gap-8 lg:grid-cols-12 mb-12">
                    {/* Brand Section */}
                    <div className="lg:col-span-4 space-y-6">
                        <Link href="/" className="flex items-center gap-2" aria-label="Desento">
                            <Image src="/icon.svg" alt="Desento Logo" width={24} height={24} className="w-6 h-6" />
                            <h1 className="text-lg sm:text-xl font-bold tracking-tight text-primary">
                                Desento<span className="text-secondary">.</span>
                            </h1>
                        </Link>
                    </div>

                    {/* Links Sections */}
                    <div className="lg:col-span-8">
                        <div className="grid gap-10 sm:grid-cols-3 px-1 md:px-0">
                            {footerSections.map((section) => (
                                <div key={section.title} className="space-y-5">
                                    <h4 className="text-sm font-bold uppercase tracking-wider text-text-dark">
                                        {section.title}
                                    </h4>
                                    <ul className="space-y-3">
                                        {section.links.map((link) => (
                                            <li key={link.name}>
                                                <Link
                                                    href={link.href}
                                                    className="text-sm font-medium text-text/80 hover:text-primary transition-colors duration-200 block"
                                                >
                                                    {link.name}
                                                </Link>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Bottom Section */}
                <div className="flex flex-col sm:flex-row justify-between items-center gap-4 border-t border-border text-sm pt-8">
                    <p className="text-text/70 font-medium">
                        &copy; {currentYear} Desento by{" "}
                        <Link
                            href="https://x.com/justpankajk"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary hover:text-primary/80 transition-colors font-bold"
                        >
                            justpankajk
                        </Link>
                    </p>

                    <div className="flex flex-wrap items-center gap-6">
                        {socialLinks.map((social) => (
                            <Link
                                key={social.name}
                                href={social.href}
                                target="_blank"
                                className="flex items-center justify-center w-10 h-10 rounded-lg bg-gray-100 hover:bg-primary hover:text-white text-text-dark transition-all duration-300 hover:scale-110"
                                aria-label={social.name}
                            >
                                <social.icon className="w-4 h-4" />
                            </Link>
                        ))}
                    </div>
                </div>
            </div>
        </footer>
    );
}
