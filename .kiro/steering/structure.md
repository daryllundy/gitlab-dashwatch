# Project Structure & Conventions

## Directory Organization

```
src/
├── components/           # React components
│   ├── auth/            # Authentication components
│   ├── common/          # Reusable components (ErrorBoundary, LoadingSpinner, PageLayout)
│   ├── ui/              # shadcn/ui components (button, card, dialog, etc.)
│   └── [feature]/       # Feature-specific components (StatusCard, Navbar, etc.)
├── config/              # Configuration and environment handling
├── constants/           # Application constants and defaults
├── contexts/            # React contexts (AuthContext, SettingsContext)
├── hooks/               # Custom React hooks
├── lib/                 # Utility libraries (supabase, utils)
├── pages/               # Page components (Index, Settings, NotFound)
├── services/            # API services and external integrations
├── test/                # Test utilities and mocks
├── types/               # TypeScript type definitions
└── main.tsx             # Application entry point
```

## File Naming Conventions

- **Components**: PascalCase (`StatusCard.tsx`, `UserMenu.tsx`)
- **Hooks**: camelCase with `use` prefix (`useSettings.ts`, `useMobile.tsx`)
- **Services**: camelCase (`settingsService.ts`)
- **Types**: PascalCase (`GitlabProject`, `StatusType`)
- **Constants**: UPPER_SNAKE_CASE (`DEFAULT_SETTINGS`, `ROUTES`)
- **Pages**: PascalCase (`Index.tsx`, `Settings.tsx`)

## Code Organization Patterns

### Import Order
1. React and third-party libraries
2. Internal components (common first, then specific)
3. Hooks and contexts
4. Types and constants
5. Relative imports

### Component Structure
- Use functional components with TypeScript
- Props interfaces defined inline or exported from types
- Error boundaries wrap major features
- Loading states for all async operations

### State Management
- **Global State**: React Context (AuthContext, SettingsContext)
- **Server State**: TanStack Query for API calls
- **Local State**: useState for component-specific data

### Type Safety
- Strict TypeScript configuration
- All components have proper prop typing
- Centralized type definitions in `src/types/index.ts`
- Environment variables validated at startup

## Architecture Patterns

### Error Handling
- Global ErrorBoundary component wraps the entire app
- Component-level error states for graceful degradation
- Proper error logging and user feedback

### Configuration Management
- Environment variables validated in `src/config/env.ts`
- Constants centralized in `src/constants/index.ts`
- Default configurations for easy setup

### Testing Structure
- Tests co-located with components in `__tests__` folders
- Test utilities in `src/test/`
- MSW for API mocking
- Comprehensive coverage for critical paths

## Key Conventions

- Use absolute imports with `@/` alias for src directory
- All async operations include loading and error states
- Components export default, utilities export named
- Consistent status types: `healthy | warning | error | inactive`
- Settings stored per user with Supabase, fallback to localStorage
