"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { FiChevronDown } from 'react-icons/fi';
import { MdHelp, MdSecurity, MdBolt, MdAutoAwesome, MdCheckCircle, MdMenuBook, MdPayment } from 'react-icons/md';

const faqData = [
    {
        question: "How does Desento work?",
        answer: "Desento is a full-stack outreach platform. You import your prospect list, define your value proposition, and our AI generates hyper-personalized outreach emails. These are sent directly from your connected email account, and replies are tracked on a central dashboard.",
        icon: <MdHelp size={24} />,
        category: "Product"
    },
    {
        question: "Is my email account safe to connect?",
        answer: "Absolutely. We use secure OAuth2 authentication for providers like Google. Desento never stores your email password and only sends emails with your direct permission.",
        icon: <MdSecurity size={24} />,
        category: "Security"
    },
    {
        question: "Will the outreach emails look like spam?",
        answer: "No. Desento generates highly personalized, context-aware emails based on the prospect's profile, making them look like a human researched and wrote them individually.",
        icon: <MdAutoAwesome size={24} />,
        category: "AI"
    },
    {
        question: "Can I track my outreach campaigns?",
        answer: "Yes. Desento includes an intuitive tracking dashboard where you can see open rates, reply rates, follow-up statuses, and booked meetings in real-time.",
        icon: <MdCheckCircle size={24} />,
        category: "Features"
    },
    {
        question: "Do I need technical skills to use Desento?",
        answer: "Not at all. Desento is designed for simplicity and ease of use. You can import prospects with a simple CSV, review AI-generated copy, and launch campaigns in minutes.",
        icon: <MdMenuBook size={24} />,
        category: "General"
    },
];

const Faqs = () => {
    const [openIndex, setOpenIndex] = useState(null);

    const toggleFaq = (index) => {
        setOpenIndex(openIndex === index ? null : index);
    };

    return (
        <div className='overflow-x-hidden'>
            <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">

                {/* Header */}
                <div className="text-center max-w-3xl mx-auto mb-10 sm:mb-16 md:mb-20">
                    <h2 className="text-4xl md:text-5xl font-extrabold text-text-dark mb-5 tracking-tight leading-tight">
                        Frequently <span className="text-secondary">Asked Questions</span>
                    </h2>
                    <p className="text-lg text-text/80 font-medium tracking-wide">
                        Find answers to common questions about our platform.
                    </p>
                </div>

                {/* FAQ Accordion */}
                <div className="space-y-4">
                    {faqData.map((faq, i) => {
                        const isOpen = openIndex === i;
                        return (
                            <div
                                key={i}
                                className={`border rounded-xl transition-all duration-300 overflow-hidden ${isOpen
                                    ? 'border-primary bg-primary/10 shadow-md shadow-primary/5'
                                    : 'border-gray-200 bg-white hover:border-primary/75 hover:shadow-sm'
                                    }`}
                            >
                                <button
                                    onClick={() => toggleFaq(i)}
                                    aria-expanded={isOpen}
                                    className="w-full text-left px-6 py-5 md:py-6 flex items-start gap-4 focus:outline-none"
                                >
                                    <div className={`mt-0.5 shrink-0 flex items-center justify-center w-10 h-10 rounded-xl transition-colors duration-300 ${isOpen ? 'bg-primary text-white' : 'bg-gray-100 text-gray-500'}`}>
                                        {faq.icon && faq.icon}
                                    </div>
                                    <div className="flex-1 pr-4">
                                        <div className="flex items-center gap-3 mb-2">
                                            <span className={`text-[11px] font-bold tracking-wider uppercase px-2 py-0.5 rounded-md ${isOpen ? 'bg-primary/20 text-primary' : 'bg-gray-200 text-gray-600'}`}>
                                                {faq.category}
                                            </span>
                                        </div>
                                        <h3 className={`text-lg leading-snug tracking-tight transition-colors duration-300 ${isOpen ? 'text-primary' : 'text-text-dark'}`}>
                                            {faq.question}
                                        </h3>
                                    </div>
                                    <div className={`shrink-0 mt-2 transition-transform duration-300 ${isOpen ? 'rotate-180 text-primary' : 'text-gray-400'}`}>
                                        <FiChevronDown size={20} strokeWidth={3} />
                                    </div>
                                </button>

                                <div
                                    className={`transition-all duration-300 ease-in-out ${isOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'}`}
                                >
                                    <div className="px-4 sm:px-6 pb-6 md:pb-8 sm:ml-14">
                                        <div className="w-12 h-px bg-primary/20 mb-4"></div>
                                        <p className="text-[15px] leading-relaxed text-text/80 font-medium">
                                            {faq.answer}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Call To Action Box inside FAQ */}
                <div className="mt-10 lg:mt-20">
                    <div className="relative overflow-hidden rounded-xl bg-white border border-gray-200 p-8 sm:p-12 text-center shadow-sm">
                        <div className="relative z-10">
                            <h3 className="text-2xl font-bold mb-3 text-text-dark tracking-tight">
                                Still have questions?
                            </h3>
                            <p className="text-text/80 font-medium mb-8 text-lg">
                                Can't find what you're looking for? Our support team is here to help.
                            </p>
                            <div className="flex flex-col sm:flex-row gap-4 justify-center">
                                <Link
                                    href="/contact"
                                    className="inline-flex items-center justify-center min-h-[44px] px-8 py-3.5 bg-primary text-white hover:bg-primary/90 transition-colors duration-200 font-bold shadow-md shadow-primary/20 text-[15px] rounded-lg cursor-pointer"
                                >
                                    Contact Support
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default Faqs