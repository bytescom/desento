import React from "react";
import Sidebar from "@/components/layout/Sidebar";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";

export default async function DashboardLayout({ children }) {
    const session = await auth()

    if (!session){
        redirect("/login")
    }

    return (
        <div className="w-full h-[100dvh] flex flex-col md:flex-row gap-2 p-1 sm:p-2 bg-primary/5">
            <Sidebar />

            <main className="flex-1 min-w-0 bg-background/90 backdrop-blur-xl border border-border/50 shadow-sm rounded-xl p-3 sm:p-5 flex flex-col gap-3 sm:gap-5 overflow-y-auto overflow-x-hidden relative">
                <div className="flex flex-col gap-3 sm:gap-5 flex-1">
                    {children}
                </div>
            </main>
        </div>
    )
}