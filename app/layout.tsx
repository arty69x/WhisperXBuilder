import "@/styles/globals.css";
import type { Metadata } from "next";
export const metadata: Metadata = { title: "WHISPERX Builder", description: "Premium creative operating system for cinematic web creation." };
export default function RootLayout({ children }: { children: React.ReactNode }) { return <html lang="en"><body>{children}</body></html>; }
