# Technology Stack

## Frontend Framework
- **React 18** with TypeScript for type safety
- **Vite** as build tool and development server
- **React Router v6** for client-side routing
- **TanStack Query** for server state management
- **React Context** for global application state

## UI & Styling
- **shadcn/ui** components built on Radix UI primitives
- **Tailwind CSS** for utility-first styling
- **Lucide React** for consistent iconography
- **next-themes** for dark/light mode support
- **Sonner** and **React Hot Toast** for notifications

## Backend & Authentication
- **Supabase** for authentication and data persistence
- **GitHub OAuth** integration for seamless sign-in
- Local storage fallback for guest users

## Development & Testing
- **Vitest** for unit and integration testing
- **Testing Library** for component testing
- **ESLint** with TypeScript rules for code quality
- **MSW** for API mocking in tests

## Build & Deployment
- **Docker** with multi-stage builds for production
- **Nginx** for serving static assets in production
- **Docker Compose** for development and production orchestration

## Common Commands

### Development
```bash
npm run dev          # Start development server (port 8080)
npm run docker:dev   # Run development environment with Docker
```

### Building & Testing
```bash
npm run build        # Production build
npm run build:dev    # Development build
npm test             # Run test suite
npm run test:watch   # Run tests in watch mode
npm run test:coverage # Run tests with coverage report
npm run check        # Type check + lint
```

### Docker Operations
```bash
npm run docker:build # Build production Docker image
npm run docker:run   # Run production container
npm run docker:prod  # Start production with docker-compose
npm run docker:stop  # Stop all containers
npm run docker:clean # Clean up containers and images
```

### Code Quality
```bash
npm run lint         # Run ESLint
npm run lint:fix     # Fix ESLint issues
npm run type-check   # TypeScript type checking
```

## Environment Configuration
- Environment variables must be provided at **build time** for production
- Use `.env` file for local development
- Required variables: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`
