# rubber-ducky-live: * Rubber Ducky Live 🦆 - AI Chat Companion

Your friendly rubber duck AI companion for thinking out loud, problem-solving, and casual conversations. Powered by Claude AI (including Claude 4) and built with Next.js.

** Features &amp; Screenshots

*** Core Features
- 🎤 Live speech-to-text conversion using AssemblyAI Real-time Streaming
- 🦆 Real-time streaming responses from your AI rubber ducky
- 🤖 Claude 4 integration with smart fallback system across multiple models
- 🔐 Enhanced authentication with Google OAuth and demo mode support
- 🏷️ Advanced message tagging system with multi-tag input and instant filtering
- 📝 Comprehensive export capabilities (PDF, Word, local files)
- 🌟 Star system for important messages with dedicated browser
- 🤖 13+ specialized AI agent personalities (interview coach, storyteller, business advisor, etc.)
- 📝 Markdown support with syntax highlighting and copy buttons
- 💾 MongoDB conversation persistence with advanced session management
- 📱 Fully responsive design with improved mobile UX
- 🔄 Server-Sent Events (SSE) for streaming responses
- 🌓 Light/Dark mode toggle
- 🎨 Beautiful cycling image animations during loading states
- 🔄 Message retry functionality and enhanced error handling
- 📊 Comprehensive session migration and data management tools

*** Main Interface
The clean, friendly interface welcomes users with a rubber ducky theme and easy-to-use controls.

[[./docs/screenshots/01-main-interface.png]]

*** Advanced Session Management
Browse, search, and manage all your chat sessions with filtering by tags, full-text search, and comprehensive export options. Features include session migration tools, avatar generation, and intelligent data organization.

[[./docs/screenshots/02-session-history-browser.png]]

*** Message Tagging &amp; Organization
Advanced tagging system with multi-tag input, instant filter clearing, and dedicated tag browser for organizing conversations by topics and themes.

*** Stars System
Star important messages and browse them in a dedicated interface for quick access to valuable insights and key conversation moments.

*** Multiple AI Agent Personalities
Choose from 13+ specialized AI agents including interview coaches, storytellers, business advisors, and technical specialists. Create custom agents with voice or text input.

[[./docs/screenshots/03-agent-selector-dropdown.png]]

*** Claude 4 Model Integration
Smart model selection with Claude 4 support, automatic fallback systems, and cost-aware model switching for optimal performance and value.

[[./docs/screenshots/04-create-agent-modal.png]]

*** Beautiful Dark Mode
Professional dark theme for comfortable extended use.

[[./docs/screenshots/05-dark-mode-interface.png]]

*** Enhanced Chat Experience
Engaging real-time conversations with improved message formatting, copy buttons, retry functionality, comprehensive export capabilities (PDF, Word, local files), and enhanced responsive design.

[[./docs/screenshots/06-active-chat-conversation.png]]

** Prerequisites

- Node.js 18+ and npm
- MongoDB instance (local or cloud)
- Anthropic API key for Claude access
- AssemblyAI API key for speech recognition
- Google OAuth credentials (optional, for authentication)
- Google Drive API credentials (optional, for cloud exports)

** Installation

1. Clone the repository:
   #+begin_src bash
   git clone &lt;repository-url&gt;
   cd rubber-ducky-live
   #+end_src

2. Install dependencies:
   #+begin_src bash
   npm install
   #+end_src

3. Set up environment variables:
   #+begin_src bash
   cp .env.example .env.local
   #+end_src

   Edit &#x3D;.env.local&#x3D; and add your credentials:
   #+begin_src
   MONGODB_URI&#x3D;mongodb://localhost:27017/rubber-ducky-live
   ANTHROPIC_API_KEY&#x3D;your_anthropic_api_key_here
   ASSEMBLYAI_API_KEY&#x3D;your_assemblyai_api_key_here
   NEXT_PUBLIC_APP_URL&#x3D;http://localhost:3000
   
   # Optional: For Google OAuth authentication
   GOOGLE_CLIENT_ID&#x3D;your_google_client_id
   GOOGLE_CLIENT_SECRET&#x3D;your_google_client_secret
   NEXTAUTH_SECRET&#x3D;your_nextauth_secret
   
   # Optional: For Google Drive exports
   GOOGLE_SERVICE_ACCOUNT_EMAIL&#x3D;your_service_account_email
   GOOGLE_PRIVATE_KEY&#x3D;your_private_key
   #+end_src

** Development

Run the development server:
#+begin_src bash
npm run dev
#+end_src

Open [[http://localhost:3000]] in your browser.

*** Development Commands
#+begin_src bash
# Linting and code quality
npm run lint              # Run ESLint
npm run build             # Type checking and build verification

# Testing
npm run test              # Run unit tests with Jest
npm run test:watch        # Run tests in watch mode
npm run test:coverage     # Generate test coverage report
npm run test:e2e          # Run end-to-end tests with Playwright
npm run test:e2e:ui       # Run e2e tests with Playwright UI

# Versioning and releases
npm run version:patch     # Patch release (0.1.0 -&gt; 0.1.1)
npm run version:minor     # Minor release (0.1.0 -&gt; 0.2.0)
npm run version:major     # Major release (0.1.0 -&gt; 1.0.0)
npm run release:dry-run   # Test release process without changes
#+end_src

** Production Build

#+begin_src bash
npm run build
npm start
#+end_src

** Project Structure

#+begin_src
rubber-ducky-live/
├── app/
│   ├── api/              # API routes
│   │   ├── auth/         # NextAuth.js authentication
│   │   ├── chat/         # SSE streaming endpoint
│   │   ├── sessions/     # Session management
│   │   ├── export/       # Export functionality (PDF, Word)
│   │   ├── stars/        # Message starring system
│   │   ├── tags/         # Message tagging system
│   │   └── agents/       # AI agent management
│   ├── components/       # React components
│   │   ├── ChatInterface.tsx
│   │   ├── VoiceInput.tsx
│   │   ├── MessageDisplay.tsx
│   │   ├── MessageTagInterface.tsx
│   │   ├── StarsBrowser.tsx
│   │   ├── ModelSelector.tsx
│   │   ├── SessionBrowser.tsx
│   │   └── MessageExportButton.tsx
│   ├── contexts/         # React context providers
│   ├── layout.tsx
│   └── page.tsx
├── hooks/                # Custom React hooks
│   ├── useSpeechRecognition.ts
│   ├── useStreamingChat.ts
│   ├── useTags.ts
│   ├── useStars.ts
│   └── useAuth.ts
├── lib/                  # Utility functions
│   ├── mongodb.ts        # Database connection
│   ├── claude.ts         # Claude API integration
│   ├── auth.ts           # Authentication configuration
│   ├── models.ts         # AI model configuration
│   └── export/           # Export utilities
├── models/               # MongoDB schemas
│   ├── Session.ts
│   ├── Message.ts
│   └── User.ts
└── types/                # TypeScript definitions
    └── index.ts
#+end_src

** Usage

*** Basic Chat Features
1. *Voice Input*: Click the 🦆 microphone button to start talking to your rubber ducky. The app will automatically transcribe your speech and send it when you stop speaking.

2. *Text Input*: Type your thoughts in the text area and press Enter or click Send to share them with your rubber ducky.

3. *Model Selection*: Choose between different Claude models (including Claude 4) with automatic fallback and cost optimization.

4. *Agent Selection*: Pick from 13+ specialized AI agents or create custom agents with voice or text input.

*** Advanced Features
5. *Message Management*: 
   - Star important messages for quick access via the Stars browser
   - Tag messages with multiple tags for organization
   - Copy message content with one-click copy buttons
   - Retry failed messages with enhanced error handling

6. *Export Options*:
   - Export individual messages or entire conversations
   - Multiple formats: PDF, Word documents, and local text files
   - Cloud export to Google Drive (with proper authentication)

7. *Session Management*:
   - Browse all chat sessions with filtering and search
   - Rename sessions and organize by tags
   - Session migration tools for data management
   - URL-based session routing (sessions persist across browser refreshes)

8. *Authentication*:
   - Google OAuth integration for user accounts
   - Demo mode for anonymous usage
   - Secure session persistence and user data management

** Browser Compatibility

Voice input requires a browser that supports WebSocket and MediaRecorder APIs:
- Chrome (recommended)
- Firefox (good support)
- Safari (good support)
- Edge (good support)

** API Endpoints

*** Core Chat &amp; Sessions
- &#x3D;POST /api/chat&#x3D; - Stream chat responses from Claude with model selection
- &#x3D;GET /api/sessions&#x3D; - Fetch session history with filtering and pagination
- &#x3D;POST /api/sessions&#x3D; - Create new chat session
- &#x3D;PUT /api/sessions/[id]&#x3D; - Update session details (rename, etc.)
- &#x3D;DELETE /api/sessions/[id]&#x3D; - Delete a session
- &#x3D;POST /api/speech-token&#x3D; - Generate AssemblyAI authentication token

*** Message Management
- &#x3D;PUT /api/sessions/messages/[messageId]/tags&#x3D; - Update message tags
- &#x3D;POST /api/stars&#x3D; - Star/unstar messages
- &#x3D;GET /api/stars&#x3D; - Fetch starred messages with filtering
- &#x3D;GET /api/tags&#x3D; - Fetch available tags with usage statistics

*** Export &amp; Data
- &#x3D;POST /api/export/pdf&#x3D; - Export conversations to PDF
- &#x3D;POST /api/export/word&#x3D; - Export conversations to Word documents
- &#x3D;POST /api/export/pdf-local&#x3D; - Generate local PDF exports
- &#x3D;POST /api/export/word-local&#x3D; - Generate local Word exports

*** Authentication &amp; Agents
- &#x3D;GET/POST /api/auth/[...nextauth]&#x3D; - NextAuth.js authentication endpoints
- &#x3D;GET /api/agents&#x3D; - Fetch available AI agents
- &#x3D;POST /api/agents&#x3D; - Create custom AI agents

** Technologies Used

*** Core Framework &amp; Language
- [[https://nextjs.org/][Next.js 15]] - React framework with App Router
- [[https://www.typescriptlang.org/][TypeScript]] - Type safety and developer experience
- [[https://react.dev/][React 19]] - UI library with latest features

*** Styling &amp; UI
- [[https://tailwindcss.com/][Tailwind CSS]] - Utility-first styling
- [[https://lucide.dev/][Lucide React]] - Beautiful icon library
- Responsive design with mobile-first approach

*** AI &amp; ML Integration
- [[https://www.anthropic.com/][Claude AI]] - Multiple models including Claude 4 with smart fallback
- [[https://www.assemblyai.com/][AssemblyAI]] - Real-time speech recognition
- [[https://replicate.com/][Replicate]] - AI avatar generation

*** Database &amp; Storage
- [[https://www.mongodb.com/][MongoDB]] - Document database with Mongoose ODM
- [[https://next-auth.js.org/][NextAuth.js]] - Authentication with MongoDB adapter

*** Export &amp; Integration
- [[https://www.npmjs.com/package/jspdf][jsPDF]] - PDF generation
- [[https://www.npmjs.com/package/docx][docx]] - Word document generation
- [[https://developers.google.com/drive][Google Drive API]] - Cloud export integration
- [[https://developers.google.com/identity][Google OAuth]] - Authentication

*** Development &amp; Testing
- [[https://eslint.org/][ESLint]] - Code linting
- [[https://prettier.io/][Prettier]] - Code formatting
- [[https://jestjs.io/][Jest]] - Unit testing
- [[https://playwright.dev/][Playwright]] - End-to-end testing

** License

MIT

## Overview

rubber-ducky-live is a nextjs application built with JavaScript, React, Next.js, MongoDB, Tailwind CSS, TypeScript, and Jest. * Rubber Ducky Live 🦆 - AI Chat Companion

Your friendly rubber duck AI companion for thinking out loud, problem-solving, and casual conversations. Powered by Claude AI (including Claude 4) and built with Next.js.

** Features &amp; Screenshots

*** Core Features
- 🎤 Live speech-to-text conversion using AssemblyAI Real-time Streaming
- 🦆 Real-time streaming responses from your AI rubber ducky
- 🤖 Claude 4 integration with smart fallback system across multiple models
- 🔐 Enhanced authentication with Google OAuth and demo mode support
- 🏷️ Advanced message tagging system with multi-tag input and instant filtering
- 📝 Comprehensive export capabilities (PDF, Word, local files)
- 🌟 Star system for important messages with dedicated browser
- 🤖 13+ specialized AI agent personalities (interview coach, storyteller, business advisor, etc.)
- 📝 Markdown support with syntax highlighting and copy buttons
- 💾 MongoDB conversation persistence with advanced session management
- 📱 Fully responsive design with improved mobile UX
- 🔄 Server-Sent Events (SSE) for streaming responses
- 🌓 Light/Dark mode toggle
- 🎨 Beautiful cycling image animations during loading states
- 🔄 Message retry functionality and enhanced error handling
- 📊 Comprehensive session migration and data management tools

*** Main Interface
The clean, friendly interface welcomes users with a rubber ducky theme and easy-to-use controls.

[[./docs/screenshots/01-main-interface.png]]

*** Advanced Session Management
Browse, search, and manage all your chat sessions with filtering by tags, full-text search, and comprehensive export options. Features include session migration tools, avatar generation, and intelligent data organization.

[[./docs/screenshots/02-session-history-browser.png]]

*** Message Tagging &amp; Organization
Advanced tagging system with multi-tag input, instant filter clearing, and dedicated tag browser for organizing conversations by topics and themes.

*** Stars System
Star important messages and browse them in a dedicated interface for quick access to valuable insights and key conversation moments.

*** Multiple AI Agent Personalities
Choose from 13+ specialized AI agents including interview coaches, storytellers, business advisors, and technical specialists. Create custom agents with voice or text input.

[[./docs/screenshots/03-agent-selector-dropdown.png]]

*** Claude 4 Model Integration
Smart model selection with Claude 4 support, automatic fallback systems, and cost-aware model switching for optimal performance and value.

[[./docs/screenshots/04-create-agent-modal.png]]

*** Beautiful Dark Mode
Professional dark theme for comfortable extended use.

[[./docs/screenshots/05-dark-mode-interface.png]]

*** Enhanced Chat Experience
Engaging real-time conversations with improved message formatting, copy buttons, retry functionality, comprehensive export capabilities (PDF, Word, local files), and enhanced responsive design.

[[./docs/screenshots/06-active-chat-conversation.png]]

** Prerequisites

- Node.js 18+ and npm
- MongoDB instance (local or cloud)
- Anthropic API key for Claude access
- AssemblyAI API key for speech recognition
- Google OAuth credentials (optional, for authentication)
- Google Drive API credentials (optional, for cloud exports)

** Installation

1. Clone the repository:
   #+begin_src bash
   git clone &lt;repository-url&gt;
   cd rubber-ducky-live
   #+end_src

2. Install dependencies:
   #+begin_src bash
   npm install
   #+end_src

3. Set up environment variables:
   #+begin_src bash
   cp .env.example .env.local
   #+end_src

   Edit &#x3D;.env.local&#x3D; and add your credentials:
   #+begin_src
   MONGODB_URI&#x3D;mongodb://localhost:27017/rubber-ducky-live
   ANTHROPIC_API_KEY&#x3D;your_anthropic_api_key_here
   ASSEMBLYAI_API_KEY&#x3D;your_assemblyai_api_key_here
   NEXT_PUBLIC_APP_URL&#x3D;http://localhost:3000
   
   # Optional: For Google OAuth authentication
   GOOGLE_CLIENT_ID&#x3D;your_google_client_id
   GOOGLE_CLIENT_SECRET&#x3D;your_google_client_secret
   NEXTAUTH_SECRET&#x3D;your_nextauth_secret
   
   # Optional: For Google Drive exports
   GOOGLE_SERVICE_ACCOUNT_EMAIL&#x3D;your_service_account_email
   GOOGLE_PRIVATE_KEY&#x3D;your_private_key
   #+end_src

** Development

Run the development server:
#+begin_src bash
npm run dev
#+end_src

Open [[http://localhost:3000]] in your browser.

*** Development Commands
#+begin_src bash
# Linting and code quality
npm run lint              # Run ESLint
npm run build             # Type checking and build verification

# Testing
npm run test              # Run unit tests with Jest
npm run test:watch        # Run tests in watch mode
npm run test:coverage     # Generate test coverage report
npm run test:e2e          # Run end-to-end tests with Playwright
npm run test:e2e:ui       # Run e2e tests with Playwright UI

# Versioning and releases
npm run version:patch     # Patch release (0.1.0 -&gt; 0.1.1)
npm run version:minor     # Minor release (0.1.0 -&gt; 0.2.0)
npm run version:major     # Major release (0.1.0 -&gt; 1.0.0)
npm run release:dry-run   # Test release process without changes
#+end_src

** Production Build

#+begin_src bash
npm run build
npm start
#+end_src

** Project Structure

#+begin_src
rubber-ducky-live/
├── app/
│   ├── api/              # API routes
│   │   ├── auth/         # NextAuth.js authentication
│   │   ├── chat/         # SSE streaming endpoint
│   │   ├── sessions/     # Session management
│   │   ├── export/       # Export functionality (PDF, Word)
│   │   ├── stars/        # Message starring system
│   │   ├── tags/         # Message tagging system
│   │   └── agents/       # AI agent management
│   ├── components/       # React components
│   │   ├── ChatInterface.tsx
│   │   ├── VoiceInput.tsx
│   │   ├── MessageDisplay.tsx
│   │   ├── MessageTagInterface.tsx
│   │   ├── StarsBrowser.tsx
│   │   ├── ModelSelector.tsx
│   │   ├── SessionBrowser.tsx
│   │   └── MessageExportButton.tsx
│   ├── contexts/         # React context providers
│   ├── layout.tsx
│   └── page.tsx
├── hooks/                # Custom React hooks
│   ├── useSpeechRecognition.ts
│   ├── useStreamingChat.ts
│   ├── useTags.ts
│   ├── useStars.ts
│   └── useAuth.ts
├── lib/                  # Utility functions
│   ├── mongodb.ts        # Database connection
│   ├── claude.ts         # Claude API integration
│   ├── auth.ts           # Authentication configuration
│   ├── models.ts         # AI model configuration
│   └── export/           # Export utilities
├── models/               # MongoDB schemas
│   ├── Session.ts
│   ├── Message.ts
│   └── User.ts
└── types/                # TypeScript definitions
    └── index.ts
#+end_src

** Usage

*** Basic Chat Features
1. *Voice Input*: Click the 🦆 microphone button to start talking to your rubber ducky. The app will automatically transcribe your speech and send it when you stop speaking.

2. *Text Input*: Type your thoughts in the text area and press Enter or click Send to share them with your rubber ducky.

3. *Model Selection*: Choose between different Claude models (including Claude 4) with automatic fallback and cost optimization.

4. *Agent Selection*: Pick from 13+ specialized AI agents or create custom agents with voice or text input.

*** Advanced Features
5. *Message Management*: 
   - Star important messages for quick access via the Stars browser
   - Tag messages with multiple tags for organization
   - Copy message content with one-click copy buttons
   - Retry failed messages with enhanced error handling

6. *Export Options*:
   - Export individual messages or entire conversations
   - Multiple formats: PDF, Word documents, and local text files
   - Cloud export to Google Drive (with proper authentication)

7. *Session Management*:
   - Browse all chat sessions with filtering and search
   - Rename sessions and organize by tags
   - Session migration tools for data management
   - URL-based session routing (sessions persist across browser refreshes)

8. *Authentication*:
   - Google OAuth integration for user accounts
   - Demo mode for anonymous usage
   - Secure session persistence and user data management

** Browser Compatibility

Voice input requires a browser that supports WebSocket and MediaRecorder APIs:
- Chrome (recommended)
- Firefox (good support)
- Safari (good support)
- Edge (good support)

** API Endpoints

*** Core Chat &amp; Sessions
- &#x3D;POST /api/chat&#x3D; - Stream chat responses from Claude with model selection
- &#x3D;GET /api/sessions&#x3D; - Fetch session history with filtering and pagination
- &#x3D;POST /api/sessions&#x3D; - Create new chat session
- &#x3D;PUT /api/sessions/[id]&#x3D; - Update session details (rename, etc.)
- &#x3D;DELETE /api/sessions/[id]&#x3D; - Delete a session
- &#x3D;POST /api/speech-token&#x3D; - Generate AssemblyAI authentication token

*** Message Management
- &#x3D;PUT /api/sessions/messages/[messageId]/tags&#x3D; - Update message tags
- &#x3D;POST /api/stars&#x3D; - Star/unstar messages
- &#x3D;GET /api/stars&#x3D; - Fetch starred messages with filtering
- &#x3D;GET /api/tags&#x3D; - Fetch available tags with usage statistics

*** Export &amp; Data
- &#x3D;POST /api/export/pdf&#x3D; - Export conversations to PDF
- &#x3D;POST /api/export/word&#x3D; - Export conversations to Word documents
- &#x3D;POST /api/export/pdf-local&#x3D; - Generate local PDF exports
- &#x3D;POST /api/export/word-local&#x3D; - Generate local Word exports

*** Authentication &amp; Agents
- &#x3D;GET/POST /api/auth/[...nextauth]&#x3D; - NextAuth.js authentication endpoints
- &#x3D;GET /api/agents&#x3D; - Fetch available AI agents
- &#x3D;POST /api/agents&#x3D; - Create custom AI agents

** Technologies Used

*** Core Framework &amp; Language
- [[https://nextjs.org/][Next.js 15]] - React framework with App Router
- [[https://www.typescriptlang.org/][TypeScript]] - Type safety and developer experience
- [[https://react.dev/][React 19]] - UI library with latest features

*** Styling &amp; UI
- [[https://tailwindcss.com/][Tailwind CSS]] - Utility-first styling
- [[https://lucide.dev/][Lucide React]] - Beautiful icon library
- Responsive design with mobile-first approach

*** AI &amp; ML Integration
- [[https://www.anthropic.com/][Claude AI]] - Multiple models including Claude 4 with smart fallback
- [[https://www.assemblyai.com/][AssemblyAI]] - Real-time speech recognition
- [[https://replicate.com/][Replicate]] - AI avatar generation

*** Database &amp; Storage
- [[https://www.mongodb.com/][MongoDB]] - Document database with Mongoose ODM
- [[https://next-auth.js.org/][NextAuth.js]] - Authentication with MongoDB adapter

*** Export &amp; Integration
- [[https://www.npmjs.com/package/jspdf][jsPDF]] - PDF generation
- [[https://www.npmjs.com/package/docx][docx]] - Word document generation
- [[https://developers.google.com/drive][Google Drive API]] - Cloud export integration
- [[https://developers.google.com/identity][Google OAuth]] - Authentication

*** Development &amp; Testing
- [[https://eslint.org/][ESLint]] - Code linting
- [[https://prettier.io/][Prettier]] - Code formatting
- [[https://jestjs.io/][Jest]] - Unit testing
- [[https://playwright.dev/][Playwright]] - End-to-end testing

** License

MIT

## Key Features

### React Components
Reusable UI components

### API Routes
Next.js API endpoints


## Technology Stack

- **JavaScript**
- **React**
- **Next.js**
- **MongoDB**
- **Tailwind CSS**
- **TypeScript**
- **Jest**

## Getting Started

### Prerequisites
- node 
- Npm package manager

### Installation

```bash
npm install
```

### Development

```bash
npm run dev
```

## Project Structure

The project follows nextjs best practices with a clean, organized structure.

## Contributing

We welcome contributions! Please see our contributing guidelines for more information.

## License

This project is open source and available under the [MIT License](LICENSE).

---

*Generated on August 25, 2025 by DevContent Generator*
