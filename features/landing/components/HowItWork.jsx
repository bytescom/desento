import React from 'react'
import { FiMail, FiUpload, FiSend } from 'react-icons/fi'

const steps = [
    {
        step: "01",
        title: "Connect your email",
        desc: "Securely sync your Gmail or Outlook account in one click. No technical setup required.",
        icon: FiMail,
        color: "primary",
        gradient: "from-primary/10 to-primary/5",
        borderColor: "border-primary/20",
        iconBg: "bg-primary/10",
        iconColor: "text-primary",
    },
    {
        step: "02",
        title: "Import your leads",
        desc: "Upload a CSV of your prospects. Desento automatically maps the data and enriches profiles.",
        icon: FiUpload,
        color: "secondary",
        gradient: "from-secondary/10 to-secondary/5",
        borderColor: "border-secondary/20",
        iconBg: "bg-secondary/10",
        iconColor: "text-secondary",
    },
    {
        step: "03",
        title: "Launch & Automate",
        desc: "Review the dynamically personalized drafts, hit send, and watch the replies roll in on your dashboard.",
        icon: FiSend,
        color: "primary-dark",
        gradient: "from-primary-dark/10 to-primary-dark/5",
        borderColor: "border-primary-dark/20",
        iconBg: "bg-primary-dark/10",
        iconColor: "text-primary-dark",
    }
]

const HowItWorks = () => {
    return (
        <section id="how-it-works" className="w-full bg-white py-24 sm:py-32 border-t border-gray-100 relative overflow-hidden">
            {/* Subtle bg accent */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-primary/3 rounded-full blur-[150px] pointer-events-none"></div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                <div className="text-center max-w-3xl mx-auto mb-16 md:mb-24">
                    <h2 className="text-4xl md:text-5xl font-extrabold text-text-dark mb-6 tracking-tight">
                        Launch your first campaign <br className="hidden sm:block" />
                        in <span className="text-transparent bg-clip-text bg-[linear-gradient(135deg,var(--color-secondary)_0%,#ea580c_100%)]">3 simple steps</span>
                    </h2>
                    <p className="text-lg text-text/70 font-medium">
                        We&apos;ve stripped away the complexity so you can focus on booking meetings.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8 relative">
                    {steps.map((item, idx) => {
                        const Icon = item.icon;
                        return (
                            <div key={idx} className="relative z-10 flex flex-col items-center group">
                                {/* Step circle */}
                                <div className={`w-[88px] h-[88px] rounded-full bg-gradient-to-br ${item.gradient} border ${item.borderColor} flex items-center justify-center mb-8 shadow-sm group-hover:shadow-md group-hover:-translate-y-1 transition-all duration-300`}>
                                    <div className={`w-14 h-14 rounded-xl ${item.iconBg} flex items-center justify-center`}>
                                        <Icon className={item.iconColor} size={24} strokeWidth={2} />
                                    </div>
                                </div>

                                {/* Step number badge */}
                                <div className={`absolute top-0 right-[calc(50%-56px)] w-7 h-7 rounded-full bg-white border-2 ${item.borderColor} flex items-center justify-center shadow-sm`}>
                                    <span className={`text-[11px] font-black ${item.iconColor}`}>{item.step}</span>
                                </div>

                                {/* Card body */}
                                <div className="bg-white rounded-xl border border-border/60 p-6 text-center shadow-[0_4px_24px_rgb(0,0,0,0.03)] hover:shadow-[0_8px_32px_rgb(0,0,0,0.06)] transition-all duration-300 w-full h-full group-hover:border-primary/15 flex flex-col justify-center">
                                    <h3 className="text-xl font-bold text-text-dark mb-3 tracking-tight">{item.title}</h3>
                                    <p className="text-text/65 font-medium leading-relaxed text-[15px]">
                                        {item.desc}
                                    </p>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </section>
    )
}

export default HowItWorks