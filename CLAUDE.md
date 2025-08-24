# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 🚨 CRITICAL: Branch Management First!

**PRODUCTION DEPLOYMENT ACTIVE**: This project auto-deploys to live site on push to `main`. 

**IMMEDIATE ACTION REQUIRED FOR EVERY SESSION:**
```bash
# 1. Check current branch (MUST be develop or feature/*)
git branch

# 2. If on main, switch immediately
git checkout develop
```

**NEVER commit directly to main unless explicitly requested for hotfixes!**

## Project Overview

Rubber Ducky Live is a comprehensive real-time voice-enabled AI chat companion powered by Claude 4 AI with smart fallback to Claude 3.5 Sonnet. Inspired by the classic "rubber duck debugging" technique, it provides a friendly AI partner for thinking out loud, problem-solving, and casual conversations. Features include advanced speech-to-text input, streaming AI responses, MongoDB persistence, Google OAuth authentication with demo mode, comprehensive message export system (PDF/Word to Google Drive), star system for favorites, message tagging, and responsive mobile-friendly design.

## Branch Management & Development Workflow

**CRITICAL**: This project uses automated deployment on push to `main`. All development MUST happen on the `develop` branch or feature branches.

### Branch Structure
- **`main`**: Production branch with automatic deployment to live site
- **`develop`**: Primary development branch for all new work 
- **`feature/*`**: Feature branches created from `develop`
- **`hotfix/*`**: Emergency fixes branched from `main`

### Development Workflow
```bash
# ALWAYS start from develop branch
git checkout develop
git pull origin develop

# For new features, create a feature branch
git checkout -b feature/your-feature-name

# Work on your changes, commit frequently
git add .
git commit -m "your commit message"

# When ready, merge back to develop
git checkout develop
git merge feature/your-feature-name

# Push develop (NOT main)
git push origin develop

# Only merge develop to main when ready for production deployment
```

### Claude Code Instructions

#### Branch Safety Protocol
1. **NEVER push directly to main** unless explicitly requested for hotfixes
2. **ALWAYS work on develop branch** for all regular development
3. **MANDATORY: Check current branch** with `git branch` at session start
4. **Auto-switch to develop** if accidentally on main: `git checkout develop`
5. **Create feature branches** for larger features: `git checkout -b feature/feature-name`

#### Next.js Cache Management Protocol
Next.js cache corruption is a recurring issue. Include these preventive measures:

```bash
# Clear Next.js cache if experiencing build issues
rm -rf .next

# Clean development command (use when dev server acts weird)
npm run clean:dev  # or: rm -rf .next && npm run dev

# Full clean (nuclear option for persistent issues)
npm run clean:all  # or: rm -rf .next node_modules package-lock.json && npm install
```

**When to clear cache:**
- Dev server showing old/wrong content
- 404 errors for /_next/static/ assets
- MIME type errors for CSS/JS files
- Build inconsistencies after major changes

#### Pre-Commit Checklist (MANDATORY)
Before ANY commit, ALWAYS run in this order:
```bash
# 1. Verify branch (should be develop or feature/*)
git branch

# 2. Clear Next.js cache if issues occurred during development
rm -rf .next

# 3. Run tests (must pass)
npm test

# 4. Run linting (must pass) 
npm run lint

# 5. Run type checking
npm run build

# 6. Check test coverage (maintain >50%)
npm run test:coverage

# 7. Run cross-browser testing for critical paths
npm run test:critical

# 8. Only commit if all checks pass
```

#### Session Startup Protocol
**ALWAYS start each Claude Code session with:**
```bash
# Check current branch - should be develop
git branch

# If on main, immediately switch to develop
git checkout develop

# Pull latest changes
git pull origin develop

# Check git status
git status
```

#### Deployment Safety
- **develop → main merges**: Only for production-ready releases
- **Automatic deployment**: Triggered on every push to main
- **Testing requirement**: All tests must pass before any push
- **Rollback plan**: Keep develop branch stable for quick rollback

## Development Commands

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Run tests
npm test
npm run test:watch
npm run test:coverage

# End-to-end testing
npm run test:e2e
npm run test:e2e:ui

# Build for production
npm run build

# Start production server
npm start

# Run linting
npm run lint

# Type checking & production build
npm run build
```

## Architecture Overview

### Tech Stack 🦆
- **Framework**: Next.js 15.4.6 with App Router
- **Language**: TypeScript 5
- **Runtime**: React 19.1.0
- **Styling**: Tailwind CSS 3.4.17 with responsive design
- **Database**: MongoDB with Mongoose ODM + native driver for performance
- **AI Integration**: Anthropic Claude API (Claude 4 with Sonnet 3.5 fallback)
- **Authentication**: NextAuth.js 5.0 with Google OAuth + demo mode
- **Real-time**: Server-Sent Events (SSE) for streaming
- **Voice Input**: AssemblyAI Real-time Streaming
- **Export System**: jsPDF + docx + Google Drive API integration
- **Testing**: Jest + Playwright + React Testing Library
- **Icons**: Lucide React
- **File Handling**: HTML2Canvas for screenshots

### Key Components

1. **API Routes** (`app/api/`)
   - `/chat` - SSE endpoint for streaming Claude 4/3.5 responses with smart fallback
   - `/sessions` - Session management with MongoDB persistence and avatar generation
   - `/agents` - Power agents management with optimized MongoDB queries (115ms response time)
   - `/stars` - User favorites system with conflict handling and 409 resolution
   - `/tags` - Advanced message tagging system with UX improvements
   - `/export/` - Comprehensive export system:
     - `/pdf` & `/pdf-local` - PDF generation with Google Drive upload or local download
     - `/word` & `/word-local` - Word document generation with Google Drive upload or local download
   - `/speech-token` - AssemblyAI authentication token generation
   - `/conversations` - Legacy conversation management (deprecated in favor of sessions)
   - `/preferences` - User preference management
   - `/migrate-sessions` - Session migration utilities
   - `/generate-duck-avatar` - Dynamic duck avatar generation for sessions
   - `/add-avatars-to-sessions` - Bulk avatar assignment for existing sessions

2. **Custom Hooks** (`hooks/`)
   - `useSpeechRecognition` - Manages AssemblyAI real-time speech recognition via WebSocket
   - `useStreamingChat` - Handles SSE streaming and message state with retry logic
   - `useAgents` - Manages power agents with optimized loading and caching (115ms performance)
   - `useStars` - User favorites system with 409 conflict resolution and optimistic updates
   - `useTags` - Message tagging system with improved UX and validation
   - `useAuth` - Unified authentication for demo and production modes with Google OAuth
   - `useConversationManager` - Smart conversation flow management for continuous mode

3. **Database Models** (`models/`)
   - `Session` - MongoDB schema for chat sessions with avatar support and metadata
   - `Message` - Individual chat messages with tags, stars, and export metadata
   - `Agent` - Custom AI agents with prompts, descriptions, and performance optimization
   - `Star` - User favorites tracking system with conflict resolution
   - `Tag` - Message tagging system with validation and search capabilities
   - `User` - User profiles with Google OAuth integration and preferences

4. **Core Libraries** (`lib/`)
   - `claude.ts` - Claude 4 API integration with streaming support and Sonnet 3.5 fallback
   - `mongodb.ts` - Cached Mongoose MongoDB connection handler
   - `mongodb-native.ts` - Native MongoDB driver for high-performance operations
   - `middleware/auth.ts` - Unified authentication middleware with demo mode and Google OAuth
   - `assemblyai.ts` - AssemblyAI token generation and configuration
   - `googleServices.ts` - Google Drive API integration for file uploads and authentication
   - `logger.ts` - Comprehensive logging system with component-level tracking
   - `validators.ts` - Input validation and sanitization utilities
   - `export/` - Export system libraries:
     - `pdfGenerator.ts` - PDF generation with custom styling and metadata
     - `wordGenerator.ts` - Word document generation with formatting
     - `googleDriveUploader.ts` - Google Drive file upload and sharing utilities

### Streaming Architecture

The app uses Server-Sent Events (SSE) to stream Claude's responses in real-time with smart model fallback:
1. Client sends messages via POST to `/api/chat` with authentication
2. Server establishes SSE connection with error handling
3. Claude 4 API attempts streaming (with fallback to Claude 3.5 Sonnet)
4. Tokens are forwarded to client via SSE with proper encoding
5. UI updates progressively as tokens arrive with typing indicators
6. Messages are persisted to MongoDB with metadata (tags, timestamps, model used)
7. Export and star functionality available on completion

### Advanced Features

#### Authentication System
- **Google OAuth Integration**: Secure authentication with Google accounts using NextAuth.js 5.0
- **Demo Mode**: Bypass authentication for development and testing (uses real user ID for data consistency)
- **Unified Middleware**: Consistent authentication across all API endpoints with `requireAuth()` middleware
- **Session Management**: Persistent login sessions with automatic token refresh

#### Message Export System
- **PDF Export**: High-quality PDF generation with custom styling, metadata, and branding
- **Word Export**: Microsoft Word document generation with proper formatting
- **Google Drive Integration**: Automatic upload to Google Drive with sharing links
- **Local Download Fallback**: Local file download when Google Drive is unavailable
- **Smart Authentication**: Dynamic Google OAuth flow for Drive access
- **Export Modes**: Per-message export with session context and metadata

#### Star System & Message Management
- **Favorites System**: Star important messages with optimistic UI updates
- **Conflict Resolution**: Handle 409 conflicts gracefully with proper error recovery
- **Bulk Operations**: Star/unstar multiple messages efficiently
- **Persistent Storage**: MongoDB-backed favorites with user association

#### Advanced Message Tagging
- **Dynamic Tagging**: Add custom tags to messages for organization
- **Tag Validation**: Input sanitization and validation for tag consistency
- **Search Integration**: Filter messages by tags (planned feature)
- **Bulk Tag Management**: Apply tags to multiple messages
- **Tag Analytics**: Track most used tags and patterns

#### Enhanced Chat Interface
- **Copy to Clipboard**: One-click message copying with visual feedback
- **Retry Messages**: Re-send failed messages with error handling
- **Message Threading**: Improved conversation flow and context
- **Responsive Design**: Mobile-optimized interface with touch-friendly controls
- **Dark Mode Support**: Full dark/light theme with system preference detection
- **Accessibility**: ARIA labels, keyboard navigation, and screen reader support

#### Continuous Conversation Mode
- **Speech Recognition Enhancement**: Silence detection with 2-second threshold for auto-submission
- **Conversation Management**: Smart AI response determination based on context
- **Voice Flow**: Seamless voice-to-text-to-AI-response workflow
- **Context Awareness**: Understand when AI should respond vs. when to just listen

## Recent Major Improvements 🚀

### Claude 4 Integration with Smart Fallback
- **Primary Model**: Claude 4 (claude-sonnet-4-20250514) for enhanced reasoning and responses
- **Fallback System**: Automatic fallback to Claude 3.5 Sonnet if Claude 4 unavailable
- **Error Handling**: Graceful model switching with transparent user experience
- **Performance Monitoring**: Track model usage and response times for optimization

### Comprehensive Export System
- **Multi-Format Support**: PDF and Word document generation with professional styling
- **Google Drive Integration**: Seamless upload and sharing via Google Drive API
- **Local Download Fallback**: Automatic fallback to local downloads when cloud unavailable
- **Smart Authentication**: Dynamic Google OAuth flow for Drive access permissions
- **Export Quality**: High-quality documents with metadata, timestamps, and branding
- **Batch Processing**: Efficient document generation with memory optimization

### Authentication & Security Enhancements
- **Google OAuth 2.0**: Secure authentication with NextAuth.js 5.0 integration
- **Demo Mode**: Development-friendly bypass with real user data consistency
- **JWT Security**: Secure token handling with automatic refresh
- **API Protection**: Unified authentication middleware across all endpoints
- **Session Persistence**: Reliable session management with MongoDB storage

### Performance Optimizations
- **25-30x Agent Performance**: Optimized from 3-4 seconds to 115-146ms response time
- **MongoDB Native Queries**: High-performance database operations for critical paths
- **Connection Pooling**: Optimized database connection management
- **Query Optimization**: Efficient projections and indexed queries
- **Memory Management**: Reduced memory footprint and improved garbage collection

### Data Migration & Consistency
- **User Data Unification**: Migrated demo-user data to consistent user ID system
- **Session Migration**: Successfully migrated 34 sessions with conflict resolution
- **Avatar Generation**: Added dynamic duck avatars to all sessions
- **Data Integrity**: Comprehensive validation and error handling
- **Rollback Support**: Safe migration scripts with rollback capabilities

### Enhanced User Experience
- **Responsive Design**: Mobile-first responsive interface with touch optimization
- **Accessibility**: WCAG 2.1 compliant with keyboard navigation and screen reader support
- **Dark Mode**: System-aware theme switching with persistent preferences
- **Message Management**: Copy, retry, star, and tag functionality
- **Visual Feedback**: Loading states, success confirmations, and error handling
- **Performance Indicators**: Real-time typing indicators and progress feedback

## Security Notice ⚠️

**RESOLVED**: GitHub Personal Access Token was accidentally committed in `.npmrc` on 2025-08-14. 
- Token has been **completely removed from git history** using `git filter-branch`
- `.npmrc` is now in `.gitignore` to prevent future incidents  
- `.npmrc.example` template provided for secure setup
- **ACTION REQUIRED**: The exposed token `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` should be revoked in GitHub settings

## Environment Setup

Required environment variables in `.env.local`:

**Core Application**
- `MONGODB_URI` - MongoDB connection string (local: `mongodb://localhost:27017/rubber-ducky`)
- `MONGODB_DB` - Database name (default: `rubber-ducky`)
- `NEXT_PUBLIC_APP_URL` - Application URL (default: `http://localhost:3000`)

**AI Integration**
- `ANTHROPIC_API_KEY` - Claude API key for AI responses (supports Claude 4 and 3.5 Sonnet)
- `ASSEMBLYAI_API_KEY` - AssemblyAI API key for speech recognition

**Authentication (NextAuth.js)**
- `NEXTAUTH_URL` - NextAuth URL for authentication
- `NEXTAUTH_SECRET` - NextAuth secret key (generate with `openssl rand -base64 32`)
- `GOOGLE_CLIENT_ID` - Google OAuth client ID for authentication
- `GOOGLE_CLIENT_SECRET` - Google OAuth client secret

**Google Drive Export (Optional)**
- `NEXT_PUBLIC_GOOGLE_CLIENT_ID` - Google client ID for browser-based Drive API
- `GOOGLE_DRIVE_API_KEY` - Google API key for server-side Drive operations

**Development & Testing**
- `NEXT_PUBLIC_DEMO_MODE` - Enable demo mode for development (`true`/`false`)
- `NODE_ENV` - Environment setting (`development`/`production`)

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

## Development Status & Architecture

### Current Development State ✅
- **Core Functionality**: Fully operational with voice/text chat, streaming responses, and session persistence
- **AI Integration**: Claude 4 with smart fallback to Claude 3.5 Sonnet for optimal performance
- **Authentication**: Production-ready Google OAuth with demo mode for development
- **Export System**: Complete PDF/Word export with Google Drive integration and local fallback
- **Message Management**: Star system, tagging, copy/retry functionality
- **Performance**: 25-30x API improvements with sub-150ms response times
- **Mobile Support**: Responsive design with touch-optimized controls
- **Testing Infrastructure**: Jest, Playwright, and React Testing Library setup

### Architecture Highlights 🏗️
- **Dual Database Strategy**: Mongoose ODM for complex operations, native MongoDB for performance
- **Smart Fallback Systems**: Claude 4 → 3.5 fallback, Google Drive → local download fallback
- **Optimistic UI Updates**: Immediate feedback with server reconciliation
- **Component-Based Architecture**: Modular React components with proper separation of concerns
- **TypeScript Safety**: Full type coverage with strict TypeScript configuration
- **Error Boundaries**: Comprehensive error handling with graceful degradation

### Quality Assurance 🧪
- **Testing Strategy**: Unit tests with Jest, E2E tests with Playwright, component tests with RTL
- **Code Quality**: ESLint + Prettier with strict rules and automated formatting
- **Performance Monitoring**: Real-time metrics and performance tracking
- **Security**: OAuth 2.0, JWT tokens, input validation, and sanitization
- **Accessibility**: WCAG 2.1 compliance with keyboard navigation and screen reader support

### Known Issues & Monitoring 🔍
- **Stars API**: 409 Conflict responses logged (functionality works correctly - optimistic updates)
- **Google Services**: Graceful degradation when Google APIs are unavailable
- **Memory Management**: Long conversations may require periodic cleanup
- **Mobile Safari**: Minor voice recognition quirks on iOS devices

### Planned Enhancements 🚀
- **File Attachments**: Document upload and analysis system
- **Advanced Search**: Full-text search across messages and sessions
- **Message Threading**: Conversation branching and alternative responses
- **Collaboration**: Share sessions and collaborate on conversations
- **Analytics Dashboard**: Usage metrics and conversation insights
- **API Rate Limiting**: Implement rate limiting for production scalability

### Performance Metrics 📊
- **Agent Loading**: 115-146ms (25-30x improvement from 3-4 seconds)
- **Message Streaming**: Real-time SSE with <50ms latency
- **Database Operations**: 30-70ms average for CRUD operations
- **Authentication**: <100ms middleware response times
- **Export Generation**: 500ms-2s for document creation and upload
- **Bundle Size**: Optimized for fast loading with code splitting

## Comprehensive Backlog Documentation 📋

The project maintains detailed backlog documentation in `/docs/BACKLOG.org` with comprehensive documentation for all work items. A new "Current Session Backlog Items - Detailed Documentation" section contains 13 fully documented backlog items with:

- **Complete Problem Statements**: Clear description of issues and business context
- **Technical Requirements**: Detailed specifications and constraints
- **Implementation Approaches**: Step-by-step development plans
- **Priority Levels**: 🔴 HIGH, 🟡 MEDIUM, 🟢 LOW classifications
- **Complexity Estimates**: Simple/Medium/Complex with timeline estimates
- **Dependencies**: Prerequisites and related work items
- **Acceptance Criteria**: Measurable outcomes and completion requirements
- **Related Files**: Specific components and files that will be affected

### Key Documented Items Include:
1. **Claude Code Sub-Agent Integration**: Investigate why Claude Code isn't using defined agents
2. **Tour Dismissal Persistence**: Fix onboarding tour to remain dismissed
3. **User Feedback System**: Plan comprehensive feedback recording with admin access
4. **Access Control Implementation**: User roles and permissions (Admin, etc.)
5. **Avatar Optimization**: Move avatars inside message boxes for space efficiency
6. **AI-Generated Avatars**: Use AI to create agent-specific avatars
7. **Test Coverage Increase**: Raise threshold to 70% with comprehensive edge case analysis
8. **Mobile Experience**: Consider React Native for enhanced mobile apps
9. **Best Practices Audit**: Comprehensive codebase analysis for standards adherence

This documentation format serves as the standard template for future backlog items to ensure consistency and actionability.

## User Preferences

- Use README.org instead of README.md for documentation
- Follow test-driven development practices
- Write production-ready code
- Include initial prompts in git commit messages
- Maintain test coverage above 50%
- Run whitespace cleanup, documentation updates, tests, and linting before commits
- always allow `touch ~/.claude-flash-trigger`