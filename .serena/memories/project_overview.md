# Rubber Ducky Live - Project Overview

## Purpose
Real-time voice-enabled AI chat companion powered by Claude 4 AI with smart fallback to Claude 3.5 Sonnet. Features voice-to-text, streaming responses, MongoDB persistence, Google OAuth authentication, comprehensive export system, and mobile-optimized interface.

## Tech Stack
- **Framework**: Next.js 15.4.6 with App Router, React 19.1.0, TypeScript 5
- **Styling**: Tailwind CSS 3.4.17 with responsive design
- **Database**: MongoDB with Mongoose ODM + native driver for performance
- **AI**: Anthropic Claude API (Claude 4 with 3.5 Sonnet fallback)
- **Auth**: NextAuth.js 5.0 with Google OAuth + demo mode
- **Testing**: Jest, Playwright, React Testing Library
- **Voice**: AssemblyAI Real-time Streaming
- **Export**: jsPDF + docx + Google Drive API integration

## Key Features
- Streaming Claude responses with SSE
- Voice-to-text input with AssemblyAI
- Session persistence with MongoDB
- PDF/Word export with Google Drive integration
- Star system for favorites, message tagging
- Mobile-first responsive design
- Google OAuth authentication with demo mode