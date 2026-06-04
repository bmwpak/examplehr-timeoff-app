import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

import Providers from "./providers";

export const metadata: Metadata = {
  title: "ExampleHR Time-Off Management",
  description: "Asynchronous Time-Off Management Simulator with Reconciliation",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-zinc-50 text-zinc-950 dark:bg-zinc-950 dark:text-zinc-50">
        <Providers>
          <header className="border-b border-zinc-200 bg-white/80 backdrop-blur-md sticky top-0 z-40 dark:border-zinc-800 dark:bg-zinc-900/80">
            <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
              <a href="/" className="font-extrabold text-lg text-zinc-900 dark:text-white flex items-center gap-1.5 hover:opacity-85 transition-opacity">
                <span>ExampleHR</span>
                <span className="text-zinc-500 font-medium">Time-Off</span>
              </a>
              <nav className="flex items-center gap-4 text-sm font-semibold text-zinc-650 dark:text-zinc-300">
                <a href="/employee" className="hover:text-zinc-900 dark:hover:text-white transition-colors">
                  Employee View
                </a>
                <a href="/manager" className="hover:text-zinc-900 dark:hover:text-white transition-colors">
                  Manager View
                </a>
              </nav>
            </div>
          </header>
          <main className="flex-grow px-4 py-8 max-w-6xl mx-auto w-full">
            {children}
          </main>
          <footer className="border-t border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900 py-6 text-center text-xs text-zinc-450 dark:text-zinc-505 pb-16">
            <div className="max-w-6xl mx-auto px-4">
              &copy; {new Date().getFullYear()} ExampleHR Inc. All rights reserved. Time-Off Simulator.
            </div>
          </footer>
        </Providers>
      </body>
    </html>
  );
}
