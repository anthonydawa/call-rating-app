import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geist = Geist({ variable: "--font-geist", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  metadataBase: new URL("https://call-rating-app.vercel.app"),
  title: "CallLens — AI Call Quality",
  description: "A focused call-quality dashboard for coaching teams with AI-scored conversations.",
  icons: { icon: "/favicon.svg" },
  openGraph: {
    title: "CallLens — AI Call Quality",
    description: "See call quality, coaching signals, and agent performance at a glance.",
    images: [{ url: "/og.png", width: 1536, height: 1024, alt: "CallLens AI call-quality dashboard" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "CallLens — AI Call Quality",
    description: "See call quality, coaching signals, and agent performance at a glance.",
    images: ["/og.png"],
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body className={`${geist.variable} ${geistMono.variable}`}>{children}</body></html>;
}
