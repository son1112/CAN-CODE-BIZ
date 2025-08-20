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
   - `/sessions` - Session management with MongoDB persistence
   - `/agents` - Power agents management with optimized MongoDB queries
   - `/stars` - User favorites system with conflict handling
   - `/tags` - Message tagging system
   - `/speech-token` - AssemblyAI authentication token generation

2. **Custom Hooks** (`hooks/`)
   - `useSpeechRecognition` - Manages AssemblyAI real-time speech recognition via WebSocket
   - `useStreamingChat` - Handles SSE streaming and message state
   - `useAgents` - Manages power agents with optimized loading and caching
   - `useStars` - User favorites system with 409 conflict resolution
   - `useAuth` - Unified authentication for demo and production modes

3. **Database Models** (`models/`)
   - `Session` - MongoDB schema for chat sessions
   - `Message` - Individual chat messages with metadata
   - `Agent` - Custom AI agents with prompts and descriptions
   - `Star` - User favorites tracking system

4. **Core Libraries** (`lib/`)
   - `claude.ts` - Claude API integration with streaming support
   - `mongodb.ts` - Cached Mongoose MongoDB connection handler
   - `mongodb-native.ts` - Native MongoDB driver for high-performance operations
   - `middleware/auth.ts` - Unified authentication middleware with demo mode support
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

## Recent Performance Optimizations & Data Migration 🚀

### Data Migration (August 2025)
- **User Data Unification**: Migrated all demo-user data to real user ID (`68a33c99df2098d5e02a84e3`) for data consistency
- **Session Migration**: Successfully migrated 34 sessions with 1 duplicate star handled gracefully  
- **Demo Mode Enhancement**: Updated demo mode to use real user ID while maintaining authentication bypass
- **Hardcoded References Cleanup**: Replaced all hardcoded "demo-user" references with dynamic user ID system

### Power Agents Performance Optimization
- **25-30x Performance Improvement**: Agents API optimized from 3-4 seconds timeout to 115-146ms response time
- **Root Cause Resolution**: Fixed authentication middleware inconsistency causing 401 Unauthorized errors
- **MongoDB Query Optimization**: Direct native MongoDB queries replace CLI process spawning for agent loading
- **Connection Pooling**: Implemented optimized connection pooling for high-performance database operations

### Authentication System Improvements  
- **Unified Middleware**: Standardized authentication across all API endpoints using `requireAuth()` middleware
- **Demo Mode Consistency**: All APIs now properly bypass authentication in demo mode  
- **Error Handling**: Enhanced error handling with specific error messages and proper status codes
- **Type Safety**: Added comprehensive TypeScript types for authentication results

### Database Performance Enhancements
- **Dual MongoDB Connections**: 
  - `mongodb.ts` - Mongoose ODM for complex operations
  - `mongodb-native.ts` - Native driver for high-performance operations (agents, bulk queries)
- **Query Optimization**: Efficient projections, limits, and indexes for faster data retrieval
- **Connection Caching**: Global connection caching prevents redundant database connections

### Migration Scripts
- **`scripts/migrate-demo-data.js`**: Complete data migration utility with error handling
- **User Data Verification**: `scripts/check-user-data.js` for data integrity validation
- **Rollback Support**: Migration scripts include rollback capabilities for safe deployments

## Security Notice ⚠️

**RESOLVED**: GitHub Personal Access Token was accidentally committed in `.npmrc` on 2025-08-14. 
- Token has been **completely removed from git history** using `git filter-branch`
- `.npmrc` is now in `.gitignore` to prevent future incidents  
- `.npmrc.example` template provided for secure setup
- **ACTION REQUIRED**: The exposed token `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` should be revoked in GitHub settings

## Environment Setup

Required environment variables in `.env.local`:
- `MONGODB_URI` - MongoDB connection string (local: `mongodb://localhost:27017/rubber-ducky`)
- `MONGODB_DB` - Database name (default: `rubber-ducky`)
- `ANTHROPIC_API_KEY` - Claude API key for AI responses
- `ASSEMBLYAI_API_KEY` - AssemblyAI API key for speech recognition
- `NEXT_PUBLIC_APP_URL` - Application URL (default: `http://localhost:3000`)
- `NEXT_PUBLIC_DEMO_MODE` - Enable demo mode for development (`true`/`false`)
- `NEXTAUTH_URL` - NextAuth URL for authentication
- `NEXTAUTH_SECRET` - NextAuth secret key
- `GOOGLE_CLIENT_ID` - Google OAuth client ID
- `GOOGLE_CLIENT_SECRET` - Google OAuth client secret

For GitHub package registry access:
1. Copy `.npmrc.example` to `.npmrc`
2. Replace `YOUR_GITHUB_TOKEN` with your GitHub Personal Access Token
3. Never commit the `.npmrc` file (it's in `.gitignore`)

### Demo Mode Configuration
- Set `NEXT_PUBLIC_DEMO_MODE=true` for development testing
- Demo mode uses real user ID (`68a33c99df2098d5e02a84e3`) for data consistency
- Authentication is bypassed in demo mode while maintaining full functionality

## Versioning and Release Management

The project follows [Semantic Versioning (SemVer)](https://semver.org/) with automated release management:

### Release Commands
```bash
# Patch release (bug fixes): 0.1.0 -> 0.1.1
npm run version:patch

# Minor release (new features): 0.1.0 -> 0.2.0  
npm run version:minor

# Major release (breaking changes): 0.1.0 -> 1.0.0
npm run version:major

# Test release process without making changes
npm run release:dry-run
```

### Automated Release Process
- **Pre-flight checks**: Runs lint, build, and verifies clean working directory
- **Version update**: Updates package.json and CHANGELOG.md with new version
- **Git operations**: Creates commit, tags version, and pushes to remote
- **Documentation**: Automatically updates changelog links and generates release notes

### Files and Documentation
- `CHANGELOG.md` - Detailed change log following Keep a Changelog format
- `docs/VERSIONING.md` - Comprehensive versioning guide and best practices
- `scripts/version.js` - Version management automation script
- `scripts/release.js` - Complete release process automation

See [docs/VERSIONING.md](docs/VERSIONING.md) for detailed versioning guidelines.

## Development Status & Known Issues

### Current Development State ✅
- **Core Functionality**: Fully operational with voice/text chat, streaming responses, and session persistence
- **Authentication**: Working in both demo and production modes with OAuth integration  
- **Power Agents**: 14 active agents with optimized 115ms loading time
- **Performance**: Major optimizations completed with 25-30x API improvements
- **Data Migration**: Successfully completed with user data consolidation

### Known Issues & Pending Work 🔍
- **Agent Selector UI**: Power agents API returns data correctly but React component may not update state properly
- **Stars API Logging**: 409 Conflict responses logged in console (functionality works correctly)  
- **Agent Persistence**: Default agent selection may not persist in existing chat sessions

### Planned Features 🚀
- **Document Upload**: File attachment system for chat sessions
- **Voice Recording Controls**: Cancel recording functionality  
- **Message Archive**: Archive system for chat message management
- **Frontend Testing**: Comprehensive test suite implementation
- **Code Review Automation**: Claude Code agent for automated code reviews

### Performance Metrics 📊
- **Agent Loading**: 115-146ms (down from 3-4 seconds)
- **Session Creation**: ~60ms average response time
- **Message Storage**: ~30-70ms MongoDB operations
- **Authentication**: Consistent sub-100ms middleware response times

## User Preferences

- Use README.org instead of README.md for documentation
- Follow test-driven development practices
- Write production-ready code
- Include initial prompts in git commit messages
- Maintain test coverage above 50%
- Run whitespace cleanup, documentation updates, tests, and linting before commits