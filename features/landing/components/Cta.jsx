import React from 'react'
import Link from 'next/link'
import { FiArrowRight } from 'react-icons/fi'

const Cta = () => {
    return (
        <section id="cta" className="w-full bg-primary text-white py-24 sm:py-32 relative overflow-hidden">
            <div className="absolute inset-0 z-0 bg-[linear-gradient(to_right,#ffffff1a_1px,transparent_1px),linear-gradient(to_bottom,#ffffff1a_1px,transparent_1px)] bg-[size:4rem_4rem]"></div>
            <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-[100px]"></div>

            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
                <h2 className="text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight leading-tight mb-8">
                    Ready to scale your outreach? <br />
                    <span className="text-secondary">Start automating today.</span>
                </h2>
                <p className="text-xl text-blue-100 font-medium mb-12 max-w-2xl mx-auto">
                    Sign in to get started with the ultimate full-stack outreach platform.
                </p>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                    <Link href="/login" className="flex items-center justify-center gap-2 rounded-lg px-6 py-3 text-lg font-bold bg-white text-primary hover:bg-gray-50 hover:scale-105 transition-all duration-300 shadow-[0_8px_30px_rgb(0,0,0,0.12)]">
                        Access Your Dashboard
                        <FiArrowRight size={22} strokeWidth={3} />
                    </Link>
                </div>
            </div>
        </section>
    )
}

export default Cta