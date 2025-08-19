# Design Document

## Overview

This design outlines the complete removal of authentication functionality from GitLab DashWatch, transforming it from a multi-user authenticated application to a single-user, unauthenticated monitoring dashboard. The removal will eliminate all Supabase authentication, OAuth integration, user management, and role-based access control while preserving all core monitoring capabilities.

## Architecture

### Current Authentication Architecture
The current system includes:
- **AuthContext**: Manages user state, authentication methods, and role-based permissions
- **Supabase Integration**: Handles user authentication, session management, and data persistence
- **Environment Credentials**: Alternative authentication using environment variables
- **Role-Based Access Control**: Manages user permissions and feature access
- **OAuth Integration**: GitHub OAuth for user sign-in

### Target Architecture
The new system will:
- **Remove all authentication layers**: No user management or session handling
- **Local Storage Only**: All settings stored in browser localStorage
- **Direct Feature Access**: No permission checks or role-based restrictions
- **Simplified Navigation**: Clean UI without authentication elements
- **Reduced Dependencies**: Remove Supabase and authentication-related packages

## Components and Interfaces

### Components to Remove
1. **Authentication Components**
   - `src/components/auth/AuthDialog.tsx`
   - `src/components/auth/UserMenu.tsx`
   - `src/components/auth/index.ts`
   - `src/contexts/AuthContext.tsx`

2. **Authentication Services**
   - `src/services/authLogger.ts`
   - `src/services/envCredentialsService.ts`
   - `src/services/roleService.ts`
   - Authentication-related exports from `src/services/index.ts`

3. **Authentication Configuration**
   - Supabase configuration in `src/lib/supabase.ts`
   - Authentication environment variables in `src/config/env.ts`
   - Authentication types in `src/types/index.ts`

### Components to Modify
1. **Navigation Component** (`src/components/Navbar.tsx`)
   - Remove user menu and sign-in button
   - Remove authentication state checks
   - Simplify navigation logic
   - Remove role-based navigation restrictions

2. **Application Root** (`src/App.tsx`)
   - Remove AuthProvider wrapper
   - Remove authentication environment validation
   - Simplify provider hierarchy

3. **Settings Page** (`src/pages/Settings.tsx`)
   - Remove authentication-based access controls
   - Remove user-specific settings logic
   - Implement localStorage-based settings persistence

4. **Settings Context** (`src/contexts/SettingsContext.tsx`)
   - Replace Supabase persistence with localStorage
   - Remove user-based settings differentiation
   - Implement fallback to default settings

### New Components and Interfaces
1. **Local Settings Service**
   - Handle localStorage operations
   - Provide settings validation and migration
   - Implement default settings fallback

2. **Simplified Settings Interface**
   - Remove user-specific settings
   - Focus on monitoring configuration
   - Provide clear default values

## Data Models

### Current Data Models to Remove
- `User` (from Supabase)
- `Session` (from Supabase)
- `EnvAccount`
- `AuthenticationSource`
- `UserRoleInfo`
- All role-based permission types

### Settings Data Model
```typescript
interface AppSettings {
  theme: 'light' | 'dark' | 'system';
  monitoring: {
    refreshInterval: number;
    enableNotifications: boolean;
  };
  gitlab: {
    instances: GitlabInstance[];
  };
  uptime: {
    websites: Website[];
  };
  dns: {
    domains: Domain[];
  };
  server: {
    netdataInstances: NetdataInstance[];
  };
}
```

### Local Storage Structure
```typescript
interface LocalStorageData {
  settings: AppSettings;
  version: string;
  lastUpdated: string;
}
```

## Error Handling

### Authentication Error Removal
- Remove all authentication-related error handling
- Remove authentication failure recovery mechanisms
- Remove environment credentials validation errors

### New Error Handling
1. **Settings Persistence Errors**
   - Handle localStorage quota exceeded
   - Handle localStorage access denied
   - Graceful fallback to default settings

2. **Settings Validation Errors**
   - Validate settings structure on load
   - Handle corrupted settings data
   - Provide settings reset functionality

3. **Migration Errors**
   - Handle settings format changes
   - Provide backward compatibility
   - Clear invalid settings gracefully

## Testing Strategy

### Tests to Remove
- All authentication-related unit tests
- Role-based access control tests
- Environment credentials tests
- OAuth integration tests
- Supabase integration tests

### Tests to Modify
1. **Component Tests**
   - Update Navbar tests to remove authentication scenarios
   - Update Settings page tests to use localStorage
   - Remove authentication mocking from test utilities

2. **Integration Tests**
   - Remove authentication flow tests
   - Update settings persistence tests
   - Test localStorage fallback scenarios

### New Tests to Add
1. **Local Storage Tests**
   - Test settings persistence and retrieval
   - Test localStorage error handling
   - Test settings migration scenarios

2. **Settings Service Tests**
   - Test default settings application
   - Test settings validation
   - Test settings reset functionality

3. **UI Tests**
   - Test simplified navigation
   - Test immediate dashboard access
   - Test settings page accessibility

## Migration Strategy

### Phase 1: Remove Authentication Dependencies
1. Remove Supabase client and related imports
2. Remove authentication environment variables
3. Remove authentication-related npm packages
4. Update build configuration

### Phase 2: Remove Authentication Components
1. Delete authentication components and services
2. Remove authentication context provider
3. Update component imports and references
4. Remove authentication-related types

### Phase 3: Implement Local Storage
1. Create local settings service
2. Implement localStorage persistence
3. Add settings validation and migration
4. Update settings context to use localStorage

### Phase 4: Update UI Components
1. Simplify navigation component
2. Remove authentication UI elements
3. Update settings page for local storage
4. Remove role-based access controls

### Phase 5: Update Tests and Documentation
1. Remove authentication tests
2. Add localStorage tests
3. Update component tests
4. Update documentation and README

## Security Considerations

### Removed Security Features
- User authentication and authorization
- Role-based access control
- Session management
- OAuth security flows

### Remaining Security Considerations
1. **Local Data Security**
   - Settings stored in browser localStorage (not encrypted)
   - No sensitive data should be stored in settings
   - Clear settings on browser data clear

2. **API Security**
   - Monitoring API calls remain unchanged
   - No authentication tokens to manage
   - Direct API access from browser

3. **Deployment Security**
   - No authentication secrets to manage
   - Simplified environment configuration
   - No user data to protect

## Performance Implications

### Performance Improvements
- Faster application startup (no authentication checks)
- Reduced bundle size (removed authentication dependencies)
- Simplified state management
- No network calls for authentication

### Considerations
- localStorage operations are synchronous
- Settings validation on every app start
- No server-side settings backup

## Deployment Changes

### Environment Variables to Remove
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- All `VITE_AUTH_ENV_*` variables

### Build Process Changes
- Remove Supabase dependency from build
- Simplify environment validation
- Reduce production bundle size

### Docker Configuration Updates
- Remove authentication environment variables from Docker files
- Simplify container configuration
- Update documentation for deployment
