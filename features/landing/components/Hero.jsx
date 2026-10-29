"use client";

import React from 'react'
import Link from 'next/link'
import DesentoHeroIllustration from '@/components/DesentoHeroIllustration'

const Hero = () => {
    return (
        <section className="relative w-full overflow-hidden bg-background min-h-[82vh] flex items-center pt-6 pb-14 lg:pt-8 lg:pb-16">
            {/* Layered Background */}
            <div className="absolute inset-0 pointer-events-none z-0">
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#f0f0f0_1px,transparent_1px),linear-gradient(to_bottom,#f0f0f0_1px,transparent_1px)] bg-[size:3rem_3rem] [mask-image:radial-gradient(ellipse_70%_50%_at_50%_50%,#000_20%,transparent_100%)] opacity-50"></div>
                <div className="absolute top-[-10%] right-[10%] w-[700px] h-[700px] bg-primary/8 rounded-full blur-[140px] animate-pulse" style={{ animationDuration: '5s' }}></div>
                <div className="absolute bottom-[-15%] left-[5%] w-[600px] h-[600px] bg-secondary/6 rounded-full blur-[120px] animate-pulse" style={{ animationDuration: '7s' }}></div>
                <div className="absolute top-[40%] left-[50%] w-[400px] h-[400px] bg-primary-dark/5 rounded-full blur-[100px]"></div>
            </div>

            <div className="relative z-10 max-w-[1280px] w-full mx-auto px-6 sm:px-8 lg:px-12 grid lg:grid-cols-2 gap-16 lg:gap-8 items-center">
                
                {/* Left Column (Text & CTAs) */}
                <div className="flex flex-col items-start text-left lg:pr-12">

                    {/* Heading */}
                    <h1 className="text-[2.75rem] sm:text-6xl lg:text-[4.25rem] font-semibold tracking-tight text-text-dark leading-[1.05] mb-6">
                        Outreach for <br />
                        <span className="text-text-dark">professionals</span>
                    </h1>

                    {/* Subtitle */}
                    <p className="text-lg sm:text-[22px] text-text max-w-lg leading-[1.6] font-normal mb-10">
                        The best way to reach humans instead of spam folders. Create personalized emails and automate outreach at scale.
                    </p>

                    {/* Buttons */}
                    <div className="flex flex-wrap items-center gap-6">
                        <Link href="/signup" className="inline-flex items-center justify-center h-12 px-6 rounded-full text-[15px] font-medium bg-text-dark text-white hover:bg-black hover:shadow-lg hover:shadow-text-dark/20 transition-all duration-200">
                            Get started
                        </Link>
                    </div>

                </div>

                {/* Right Column (Interactive Dashboard UI) */}
                <div className="relative w-full flex items-center justify-center lg:justify-end z-10">
                    <div className="w-full max-w-[540px] [zoom:0.95] lg:[zoom:0.8] lg:mr-16">
                        <DesentoHeroIllustration />
                    </div>
                </div>

            </div>
        </section>
    )
}

export default Hero