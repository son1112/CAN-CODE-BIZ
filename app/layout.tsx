import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { AgentProvider } from "@/contexts/AgentContext";
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
  title: "Rubber Ducky Live - AI Chat Companion",
  description: "Your friendly rubber duck AI companion for thinking out loud, problem-solving, and casual conversations",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <AgentProvider>
          {children}
        </AgentProvider>
      </body>
    </html>
  );
}
