# Project Structure

This document outlines the organized structure of the GitLab DashWatch project.

## Directory Structure

```
src/
├── components/           # React components
│   ├── common/          # Reusable common components
│   │   ├── ErrorBoundary.tsx
│   │   ├── LoadingSpinner.tsx
│   │   ├── PageLayout.tsx
│   │   └── index.ts
│   ├── ui/              # shadcn/ui components
│   └── [feature components] # Feature-specific components
├── config/              # Configuration files
│   └── env.ts          # Environment variable handling
├── constants/           # Application constants
│   └── index.ts        # All constants and defaults
├── contexts/           # React contexts
│   └── SettingsContext.tsx
├── hooks/              # Custom React hooks
├── lib/                # Utility libraries
│   └── utils.ts       # General utilities
├── pages/              # Page components
├── services/           # API and external services
│   └── settingsService.ts
├── types/              # TypeScript type definitions
│   └── index.ts       # All type exports
├── index.css          # Global styles
├── main.tsx           # Application entry point
└── vite-env.d.ts      # Vite type definitions
```

## Key Design Principles

### 1. Type Safety
- Strict TypeScript configuration with comprehensive type checking
- Centralized type definitions in `src/types/`
- Proper prop typing for all components

### 2. Error Handling
- Global error boundary for graceful error handling
- Component-level error states
- Proper loading states throughout the application

### 3. Configuration Management
- Environment variables validated at startup
- Centralized constants for maintainability
- Default configurations for easy setup

### 4. Component Architecture
- Reusable common components
- Feature-specific components organized by domain
- Consistent prop interfaces and documentation

### 5. State Management
- React Context for global state (settings)
- TanStack Query for server state
- Local state for component-specific data
- Browser localStorage for settings persistence

## File Naming Conventions

- **Components**: PascalCase (e.g., `StatusCard.tsx`)
- **Hooks**: camelCase with `use` prefix (e.g., `useSettings.ts`)
- **Constants**: UPPER_SNAKE_CASE (e.g., `DEFAULT_SETTINGS`)
- **Types**: PascalCase (e.g., `GitlabProject`)
- **Services**: camelCase (e.g., `settingsService.ts`)

## Import Organization

1. React and third-party libraries
2. Internal components (common, then specific)
3. Hooks and contexts
4. Types and constants
5. Relative imports

Example:
```typescript
import React from 'react';
import { Button } from '@/components/ui/button';
import { LoadingSpinner } from '@/components/common';
import { useSettings } from '@/contexts/SettingsContext';
import type { GitlabProject } from '@/types';
import { ROUTES } from '@/constants';
```

## Development Workflow

1. **Type First**: Define types before implementing features
2. **Error Boundaries**: Wrap new features with appropriate error handling
3. **Loading States**: Always provide loading feedback for async operations
4. **Documentation**: Document complex components and functions
5. **Testing**: Use `npm run check` to validate types and linting

## Configuration Files

- `tsconfig.json` - Root TypeScript configuration
- `tsconfig.app.json` - Application-specific TypeScript settings
- `eslint.config.js` - ESLint configuration with strict rules
- `vite.config.ts` - Vite build configuration
- `tailwind.config.ts` - Tailwind CSS configuration
