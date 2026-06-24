import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Navbar } from "../components/Navbar";
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
        <Navbar />

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
