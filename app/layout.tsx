import type { Metadata } from "next";
import { Roboto, Roboto_Mono } from "next/font/google";
// Cache bust: 2025-08-22-mobile-fix
import Script from "next/script";
import { AgentProvider } from "@/contexts/AgentContext";
import { DropdownProvider } from "@/contexts/DropdownContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { ModelProvider } from "@/contexts/ModelContext";
import { SessionProvider } from "next-auth/react";
import { SessionProvider as ChatSessionProvider } from "@/contexts/SessionContext";
import { OnboardingProvider } from "@/contexts/OnboardingContext";
import { ContentSafetyProvider } from "@/contexts/ContentSafetyContext";
import { SessionAgentSync } from "@/components/SessionAgentSync";
import "./globals.css";
import "./styles/mobile-touch.css";

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

        {/* Preload critical resources for better LCP */}
        <link rel="preload" href="/rubber-duck-avatar.png" as="image" type="image/png" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />

        {/* DNS prefetch for external services */}
        <link rel="dns-prefetch" href="//api.anthropic.com" />
        <link rel="dns-prefetch" href="//api.assemblyai.com" />
        <link rel="dns-prefetch" href="//apis.google.com" />

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
            <ModelProvider>
              <AgentProvider>
                <ChatSessionProvider>
                  <ContentSafetyProvider>
                    <SessionAgentSync>
                      <DropdownProvider>
                        <OnboardingProvider>
                          {children}
                        </OnboardingProvider>
                      </DropdownProvider>
                    </SessionAgentSync>
                  </ContentSafetyProvider>
                </ChatSessionProvider>
              </AgentProvider>
            </ModelProvider>
          </ThemeProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
