import type { Metadata } from "next";
import { Roboto, Roboto_Mono } from "next/font/google";
import { AgentProvider } from "@/contexts/AgentContext";
import { DropdownProvider } from "@/contexts/DropdownContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { SessionProvider } from "next-auth/react";
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
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, minimum-scale=1.0, maximum-scale=1.0, user-scalable=no, shrink-to-fit=no, viewport-fit=cover" />
        <style dangerouslySetInnerHTML={{
          __html: `
            :root {
              --ui-font-size: 14px;
              --ui-line-height: 1.2;
            }
            html { 
              font-size: var(--ui-font-size) !important; 
              -webkit-text-size-adjust: none !important; 
              -moz-text-size-adjust: none !important; 
              text-size-adjust: none !important;
              zoom: 1 !important;
              transform: none !important;
            }
            body { 
              font-size: var(--ui-font-size) !important; 
              -webkit-text-size-adjust: none !important; 
              -moz-text-size-adjust: none !important; 
              text-size-adjust: none !important;
              zoom: 1 !important;
              transform: none !important;
            }
            * {
              -webkit-text-size-adjust: none !important;
              -moz-text-size-adjust: none !important;
              text-size-adjust: none !important;
            }
            /* Chrome-specific override for zoom behavior */
            @media screen and (-webkit-min-device-pixel-ratio: 0) and (min-color-index: 0) {
              html, body {
                font-size: 14px !important;
                -webkit-text-size-adjust: none !important;
                zoom: 1 !important;
              }
              .no-text-scale, .ui-locked {
                font-size: 14px !important;
                -webkit-text-size-adjust: none !important;
                zoom: 1 !important;
              }
            }
          `
        }} />
      </head>
      <body
        className={`${roboto.variable} ${robotoMono.variable} antialiased no-text-scale`}
      >
        <SessionProvider>
          <ThemeProvider>
            <AgentProvider>
              <DropdownProvider>
                {children}
              </DropdownProvider>
            </AgentProvider>
          </ThemeProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
