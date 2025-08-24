# Confidential RAG Chatbot - AI Context

## Project Overview

A privacy-first RAG chatbot that enables users to upload TXT files as knowledge bases and chat with them using only open-source models. No data leaves the local environment.

## Architecture & Tech Stack

### Core Stack

- **Framework**: Next.js 15 (full-stack)
- **Language**: TypeScript
- **Styling**: Tailwind CSS + Design System
- **Testing**: Vitest (unit/integration) + Playwright (E2E)
- **RAG Pipeline**: LangChain.js
- **Vector Store**: ChromaDB
- **LLM**: Ollama (open-source models)
- **Embeddings**: HuggingFace.js
- **Orchestration**: Docker Compose

### Key Components

```
/app                    # Next.js 15 app router
  /actions              # Server Actions
    /chat.ts            # Chat action
    /upload.ts          # File upload action (includes chunking & embedding)
  /api                  # API routes (fallback only)
    /health             # Health check endpoint (Ollama and ChromaDB)
  /components           # React components
    /ui                 # Reusable UI components
    /chat               # Chat-specific components
  /lib                  # Utilities & services
    /langchain          # LangChain integrations
    /chromadb           # Vector store client
    /ollama             # LLM client
    /theme              # Styling theme & constants
  /styles               # Tailwind config & globals
/tests                  # Test files
  /e2e                  # Playwright E2E tests (*.spec.ts)
/docker-compose.yml     # Services orchestration
```

## Development Workflow

### Setup

```bash
docker-compose up -d    # Start ChromaDB + Ollama
npm install
npm run dev
```

### Core Commands

- `npm run dev` - Development server
- `npm run build` - Production build
- `npm run test:unit` - Run Vitest unit/integration tests
- `npm run test:e2e` - Run Playwright E2E tests
- `npm run format` - Format code with Prettier
- `npm run format:check` - Check if code is formatted
- `docker-compose up -d` - Start services
- `docker-compose down` - Stop services

## Code Style & Patterns

### React/Next.js

- Use App Router (Next.js 15)
- Prefer Server Actions over API routes when possible
- Server Components by default, Client Components only when needed
- TypeScript strict mode
- Functional components with hooks
- Add `import 'server-only';` to server-only files (exclude page.tsx/layout.tsx)
- Use `type` instead of `interface` for TypeScript objects

### Styling

- Tailwind CSS for utility-first styling
- Design system with consistent theme tokens
- Component-based styling patterns
- Dark/light mode support
- Responsive design mobile-first

### File Organization

- Group by feature, not by type
- Co-locate tests with components using `.test.ts` suffix
- Keep Server Actions simple and focused
- Separate UI components from business logic
- All code must be formatted with Prettier (see `.prettierrc`)

### Code Formatting

- **Prettier Config**: Follow `.prettierrc` configuration strictly
- **Line Length**: 80 characters max
- **Quotes**: Single quotes for JS/TS, JSX
- **Semicolons**: Always include
- **Trailing Commas**: ES5 compatible
- **Indentation**: 2 spaces, no tabs

### Best Practices & Clean Code

- **SOC (Separation of Concerns)**: Keep business logic, UI, and data layers separate
- **DRY (Don't Repeat Yourself)**: Extract common functionality into reusable utilities
- **KISS (Keep It Simple, Stupid)**: Choose simple solutions over complex ones
- **YAGNI (You Aren't Gonna Need It)**: Don't build features until they're needed
- **DYC (Document Your Code)**: Use JSDoc comments for functions and complex logic
- **Return Early**: Use early returns to reduce nesting and improve readability
- **Input Validation**: Never trust client input; always validate and sanitize

### Development Principles

- Keep PRs small and focused on single concerns
- Avoid over-engineering and making assumptions
- Minimize new NPM packages - use built-in solutions when possible
- Write self-documenting code with clear naming
- Validate all data at boundaries (client → server, external APIs)

### Naming

- Components: PascalCase (`ChatInterface`)
- Files: kebab-case (`chat-interface.tsx`)
- Functions: camelCase (`embedDocument`)
- Actions: camelCase (`uploadFileAction`)
- Constants: UPPER_SNAKE_CASE (`MAX_FILE_SIZE`)
- CSS Classes: Tailwind utilities + semantic names
- Unit Tests: Co-located with `.test.ts` suffix (`chat-interface.test.ts`)
- E2E Tests: In `/tests/e2e/` with `.spec.ts` suffix (`upload-flow.spec.ts`)

## Styling Theme & Design System

### Color Palette

```typescript
// Primary theme colors
const theme = {
  primary: {
    50: '#f0f9ff', // Light blue backgrounds
    500: '#3b82f6', // Primary blue
    900: '#1e3a8a', // Dark blue
  },
  neutral: {
    50: '#f9fafb', // Light backgrounds
    100: '#f3f4f6', // Card backgrounds
    500: '#6b7280', // Secondary text
    900: '#111827', // Primary text
  },
  success: '#10b981', // File upload success
  warning: '#f59e0b', // Processing states
  error: '#ef4444', // Error states
};
```

### Typography

- **Headings**: Inter font family, semibold weights
- **Body**: Inter font family, normal weights
- **Code**: JetBrains Mono, monospace
- **Scale**: text-sm, text-base, text-lg, text-xl, text-2xl

### Component Patterns

- **Cards**: Subtle borders, soft shadows, rounded corners
- **Buttons**: Primary (filled), Secondary (outlined), Ghost (text)
- **Input**: Clean borders, focus rings, proper contrast
- **Chat Bubbles**: Distinct user/assistant styling
- **Loading States**: Skeleton screens, progress indicators

### Layout Principles

- **Spacing**: Consistent 4px grid (space-1, space-4, space-8)
- **Containers**: Max-width constraints, centered content
- **Responsive**: Mobile-first, clean breakpoints
- **Accessibility**: Proper contrast ratios, focus indicators

## Implementation Approach

### Think Through Steps

1. **Identify the core problem**
2. **Choose the simplest solution**
3. **Implement incrementally**
4. **Test early and often**

### Avoid Overthinking

- Start with basic implementations
- Optimize when there's a clear need
- Prefer composition over abstraction
- Use established patterns from the ecosystem

## Privacy & Security Constraints

### Must-Haves

- All processing happens locally
- No external API calls to proprietary models
- User data never leaves the environment
- Clear data retention policies

### Technical Constraints

- File uploads limited to TXT format
- Reasonable file size limits
- Graceful error handling
- Proper cleanup of temporary files

## RAG Pipeline Flow

1. **Upload**: User uploads TXT file via Server Action
2. **Chunk & Embed**: LangChain.js splits document + HuggingFace.js creates embeddings
3. **Store**: ChromaDB persists vectors
4. **Query**: User asks question via Server Action
5. **Retrieve**: ChromaDB finds relevant chunks
6. **Generate**: Ollama generates response
7. **Stream**: Response streamed back to UI

## Health Monitoring

### Health Check Endpoint

- **Route**: `/api/health`
- **Purpose**: Verify ChromaDB and Ollama services are running
- **Response**: JSON with service status and model availability
- **Usage**: Frontend can check before enabling chat functionality

## Testing Strategy

### Unit Tests (Vitest)

- Co-located with components using `.test.ts` suffix
- Use `describe` and `it` blocks for test structure
- Write tests without requiring `@ts-ignore` or similar disables
- Utility functions and data processing logic
- Component rendering and behavior
- LangChain chunking logic
- Embedding transformations
- Server Actions and ChromaDB/Ollama integrations

### E2E Tests (Playwright)

- Located in `/tests/e2e/` with `.spec.ts` suffix
- Complete user journeys
- File upload → chat flow
- Error scenarios
- Service health checks
- Responsive design validation

## Persona & Communication Style

**As an AI assistant for this project:**

- Be direct and actionable
- Focus on practical implementation
- Suggest the simplest working solution first
- Consider privacy implications in all suggestions
- Think incrementally - what's the next smallest step?
- Avoid over-engineering - this is a focused tool, not a platform
- Always format generated code according to `.prettierrc` configuration
- Follow clean code principles: SOC, DRY, KISS, YAGNI
- Use early returns and proper input validation
- Minimize dependencies and keep PRs focused

**Code Review Mindset:**

- Is this the simplest solution that works?
- Does this maintain user privacy?
- Is this testable without TypeScript disables?
- Will this scale reasonably?
- Is the error handling appropriate?
- Is the code properly formatted with Prettier?
- Are inputs properly validated and sanitized?
- Does this follow clean code principles?

## Next Steps Thinking

Always consider:

1. What's the minimal viable implementation?
2. What could break and how do we handle it?
3. How will we test this?
4. What's the next logical feature to build?
5. Are we maintaining our privacy guarantees?
