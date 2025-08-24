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
import ServiceWorkerRegistration from "./components/ServiceWorkerRegistration";
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
  description: "Your friendly rubber duck AI companion for thinking out loud, problem-solving, and casual conversations. Chat with Claude 4 AI using voice or text, get intelligent responses, and organize your conversations.",
  keywords: ["AI chat", "rubber duck debugging", "Claude AI", "voice chat", "AI companion", "problem solving", "thinking out loud", "AI assistant"],
  authors: [{ name: "Rubber Ducky Live Team" }],
  creator: "Rubber Ducky Live",
  publisher: "Rubber Ducky Live",
  category: "Productivity",
  classification: "AI Chat Application",
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'),
  alternates: {
    canonical: '/',
    languages: {
      'en-US': '/',
    },
  },
  manifest: "/manifest.json",
  
  // Open Graph metadata for social sharing
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: '/',
    title: "Rubber Ducky Live - AI Chat Companion",
    description: "Your friendly rubber duck AI companion for thinking out loud, problem-solving, and casual conversations. Chat with Claude 4 AI using voice or text.",
    siteName: "Rubber Ducky Live",
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Rubber Ducky Live - AI Chat Companion',
      },
      {
        url: '/og-image-square.png', 
        width: 1200,
        height: 1200,
        alt: 'Rubber Ducky Live - AI Chat Companion',
      }
    ],
  },
  
  // Twitter Card metadata
  twitter: {
    card: 'summary_large_image',
    title: "Rubber Ducky Live - AI Chat Companion",
    description: "Your friendly rubber duck AI companion for thinking out loud, problem-solving, and casual conversations.",
    images: ['/og-image.png'],
    creator: '@RubberDuckyLive',
    site: '@RubberDuckyLive',
  },
  
  // Additional metadata for SEO
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  
  // App-specific metadata
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Rubber Ducky Live",
    startupImage: [
      {
        media: "screen and (device-width: 375px) and (device-height: 812px) and (-webkit-device-pixel-ratio: 3)",
        url: "/splash/iphone-x.png"
      },
      {
        media: "screen and (device-width: 414px) and (device-height: 896px) and (-webkit-device-pixel-ratio: 2)", 
        url: "/splash/iphone-xr.png"
      },
      {
        media: "screen and (device-width: 414px) and (device-height: 896px) and (-webkit-device-pixel-ratio: 3)",
        url: "/splash/iphone-xs-max.png"
      },
      {
        media: "screen and (device-width: 375px) and (device-height: 667px) and (-webkit-device-pixel-ratio: 2)",
        url: "/splash/iphone-6-7-8.png"
      }
    ]
  },
  
  formatDetection: {
    telephone: false
  },
  
  other: {
    "mobile-web-app-capable": "yes",
    "mobile-web-app-status-bar-style": "default",
    "mobile-web-app-title": "Rubber Ducky Live"
  }
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

        {/* Preload critical resources for better LCP - rubber-duck-avatar only used during streaming */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />

        {/* PWA Configuration */}
        <link rel="manifest" href="/manifest.json" />
        
        {/* iOS PWA Meta Tags */}
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Rubber Ducky Live" />
        <link rel="apple-touch-icon" href="/icons/icon-192.png" />
        <link rel="apple-touch-icon" sizes="152x152" href="/icons/icon-152.png" />
        <link rel="apple-touch-icon" sizes="180x180" href="/icons/icon-192.png" />
        <link rel="apple-touch-icon" sizes="167x167" href="/icons/icon-192.png" />
        
        {/* Android PWA Meta Tags */}
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="theme-color" content="#3b82f6" />
        <meta name="msapplication-TileColor" content="#3b82f6" />
        <meta name="msapplication-config" content="/browserconfig.xml" />
        
        {/* App Icons */}
        <link rel="icon" type="image/png" sizes="32x32" href="/icons/icon-32.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/icons/icon-16.png" />
        <link rel="shortcut icon" href="/favicon.ico" />
        
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
                          <ServiceWorkerRegistration />
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
