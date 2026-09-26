import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Fire-tracker — FIRE wealth tracker",
  description:
    "Track net worth, target allocation, and lifetime withdrawal planning. All data stays in your browser.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-ink text-slate-100 antialiased">{children}</body>
    </html>
  );
}
