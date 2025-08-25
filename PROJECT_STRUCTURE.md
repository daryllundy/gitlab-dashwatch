# Project Structure

This document provides comprehensive documentation of the GitLab DashWatch project structure, organized according to modern React/TypeScript best practices for maintainability, scalability, and developer experience.

## Directory Structure

```
src/
├── components/           # React components organized by type and feature
│   ├── common/          # Reusable components used across features
│   │   ├── __tests__/   # Tests for common components
│   │   ├── AnimatedNumber.tsx
│   │   ├── ErrorBoundary.tsx
│   │   ├── LoadingSpinner.tsx
│   │   ├── PageLayout.tsx
│   │   └── index.ts     # Barrel exports for clean imports
│   ├── ui/              # shadcn/ui components and base UI primitives
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   ├── dialog.tsx
│   │   └── [other shadcn components]
│   ├── features/        # Feature-specific components organized by domain
│   │   ├── dashboard/   # Dashboard-related components
│   │   ├── gitlab/      # GitLab monitoring components
│   │   ├── uptime/      # Uptime monitoring components
│   │   ├── dns/         # DNS monitoring components
│   │   └── server/      # Server monitoring components
│   └── layout/          # Layout and navigation components
│       ├── __tests__/
│       └── Navbar.tsx
├── config/              # Configuration and environment handling
│   ├── __tests__/       # Configuration tests
│   ├── app.ts          # Application configuration
│   ├── auth.ts         # Authentication configuration
│   ├── defaults.ts     # Default configurations
│   ├── env.ts          # Environment variable validation
│   ├── index.ts        # Configuration barrel exports
│   ├── monitoring.ts   # Monitoring configuration
│   ├── storage.ts      # Storage configuration
│   └── ui.ts           # UI configuration
├── constants/           # Application constants and defaults
│   └── index.ts        # All constants with logical grouping
├── contexts/            # React contexts for global state
│   ├── __tests__/      # Context tests
│   └── SettingsContext.tsx
├── hooks/               # Custom React hooks
│   ├── use-mobile.tsx  # Mobile detection hook
│   └── use-toast.ts    # Toast notification hook
├── lib/                 # Utility libraries and helper functions
│   ├── api.ts          # API utilities and HTTP client
│   ├── date.ts         # Date formatting utilities
│   ├── error.ts        # Error handling utilities
│   ├── file.ts         # File handling utilities
│   ├── formatting.ts   # Text and number formatting
│   ├── index.ts        # Library barrel exports
│   ├── logger.ts       # Logging utilities
│   ├── monitoring.ts   # Monitoring utilities
│   ├── navigation.ts   # Navigation utilities
│   ├── settings.ts     # Settings utilities
│   ├── storage.ts      # Storage utilities
│   ├── utils.ts        # General utilities
│   ├── validation.ts   # Validation utilities
│   └── version.ts      # Version utilities
├── pages/               # Page components (route handlers)
│   ├── __tests__/      # Page component tests
│   ├── GitlabProjects.tsx
│   ├── Index.tsx
│   ├── NotFound.tsx
│   └── Settings.tsx
├── services/            # API services and external integrations
│   ├── __tests__/      # Service tests
│   ├── auth/           # Authentication services
│   ├── monitoring/     # Monitoring-related services
│   ├── settings/       # Settings management services
│   ├── storage/        # Data storage and export services
│   └── index.ts        # Service barrel exports
├── test/                # Test utilities and mocks
│   ├── integration/    # Integration test utilities
│   ├── mocks/          # MSW handlers and test mocks
│   ├── setup.ts        # Test setup configuration
│   └── utils.tsx       # Test utilities and helpers
├── types/               # TypeScript type definitions
│   ├── __tests__/      # Type tests
│   └── index.ts        # All type exports organized by domain
├── index.css           # Global styles and Tailwind imports
├── main.tsx            # Application entry point
└── vite-env.d.ts       # Vite type definitions
```

## Architectural Principles

### 1. Feature-Based Organization
Components are organized by feature domain rather than technical type, making it easier to locate related functionality and maintain feature cohesion.

**Reasoning**: When working on GitLab monitoring features, all related components are in `src/components/features/gitlab/`, making development more efficient.

### 2. Separation of Concerns
Clear boundaries between different types of code:
- **Components**: UI and presentation logic only
- **Services**: Business logic and external API interactions
- **Hooks**: Reusable stateful logic
- **Lib**: Pure utility functions
- **Types**: Type definitions and interfaces

**Reasoning**: This separation makes code more testable, reusable, and easier to reason about.

### 3. Centralized Configuration
All configuration is centralized in the `src/config/` directory with proper validation and type safety.

**Reasoning**: Centralized configuration prevents scattered magic values and makes environment-specific changes easier to manage.

### 4. Type-First Development
TypeScript types are defined first and centralized, driving the implementation of components and services.

**Reasoning**: Type-first development catches errors early and provides better IDE support and documentation.

### 5. Progressive Enhancement
The application works without authentication and gracefully handles missing configurations or failed API calls.

**Reasoning**: Users can start using the application immediately without setup barriers, improving user experience.

## File Naming Conventions

### Components
- **Format**: PascalCase with `.tsx` extension
- **Examples**: `StatusCard.tsx`, `GitlabProjectList.tsx`, `UptimeMonitor.tsx`
- **Reasoning**: Follows React community standards and makes components easily identifiable

### Hooks
- **Format**: camelCase with `use` prefix and `.ts` extension
- **Examples**: `useSettings.ts`, `useGitlabProjects.ts`, `useMobile.tsx`
- **Reasoning**: Follows React hooks naming convention for immediate recognition

### Services
- **Format**: camelCase with descriptive suffix and `.ts` extension
- **Examples**: `settingsService.ts`, `gitlabApiService.ts`, `monitoringService.ts`
- **Reasoning**: Clear identification of service layer components

### Types and Interfaces
- **Format**: PascalCase for type names
- **Examples**: `GitlabProject`, `StatusType`, `MonitoringConfig`, `UserSettings`
- **Reasoning**: Follows TypeScript conventions and distinguishes types from values

### Constants
- **Format**: UPPER_SNAKE_CASE for exported constants
- **Examples**: `DEFAULT_SETTINGS`, `API_ENDPOINTS`, `STATUS_TYPES`, `ROUTES`
- **Reasoning**: Traditional constant naming that clearly identifies immutable values

### Utility Functions
- **Format**: camelCase for function names
- **Examples**: `formatDate`, `validateEmail`, `parseApiResponse`
- **Reasoning**: Standard JavaScript function naming

## Import Organization and Patterns

### Import Order
Standardized import order for consistency and readability:

1. **React and third-party libraries**
2. **Internal components** (common → ui → features → layout)
3. **Hooks and contexts**
4. **Services and utilities**
5. **Types and constants**
6. **Relative imports** (if any)

### Example Import Structure
```typescript
// 1. React and third-party libraries
import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';

// 2. Internal components (hierarchical order)
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LoadingSpinner, ErrorBoundary } from '@/components/common';
import { GitlabProjectCard } from '@/components/features/gitlab';
import { Navbar } from '@/components/layout';

// 3. Hooks and contexts
import { useSettings } from '@/contexts/SettingsContext';
import { useMobile } from '@/hooks/use-mobile';

// 4. Services and utilities
import { gitlabApiService } from '@/services';
import { formatDate, validateUrl } from '@/lib';

// 5. Types and constants
import type { GitlabProject, StatusType } from '@/types';
import { ROUTES, DEFAULT_SETTINGS } from '@/constants';

// 6. Relative imports (avoid when possible)
import './ComponentName.css';
```

### Path Aliases
The project uses TypeScript path aliases for clean imports:

```typescript
// tsconfig.json configuration
{
  "compilerOptions": {
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}
```

**Benefits**:
- Shorter import paths
- Easier refactoring
- Better IDE support
- Consistent import style

## Component Organization Strategy

### Common Components (`src/components/common/`)
**Purpose**: Reusable components used across multiple features
**Examples**: `ErrorBoundary`, `LoadingSpinner`, `PageLayout`, `AnimatedNumber`
**Guidelines**:
- Should have minimal dependencies
- Must be highly reusable
- Should not contain feature-specific logic
- Must include comprehensive prop documentation

```typescript
// Example: LoadingSpinner.tsx
interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  message?: string;
  className?: string;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'md',
  message,
  className
}) => {
  // Implementation
};
```

### UI Components (`src/components/ui/`)
**Purpose**: shadcn/ui components and base UI primitives
**Examples**: `button`, `card`, `dialog`, `input`, `select`
**Guidelines**:
- Maintained as provided by shadcn/ui
- Should not contain business logic
- Focus on styling and basic interaction
- Follow shadcn/ui patterns exactly

### Feature Components (`src/components/features/`)
**Purpose**: Components specific to particular features
**Organization**: By feature domain (dashboard, gitlab, uptime, dns, server)
**Guidelines**:
- Can import from common and ui components
- Should contain feature-specific logic
- Should be cohesive within their feature domain
- Can use feature-specific hooks and services

```typescript
// Example: src/components/features/gitlab/GitlabProjectCard.tsx
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LoadingSpinner } from '@/components/common';
import { gitlabApiService } from '@/services';
import type { GitlabProject } from '@/types';

interface GitlabProjectCardProps {
  project: GitlabProject;
  onUpdate?: (project: GitlabProject) => void;
}
```

### Layout Components (`src/components/layout/`)
**Purpose**: Components that define application layout
**Examples**: `Navbar`, `Sidebar`, `Footer`
**Guidelines**:
- Used across multiple pages
- Should handle navigation and global UI elements
- Can access global contexts (settings, auth)

## Service Organization Strategy

### Domain-Based Services (`src/services/`)
Services are organized by feature domain for better maintainability:

```
services/
├── auth/              # Authentication services
├── monitoring/        # Monitoring-related services
├── settings/          # Settings management services
├── storage/           # Data storage and export services
└── index.ts           # Service barrel exports
```

### Service Patterns
```typescript
// Example: gitlabApiService.ts
export class GitlabApiService {
  private baseUrl: string;
  private token: string;

  constructor(baseUrl: string, token: string) {
    this.baseUrl = baseUrl;
    this.token = token;
  }

  async getProjects(): Promise<GitlabProject[]> {
    // Implementation with proper error handling
  }

  async getProject(id: number): Promise<GitlabProject> {
    // Implementation
  }
}

// Export factory function for easy instantiation
export const createGitlabApiService = (config: GitlabConfig) => 
  new GitlabApiService(config.baseUrl, config.token);
```

## Type Organization Strategy

### Centralized Types (`src/types/index.ts`)
Types are organized by feature domain with clear grouping:

```typescript
// Core application types
export interface AppSettings {
  theme: 'light' | 'dark' | 'system';
  refreshInterval: number;
  notifications: boolean;
}

// Monitoring types
export interface MonitoringTarget {
  id: string;
  name: string;
  url: string;
  type: 'gitlab' | 'uptime' | 'dns' | 'server';
  status: StatusType;
  lastChecked: Date;
}

export type StatusType = 'healthy' | 'warning' | 'error' | 'inactive';

// GitLab specific types
export interface GitlabProject {
  id: number;
  name: string;
  path: string;
  webUrl: string;
  lastActivity: Date;
  issuesCount: number;
  mergeRequestsCount: number;
}

// Feature-specific configuration types
export interface GitlabConfig {
  baseUrl: string;
  token: string;
  projects: number[];
}
```

## Development Workflow and Guidelines

### 1. Type-First Development
- Define types before implementing features
- Use TypeScript strict mode for maximum safety
- Leverage type inference where appropriate

### 2. Component Development Process
1. **Define Props Interface**: Start with TypeScript interface
2. **Implement Component**: Focus on single responsibility
3. **Add Error Handling**: Include loading and error states
4. **Write Tests**: Cover happy path and edge cases
5. **Document Usage**: Add JSDoc comments for complex props

### 3. Service Development Process
1. **Define Service Interface**: Abstract the service contract
2. **Implement with Error Handling**: Proper error boundaries
3. **Add Logging**: Use centralized logging utilities
4. **Write Unit Tests**: Mock external dependencies
5. **Integration Testing**: Test with real API calls

### 4. Testing Strategy
- **Unit Tests**: Components, hooks, utilities
- **Integration Tests**: Feature workflows
- **E2E Tests**: Critical user paths
- **Test Co-location**: Tests next to source files

```
src/components/features/gitlab/
├── __tests__/
│   ├── GitlabProjectCard.test.tsx
│   └── GitlabProjectList.test.tsx
├── GitlabProjectCard.tsx
└── GitlabProjectList.tsx
```

## Configuration Management

### Environment Configuration (`src/config/`)
Centralized configuration with validation and type safety:

```typescript
// src/config/env.ts - Environment variable validation
export const env = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  VITE_APP_VERSION: process.env.VITE_APP_VERSION || '1.0.0',
  // Validate required environment variables
} as const;

// src/config/defaults.ts - Default configurations
export const DEFAULT_SETTINGS = {
  theme: 'system' as const,
  refreshInterval: 30000,
  notifications: true,
} as const;

// src/config/app.ts - Application configuration
export const appConfig = {
  name: 'GitLab DashWatch',
  version: env.VITE_APP_VERSION,
  defaultSettings: DEFAULT_SETTINGS,
} as const;
```

### Build Configuration Files

#### TypeScript Configuration
- **`tsconfig.json`**: Root TypeScript configuration with strict settings
- **`tsconfig.app.json`**: Application-specific settings with path aliases
- **`tsconfig.node.json`**: Node.js specific configuration for build tools

```json
// tsconfig.app.json - Key configurations
{
  "compilerOptions": {
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}
```

#### Build and Development Tools
- **`vite.config.ts`**: Vite configuration with path aliases and optimizations
- **`vitest.config.ts`**: Test configuration extending Vite config
- **`eslint.config.js`**: ESLint with TypeScript and React rules
- **`tailwind.config.ts`**: Tailwind CSS configuration with custom theme

#### Package Management
- **`package.json`**: Dependencies and scripts
- **`bun.lockb`**: Lock file for reproducible builds

## Migration and Refactoring Guidelines

### When Adding New Features
1. **Identify Feature Domain**: Determine if it's dashboard, gitlab, uptime, dns, or server related
2. **Create Feature Directory**: Add to `src/components/features/[domain]/`
3. **Define Types First**: Add types to `src/types/index.ts`
4. **Implement Services**: Add business logic to `src/services/[domain]/`
5. **Create Components**: Build UI components in feature directory
6. **Add Tests**: Include comprehensive test coverage
7. **Update Documentation**: Update this document if adding new patterns

### When Refactoring Existing Code
1. **Maintain Backward Compatibility**: Don't break existing imports
2. **Update All References**: Use IDE refactoring tools
3. **Run Full Test Suite**: Ensure no regressions
4. **Update Documentation**: Reflect changes in this document

### Code Quality Standards
- **TypeScript Strict Mode**: All code must pass strict type checking
- **ESLint Rules**: Follow configured linting rules
- **Test Coverage**: Maintain high test coverage for critical paths
- **Documentation**: Document complex logic and public APIs
- **Performance**: Consider bundle size and runtime performance

## Troubleshooting Common Issues

### Import Resolution Problems
- Verify `tsconfig.app.json` path aliases are correct
- Check `vite.config.ts` alias configuration matches TypeScript
- Ensure barrel exports (`index.ts`) are properly maintained

### Type Errors
- Check that types are properly exported from `src/types/index.ts`
- Verify component props match their TypeScript interfaces
- Ensure service methods return properly typed responses

### Build Issues
- Verify all imports use absolute paths with `@/` prefix
- Check that all dependencies are properly installed
- Ensure environment variables are available at build time

### Testing Problems
- Verify test files are in `__tests__` directories
- Check that MSW handlers are properly configured
- Ensure test utilities are imported from `src/test/`

This structure provides a solid foundation for scaling the GitLab DashWatch application while maintaining code quality, developer experience, and long-term maintainability.
