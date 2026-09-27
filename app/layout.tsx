import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "FIRE Wealth Tracker",
  description: "Personal Networth, allocation & lifetime withdrawal planning.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-ink text-slate-100 antialiased">{children}</body>
    </html>
  );
}
