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

## Architecture Overview

This is a React dashboard application built with TypeScript and Vite for monitoring self-hosted infrastructure including GitLab instances, servers, DNS domains, and website uptime.

### Key Technologies
- **Frontend**: React 18 + TypeScript + Vite
- **UI Framework**: shadcn/ui components built on Radix UI
- **Styling**: Tailwind CSS with custom animations
- **State Management**: React Context (SettingsContext) + TanStack Query
- **Backend**: Supabase for settings persistence and user authentication
- **Routing**: React Router v6

### Core Architecture

The application follows a component-based architecture with these key patterns:

**Settings Management**: Centralized through `SettingsContext` (src/contexts/SettingsContext.tsx) which handles loading/saving configurations to Supabase. All monitoring targets (GitLab instances, websites, DNS domains, servers) are user-configurable.

**Page Structure**: 
- `src/pages/Index.tsx` - Main dashboard with monitoring sections
- `src/pages/Settings.tsx` - Configuration interface
- `src/pages/GitlabProjects.tsx` - Detailed GitLab project view
- `src/pages/NotFound.tsx` - 404 fallback

**Monitoring Sections**: Each section (GitLab, DNS, Uptime, Servers) is a self-contained component in `src/components/` that reads from SettingsContext and displays status cards.

**Data Layer**: 
- `src/services/settingsService.ts` defines the settings schema and Supabase operations
- `src/lib/supabase.ts` handles Supabase client initialization
- Settings are stored across multiple Supabase tables (gitlab_instances, uptime_websites, dns_domains, server_instances)

### Component Structure

**StatusCard**: Reusable component (src/components/StatusCard.tsx) for displaying service status with health indicators (healthy/warning/error/inactive).

**UI Components**: Located in `src/components/ui/` - these are shadcn/ui components with consistent styling and behavior.

**Custom Hooks**: 
- `src/hooks/use-mobile.tsx` for responsive design
- `src/hooks/use-toast.ts` for notifications

### Environment Configuration

The app expects these environment variables:
- `VITE_SUPABASE_URL` - Supabase project URL
- `VITE_SUPABASE_ANON_KEY` - Supabase anonymous key

### Styling Approach

Uses Tailwind CSS with custom animations defined in `src/index.css`. Components use CSS custom properties for animation delays (`--delay`) to create staggered entrance effects.

### Data Flow

1. Settings are loaded on app initialization via SettingsContext
2. Each monitoring section reads relevant settings and performs status checks
3. Status updates are displayed through StatusCard components
4. User can modify settings through the Settings page, which saves to Supabase
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
- **Environment Variables**: Configured via `.env` file or docker-compose

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