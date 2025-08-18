# Changelog

All notable changes to Rubber Ducky Live will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Comprehensive onboarding tooltip system for new users
  - Custom React 19 compatible onboarding tour with 7 guided steps
  - Interactive tooltips with smart positioning and animations
  - Spotlight highlighting with pulsing effects
  - localStorage persistence for completion tracking
  - Desktop and mobile access points for tour
  - Context-driven state management with React Context API
- Proper versioning system with CHANGELOG.md
- Version management npm scripts
- Git tagging workflow

## [0.1.0] - 2025-01-08

### Added
- **Core Features**
  - Real-time voice-enabled AI chat companion powered by Claude Sonnet AI
  - Speech-to-text input using AssemblyAI
  - Streaming AI responses via Server-Sent Events (SSE)
  - MongoDB persistence for chat sessions and user data

- **Authentication & User Management**
  - NextAuth.js integration with MongoDB adapter
  - User session management
  - Protected routes and API endpoints

- **Chat Interface**
  - Interactive chat interface with message history
  - Real-time message streaming
  - Message chronological ordering (newest first)
  - Message headers showing role, agent, and timestamp
  - Welcome page with cycling hero images
  - Responsive design with Tailwind CSS

- **Agent System**
  - Basic built-in agents (Conversational Assistant, Real Estate Advisor)
  - Power Agents - custom AI agents with specialized prompts
  - Agent selection dropdown with search and categorization
  - Session agent memory - remembers last agent used per session
  - Agent starring system for favorites
  - Starred agents appear at top of dropdown lists

- **Speech Recognition**
  - Real-time speech recognition via AssemblyAI WebSocket
  - Continuous conversation mode with auto-submission
  - Silence detection (2-second threshold)
  - Manual record/send workflow option

- **Conversation Management**
  - Smart conversation context detection
  - Automatic AI response triggering based on:
    - Question detection (phrases with ?, what, how, why, etc.)
    - Conversation context and follow-ups
    - Greetings and conversation starters
    - Substantial statements requiring responses
  - Session persistence with MongoDB
  - Session browsing and management

- **Navigation & UI**
  - Header navigation with logo, agent selector, and user menu
  - Sidebar navigation with session list and account menu
  - Responsive header with mobile-friendly design
  - Account menu moved to sidebar for better UX

- **API Architecture**
  - RESTful API endpoints for all features
  - `/api/chat` - SSE streaming endpoint
  - `/api/conversations` - Session CRUD operations
  - `/api/agents` - Power agent management
  - `/api/stars` - Starring system
  - `/api/speech-token` - AssemblyAI authentication

- **Development & Testing**
  - Comprehensive test suite with Jest and React Testing Library
  - Playwright end-to-end testing
  - Unit tests for components and hooks
  - Integration tests for API endpoints
  - ESLint and Prettier code formatting
  - TypeScript throughout the application

- **Performance & Optimization**
  - Image optimization with Next.js Image component
  - Caching for API responses
  - Optimized MongoDB queries
  - Efficient state management with React Context

### Technical Stack
- **Framework**: Next.js 14 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Database**: MongoDB with Mongoose ODM
- **AI Integration**: Anthropic Claude API (Sonnet 3.5 model)
- **Real-time**: Server-Sent Events (SSE) for streaming
- **Voice Input**: AssemblyAI Real-time Streaming
- **Authentication**: NextAuth.js
- **Testing**: Jest, React Testing Library, Playwright
- **Deployment**: Vercel-ready configuration

### Security
- Environment variable management
- Secure API key handling
- Authentication-protected routes
- Input sanitization and validation
- CORS configuration for API endpoints

[Unreleased]: https://github.com/user/rubber-ducky-live/compare/v0.1.0...HEAD
[0.1.0]: https://github.com/user/rubber-ducky-live/releases/tag/v0.1.0