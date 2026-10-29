import { Manrope } from "next/font/google";
import AuthProvider from "@/lib/AuthProvider";
import ReduxProvider from "@/components/providers/ReduxProvider";
import { Toaster } from "react-hot-toast";
import "./globals.css";

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin"],
});

export const metadata = {
  title: "Desento - Full-Stack Outreach Platform",
  description: "Create, send, track, and manage personalized outreach from a single workspace. The ultimate outreach platform for professionals.",
  keywords: ["personalized outreach", "cold outreach tool", "email outreach", "sales prospecting", "outreach automation"],
};

export default function RootLayout({ children }) {
  return (
    <html
      lang="en"
      className={` ${manrope.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col font-sans" suppressHydrationWarning>
        <AuthProvider>
          <ReduxProvider>
            {children}
            <Toaster
              position="top-right"
              toastOptions={{
                duration: 3500,
                style: {
                  background: "var(--color-background, #fff)",
                  color: "var(--color-text-dark, #111)",
                  border: "1px solid var(--color-border, #e5e7eb)",
                  borderRadius: "12px",
                  fontSize: "13px",
                  fontWeight: "600",
                  boxShadow: "0 8px 30px rgba(0,0,0,0.10)",
                  padding: "12px 16px",
                },
                success: {
                  iconTheme: { primary: "#10b981", secondary: "#fff" },
                },
                error: {
                  iconTheme: { primary: "#ef4444", secondary: "#fff" },
                },
              }}
            />
          </ReduxProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
