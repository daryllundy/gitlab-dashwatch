# Design Document

## Overview

This design outlines the reorganization of the GitLab DashWatch project structure to follow modern React/TypeScript best practices. The reorganization will improve code maintainability, developer experience, and project scalability while preserving all existing functionality.

## Architecture

### Current Structure Analysis

The current project has a good foundation but needs refinement in several areas:
- Components are mixed between feature-specific and reusable components
- Some files could be better organized by feature domain
- Documentation needs to be updated to reflect the actual structure
- Import paths could be more consistent

### Target Structure

```
src/
├── components/           # React components
│   ├── common/          # Reusable components (ErrorBoundary, LoadingSpinner, PageLayout)
│   ├── ui/              # shadcn/ui components (button, card, dialog, etc.)
│   ├── features/        # Feature-specific components
│   │   ├── dashboard/   # Dashboard-related components
│   │   ├── gitlab/      # GitLab monitoring components
│   │   ├── uptime/      # Uptime monitoring components
│   │   ├── dns/         # DNS monitoring components
│   │   └── server/      # Server monitoring components
│   └── layout/          # Layout components (Navbar, etc.)
├── config/              # Configuration and environment handling
├── constants/           # Application constants and defaults
├── contexts/            # React contexts (SettingsContext)
├── hooks/               # Custom React hooks
├── lib/                 # Utility libraries (utils, etc.)
├── pages/               # Page components (Index, Settings, NotFound)
├── services/            # API services and external integrations
├── test/                # Test utilities and mocks
├── types/               # TypeScript type definitions
└── main.tsx             # Application entry point
```

## Components and Interfaces

### Component Organization Strategy

1. **Common Components** (`src/components/common/`)
   - Reusable components used across multiple features
   - Examples: ErrorBoundary, LoadingSpinner, PageLayout
   - Should have minimal dependencies and be highly reusable

2. **UI Components** (`src/components/ui/`)
   - shadcn/ui components and base UI primitives
   - Maintained as provided by shadcn/ui
   - Should not contain business logic

3. **Feature Components** (`src/components/features/`)
   - Components specific to particular features
   - Organized by feature domain (dashboard, gitlab, uptime, dns, server)
   - Can import from common and ui components

4. **Layout Components** (`src/components/layout/`)
   - Components that define application layout
   - Examples: Navbar, Sidebar, Footer
   - Used across multiple pages

### File Naming Conventions

- **Components**: PascalCase with `.tsx` extension
  - `StatusCard.tsx`, `GitlabProjectList.tsx`
- **Hooks**: camelCase with `use` prefix and `.ts` extension
  - `useSettings.ts`, `useGitlabProjects.ts`
- **Services**: camelCase with descriptive suffix and `.ts` extension
  - `settingsService.ts`, `gitlabApiService.ts`
- **Types**: PascalCase interfaces/types in `.ts` files
  - `GitlabProject`, `StatusType`, `MonitoringConfig`
- **Constants**: UPPER_SNAKE_CASE exports
  - `DEFAULT_SETTINGS`, `API_ENDPOINTS`, `STATUS_TYPES`

### Import Organization

Standardized import order:
1. React and third-party libraries
2. Internal components (common → ui → features → layout)
3. Hooks and contexts
4. Services and utilities
5. Types and constants
6. Relative imports

Example:
```typescript
import React from 'react';
import { Button } from '@/components/ui/button';
import { LoadingSpinner } from '@/components/common';
import { GitlabProjectCard } from '@/components/features/gitlab';
import { useSettings } from '@/contexts/SettingsContext';
import { gitlabApiService } from '@/services';
import type { GitlabProject } from '@/types';
import { ROUTES } from '@/constants';
```

## Data Models

### Type Organization

Types will be organized in `src/types/index.ts` with logical grouping:

```typescript
// Core application types
export interface AppSettings { ... }
export interface User { ... }

// Monitoring types
export interface MonitoringTarget { ... }
export interface StatusType { ... }

// GitLab specific types
export interface GitlabProject { ... }
export interface GitlabInstance { ... }

// Uptime monitoring types
export interface UptimeTarget { ... }
export interface UptimeStatus { ... }

// DNS monitoring types
export interface DnsTarget { ... }
export interface DnsRecord { ... }

// Server monitoring types
export interface ServerTarget { ... }
export interface ServerMetrics { ... }
```

### Configuration Models

Configuration will be centralized in `src/config/`:
- `env.ts` - Environment variable validation and typing
- `constants.ts` - Application-wide constants
- `defaults.ts` - Default configurations

## Error Handling

### Error Boundary Strategy

- Global ErrorBoundary wraps the entire application
- Feature-specific error boundaries for major sections
- Component-level error states for graceful degradation
- Consistent error logging and user feedback

### Error Types

```typescript
interface AppError {
  code: string;
  message: string;
  details?: unknown;
  timestamp: Date;
}
```

## Testing Strategy

### Test Organization

- Tests co-located with components in `__tests__` folders
- Test utilities centralized in `src/test/`
- MSW handlers for API mocking
- Comprehensive coverage for critical paths

### Test File Naming

- Component tests: `ComponentName.test.tsx`
- Hook tests: `useHookName.test.ts`
- Service tests: `serviceName.test.ts`
- Integration tests: `featureName.integration.test.tsx`

### Test Structure

```
src/
├── components/
│   ├── common/
│   │   ├── __tests__/
│   │   │   ├── ErrorBoundary.test.tsx
│   │   │   └── LoadingSpinner.test.tsx
│   │   └── ...
│   └── features/
│       └── gitlab/
│           ├── __tests__/
│           │   └── GitlabProjectCard.test.tsx
│           └── ...
```

## Implementation Phases

### Phase 1: Structure Preparation
- Create new folder structure
- Set up proper TypeScript path aliases
- Update build configuration

### Phase 2: Component Reorganization
- Move components to appropriate feature folders
- Update import statements
- Ensure all components maintain functionality

### Phase 3: Service and Utility Organization
- Organize services by feature domain
- Centralize utility functions
- Update type definitions

### Phase 4: Documentation Update
- Update README.md with new structure
- Update PROJECT_STRUCTURE.md
- Add inline documentation for complex components

### Phase 5: Testing and Validation
- Run comprehensive tests
- Validate all imports work correctly
- Ensure build process works with new structure

## Migration Strategy

### Backward Compatibility
- All existing functionality must be preserved
- No breaking changes to public APIs
- Gradual migration to avoid disruption

### Import Path Updates
- Use TypeScript path mapping for clean imports
- Update all existing import statements
- Ensure IDE auto-import works correctly

### Build Configuration Updates
- Update Vite configuration for new paths
- Ensure all assets are properly resolved
- Validate production build works correctly
