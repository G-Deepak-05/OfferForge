import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "OfferForge - AI Coding Mock Interview Assistant",
  description: "Accelerate your SDE preparation with real-time AI mock interviews, live compiler sandboxes, code evaluations, and timeline replay analytics.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen flex flex-col bg-background text-foreground`}>
        {/* Main Header navigation */}
        <header className="sticky top-0 z-50 w-full glass-panel border-b border-panel-border bg-[#0d0e10]/80">
          <div className="max-w-7xl mx-auto px-6 h-16 flex justify-between items-center">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2" id="header-logo-link">
              <span className="font-extrabold text-lg tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-accent to-accent-violet">
                OFFERFORGE
              </span>
              <span className="text-[10px] font-bold text-accent bg-accent/10 px-2 py-0.5 border border-accent/20 rounded">
                AI Mock
              </span>
            </Link>

            {/* Profile actions */}
            <nav className="flex items-center gap-5">
              <Link href="/" className="text-xs text-text-muted hover:text-foreground font-semibold transition" id="nav-dashboard">
                Dashboard
              </Link>
              <Link href="/profile" className="text-xs text-text-muted hover:text-foreground font-semibold transition" id="nav-profile">
                Profile
              </Link>
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-accent to-accent-violet flex items-center justify-center text-xs font-bold text-white border border-panel-border shadow-md">
                U
              </div>
            </nav>
          </div>
        </header>

        {/* Content Container */}
        <main className="flex-1 w-full max-w-7xl mx-auto px-6 py-8">
          {children}
        </main>

        <footer className="py-6 border-t border-panel-border bg-[#0a0a0b] text-center text-[10px] text-text-muted">
          &copy; 2026 OfferForge. Powered by NVIDIA NIM and local Judge0 sandbox compilation.
        </footer>
      </body>
    </html>
  );
}
