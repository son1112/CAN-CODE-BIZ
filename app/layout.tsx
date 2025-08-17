import type { Metadata } from "next";
import { Roboto, Roboto_Mono } from "next/font/google";
import { AgentProvider } from "@/contexts/AgentContext";
import { DropdownProvider } from "@/contexts/DropdownContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { ModelProvider } from "@/contexts/ModelContext";
import { SessionProvider } from "next-auth/react";
import { SessionProvider as ChatSessionProvider } from "@/contexts/SessionContext";
import "./globals.css";

const roboto = Roboto({
  variable: "--font-roboto",
  subsets: ["latin"],
  weight: ["300", "400", "500", "700"],
  display: "swap", // Critical for LCP - show fallback font immediately
  preload: true,
});

const robotoMono = Roboto_Mono({
  variable: "--font-roboto-mono",
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  display: "swap", // Faster font loading
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
        
        {/* Critical performance hint */}
        <link rel="preload" as="style" href="data:text/css;base64,Lyo=" />
        
        {/* Critical resource preloading - Non-blocking for LCP */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        
        {/* Load fonts asynchronously to not block LCP */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                var link = document.createElement('link');
                link.rel = 'stylesheet';
                link.href = 'https://fonts.googleapis.com/css2?family=Roboto:wght@300;400;500;700&display=swap';
                document.head.appendChild(link);
              })();
            `
          }}
        />
        <noscript><link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Roboto:wght@300;400;500;700&display=swap" /></noscript>
        
        {/* DNS prefetch for external services */}
        <link rel="dns-prefetch" href="//api.anthropic.com" />
        <link rel="dns-prefetch" href="//api.assemblyai.com" />
        
        {/* Critical CSS for instant LCP rendering */}
        <style>{`
          /* Critical hero text for LCP - render immediately */
          h2[style*="fontSize: '2.25rem'"] {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Helvetica Neue', Arial, sans-serif !important;
            font-size: 2.25rem !important;
            font-weight: 700 !important;
            color: #111827 !important;
            line-height: 1.25 !important;
            margin: 0 !important;
            display: block !important;
            visibility: visible !important;
            opacity: 1 !important;
          }
          
          /* Fallback critical styles */
          .font-roboto { font-family: var(--font-roboto) !important; }
          .text-4xl { font-size: 2.25rem !important; }
          .font-bold { font-weight: 700 !important; }
          .text-gray-900 { color: #111827 !important; }
          .leading-tight { line-height: 1.25 !important; }
        `}</style>
        <style dangerouslySetInnerHTML={{
          __html: `
            :root {
              --ui-font-size: 14px;
              --ui-line-height: 1.2;
            }
            
            /* Critical CSS for LCP optimization */
            h2[style*="fontSize: '2.25rem'"] {
              font-size: 2.25rem !important;
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Helvetica Neue', Arial, sans-serif !important;
              font-weight: 700 !important;
              color: #111827 !important;
              line-height: 1.25 !important;
              margin: 0 !important;
              display: block !important;
              visibility: visible !important;
              opacity: 1 !important;
            }
            
            /* Prevent settings page h1 from affecting LCP on main page */
            h1[style*="fontSize: '1.5rem'"] {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif !important;
            }
            
            /* Performance optimizations */
            * {
              -webkit-text-size-adjust: none !important;
              -moz-text-size-adjust: none !important;
              text-size-adjust: none !important;
            }
            
            /* Reduce INP delays with better interaction handling */
            button, input, textarea, [role="button"] {
              touch-action: manipulation;
              -webkit-user-select: none;
              user-select: none;
              -webkit-tap-highlight-color: transparent;
            }
            
            /* Critical input performance optimization */
            textarea {
              will-change: auto;
              transform: translateZ(0);
              backface-visibility: hidden;
              contain: layout style paint;
            }
            
            /* Prevent expensive repaints during typing */
            .relative:has(textarea) {
              contain: layout;
            }
            
            /* Optimize animations for performance */
            * {
              will-change: auto;
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
                  <DropdownProvider>
                    {children}
                  </DropdownProvider>
                </ChatSessionProvider>
              </AgentProvider>
            </ModelProvider>
          </ThemeProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
