# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Rubber Ducky Live is a real-time voice-enabled AI chat companion powered by Claude Sonnet AI. Inspired by the classic "rubber duck debugging" technique, it provides a friendly AI partner for thinking out loud, problem-solving, and casual conversations. Features speech-to-text input, streaming AI responses, and MongoDB persistence.

## Development Commands

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Run linting
npm run lint

# Type checking
npm run build
```

## Architecture Overview

### Tech Stack 🦆
- **Framework**: Next.js 14 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Database**: MongoDB with Mongoose ODM
- **AI Integration**: Anthropic Claude API (Sonnet 3.5 model)
- **Real-time**: Server-Sent Events (SSE) for streaming
- **Voice Input**: AssemblyAI Real-time Streaming

### Key Components

1. **API Routes** (`app/api/`)
   - `/chat` - SSE endpoint for streaming Claude responses
   - `/conversations` - CRUD operations for chat history
   - `/speech-token` - AssemblyAI authentication token generation

2. **Custom Hooks** (`hooks/`)
   - `useSpeechRecognition` - Manages AssemblyAI real-time speech recognition via WebSocket
   - `useStreamingChat` - Handles SSE streaming and message state

3. **Database Models** (`models/`)
   - `Conversation` - MongoDB schema for chat persistence

4. **Core Libraries** (`lib/`)
   - `claude.ts` - Claude API integration with streaming support
   - `mongodb.ts` - Cached MongoDB connection handler
   - `assemblyai.ts` - AssemblyAI token generation and configuration

### Streaming Architecture

The app uses Server-Sent Events (SSE) to stream Claude's responses in real-time:
1. Client sends messages via POST to `/api/chat`
2. Server establishes SSE connection
3. Claude API streams tokens
4. Tokens are forwarded to client via SSE
5. UI updates progressively as tokens arrive

### Continuous Conversation Mode

The application now supports continuous conversation mode with automatic AI responses:

#### Speech Recognition Enhancement
- Added silence detection with 2-second threshold for automatic transcript sending
- Implemented continuous mode that keeps listening and auto-submits after natural pauses
- Enhanced speech recognition hook with `startContinuousMode()` and `stopContinuousMode()` functions

#### Conversation Management
- `useConversationManager` hook determines when AI should respond based on:
  - Question detection (phrases with ?, what, how, why, etc.)
  - Conversation context (responding to AI messages)
  - Greetings and conversation starters
  - Substantial statements requiring responses
  - Direct mentions of the AI agent
- Smart filtering to avoid responding to simple acknowledgments ("yeah", "ok")

#### UI Updates
- Added continuous conversation toggle button in header
- Single microphone button replaces record/send workflow in continuous mode
- Visual indicators for active continuous conversation
- Context-aware instructions and status messages

#### Architecture Flow (Continuous Mode)
1. User enables continuous mode via toggle button
2. Speech recognition starts and remains active
3. User speech is automatically transcribed
4. After 2 seconds of silence, transcript is auto-sent to Claude
5. Conversation manager determines if AI should respond
6. AI responses stream back via SSE
7. Process continues until user stops conversation

## Environment Setup

Required environment variables in `.env.local`:
- `MONGODB_URI` - MongoDB connection string
- `ANTHROPIC_API_KEY` - Claude API key
- `ASSEMBLYAI_API_KEY` - AssemblyAI API key for speech recognition
- `NEXT_PUBLIC_APP_URL` - Application URL

## User Preferences

- Use README.org instead of README.md for documentation
- Follow test-driven development practices
- Write production-ready code
- Include initial prompts in git commit messages
- Maintain test coverage above 50%
- Run whitespace cleanup, documentation updates, tests, and linting before commits