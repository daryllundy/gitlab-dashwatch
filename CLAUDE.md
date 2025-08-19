# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### Local Development
- `npm run dev` - Start development server on port 8080
- `npm run build` - Build for production 
- `npm run build:dev` - Build for development mode
- `npm run lint` - Run ESLint for code quality checks
- `npm run preview` - Preview production build

### Docker Commands
- `npm run docker:build` - Build production Docker image
- `npm run docker:run` - Run production container on port 3000
- `npm run docker:dev` - Run development environment with hot reload
- `npm run docker:prod` - Run production using docker-compose
- `npm run docker:stop` - Stop all containers
- `npm run docker:clean` - Clean up containers, volumes, and images

### Quality Assurance
- `npm run type-check` - Run TypeScript type checking
- `npm run lint:fix` - Fix auto-fixable linting issues
- `npm run check` - Run both type checking and linting

## Architecture Overview

This is a React dashboard application built with TypeScript and Vite for monitoring self-hosted infrastructure including GitLab instances, servers, DNS domains, and website uptime.

### Key Technologies
- **Frontend**: React 18 + TypeScript + Vite
- **UI Framework**: shadcn/ui components built on Radix UI
- **Styling**: Tailwind CSS with custom animations
- **State Management**: React Context (SettingsContext) + TanStack Query
- **Storage**: Browser localStorage for settings persistence
- **Routing**: React Router v6

### Project Organization

The codebase follows strict organizational principles:

**Type Safety**: 
- Strict TypeScript configuration with comprehensive type checking
- Centralized type definitions in `src/types/`
- Proper prop typing for all components

**Error Handling**: 
- Global error boundary for graceful error handling
- Component-level error states and loading feedback
- Environment validation at startup

**Component Architecture**:
- `src/components/common/` - Reusable components (ErrorBoundary, LoadingSpinner, PageLayout)
- `src/components/ui/` - shadcn/ui components
- Feature-specific components organized by domain

**Configuration Management**:
- `src/config/env.ts` - Environment variable validation
- `src/constants/` - Application constants and defaults
- `src/services/` - External API integrations

**Settings Management**: Centralized through `SettingsContext` which handles loading/saving configurations to browser localStorage. All monitoring targets are user-configurable.

### Component Structure

**StatusCard**: Reusable component (src/components/StatusCard.tsx) for displaying service status with health indicators (healthy/warning/error/inactive).

**UI Components**: Located in `src/components/ui/` - these are shadcn/ui components with consistent styling and behavior.

**Custom Hooks**: 
- `src/hooks/use-mobile.tsx` for responsive design
- `src/hooks/use-toast.ts` for notifications

### Environment Configuration

No environment variables are required for basic operation. The application runs without authentication and stores all settings locally in the browser.

### Styling Approach

Uses Tailwind CSS with custom animations defined in `src/index.css`. Components use CSS custom properties for animation delays (`--delay`) to create staggered entrance effects.

### Data Flow

1. Settings are loaded on app initialization via SettingsContext from localStorage
2. Each monitoring section reads relevant settings and performs status checks
3. Status updates are displayed through StatusCard components
4. User can modify settings through the Settings page, which saves to localStorage
5. Changes trigger re-renders across relevant monitoring sections

### GitLab Integration Notes

Currently uses mock data for demonstration. Real implementation would:
- Use configured GitLab instance URLs and API tokens from settings
- Make authenticated API calls to GitLab REST API
- Support multiple GitLab instances per user
- Display real project metrics (issues, branches, merge requests, last commit)

## Deployment Architecture

The application supports multiple deployment options:

### Docker Deployment
- **Production Image**: Multi-stage build with Nginx serving static files
- **Development Image**: Node.js with hot reload for development
- **Port Configuration**: Development (8080), Production (3000 → 80)
- **Environment Variables**: No configuration required

### Hosting Options
The Docker container can be deployed to:
- Local development environment
- DigitalOcean App Platform
- Railway, Fly.io, Heroku (container registry)
- AWS ECS/Fargate, Google Cloud Run
- Any VPS with Docker support

### File Structure for Deployment
- `Dockerfile` - Production build with Nginx
- `Dockerfile.dev` - Development environment
- `docker-compose.yml` - Local orchestration
- `.dockerignore` - Optimized build context
- `.env.example` - Environment template
