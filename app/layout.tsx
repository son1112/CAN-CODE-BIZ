import type { Metadata } from "next";
import { Roboto, Roboto_Mono } from "next/font/google";
import { AgentProvider } from "@/contexts/AgentContext";
import "./globals.css";

const roboto = Roboto({
  variable: "--font-roboto",
  subsets: ["latin"],
  weight: ["300", "400", "500", "700"],
});

const robotoMono = Roboto_Mono({
  variable: "--font-roboto-mono",
  subsets: ["latin"],
  weight: ["400", "500", "700"],
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
        className={`${roboto.variable} ${robotoMono.variable} antialiased`}
      >
        <AgentProvider>
          {children}
        </AgentProvider>
      </body>
    </html>
  );
}
