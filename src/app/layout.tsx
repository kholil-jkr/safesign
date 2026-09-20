import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "SafeSign — Check your employment contract before you sign",
  description:
    "Free AI contract guardian for migrant and overseas workers. Paste your employment contract in any language and get a plain-language summary, red-flag warnings, a risk rating, and real resources to protect yourself — before you sign. Aman Kerja.",
  keywords: [
    "SafeSign",
    "migrant workers",
    "employment contract",
    "contract check",
    "pekerja migran",
    "kontrak kerja",
    "labour rights",
    "Aman Kerja",
  ],
  icons: {
    icon: "https://z-cdn.chatglm.cn/z-ai/static/logo.svg",
  },
  openGraph: {
    title: "SafeSign — Aman Kerja",
    description:
      "AI contract guardian & rights consultant for migrant and overseas workers worldwide. Check your contract in your own language, before you sign.",
    type: "website",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#0f766e",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        {children}
        <Toaster />
      </body>
    </html>
  );
}
