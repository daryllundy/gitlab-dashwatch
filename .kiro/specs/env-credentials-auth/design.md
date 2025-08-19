# Design Document

## Overview

This design implements environment-based credential authentication for GitLab DashWatch, allowing administrators to configure predefined user accounts via environment variables. The solution extends the existing Supabase authentication system while maintaining backward compatibility and security best practices.

The feature supports multiple use cases: automated testing, administrative access, service accounts, and development environment setup. It integrates seamlessly with the current React-based authentication flow and provides clear UI indicators for environment-based authentication options.

## Architecture

### Environment Configuration Layer

The system extends the existing `src/config/env.ts` module to support credential-related environment variables:

```typescript
// New environment variables structure
VITE_AUTH_ENV_ENABLED=true|false
VITE_AUTH_ENV_AUTO_SIGNIN=true|false
VITE_AUTH_ENV_ACCOUNTS=account1,account2,admin
VITE_AUTH_ENV_ACCOUNT_<NAME>_EMAIL=email@example.com
VITE_AUTH_ENV_ACCOUNT_<NAME>_PASSWORD=password
VITE_AUTH_ENV_ACCOUNT_<NAME>_ROLE=admin|user
```

### Authentication Service Layer

A new `EnvCredentialsService` handles environment credential management:
- Parses and validates environment variables at startup
- Provides secure credential storage and retrieval
- Manages multiple account configurations
- Handles automatic sign-in logic

### UI Integration Layer

The existing `AuthDialog` component is enhanced to:
- Display environment account options when available
- Provide account selection interface
- Show authentication source indicators
- Maintain existing manual authentication flow

## Components and Interfaces

### EnvCredentialsService

```typescript
interface EnvAccount {
  name: string;
  email: string;
  password: string;
  role?: string;
}

interface EnvCredentialsConfig {
  enabled: boolean;
  autoSignIn: boolean;
  accounts: EnvAccount[];
}

class EnvCredentialsService {
  private config: EnvCredentialsConfig;
  
  loadConfiguration(): EnvCredentialsConfig
  getAvailableAccounts(): EnvAccount[]
  getAccountByName(name: string): EnvAccount | null
  isAutoSignInEnabled(): boolean
  validateCredentials(): boolean
}
```

### Enhanced AuthContext

The existing `AuthContext` is extended with new methods:

```typescript
interface AuthContextType {
  // Existing methods...
  
  // New environment credential methods
  envAccounts: EnvAccount[];
  signInWithEnvAccount: (accountName: string) => Promise<boolean>;
  isEnvAuthEnabled: boolean;
  isEnvAutoSignInEnabled: boolean;
}
```

### Enhanced AuthDialog Component

The `AuthDialog` component receives new props and state:

```typescript
interface AuthDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  showEnvAccounts?: boolean; // New prop
}

// New state for environment accounts
const [selectedEnvAccount, setSelectedEnvAccount] = useState<string>('');
const [showEnvOptions, setShowEnvOptions] = useState(false);
```

## Data Models

### Environment Account Model

```typescript
interface EnvAccount {
  name: string;           // Account identifier (e.g., "admin", "test-user")
  email: string;          // Email for Supabase authentication
  password: string;       // Password for Supabase authentication
  role?: string;          // Optional role identifier
  displayName?: string;   // Optional display name for UI
}
```

### Environment Configuration Model

```typescript
interface EnvCredentialsConfig {
  enabled: boolean;           // Master enable/disable flag
  autoSignIn: boolean;        // Auto sign-in on app start
  accounts: EnvAccount[];     // Array of configured accounts
  defaultAccount?: string;    // Default account for auto sign-in
}
```

## Error Handling

### Environment Variable Validation

- **Missing Variables**: Log warnings, continue with manual auth
- **Malformed Variables**: Log errors with sanitized messages
- **Invalid Credentials**: Attempt authentication, fall back on failure
- **Configuration Conflicts**: Use safe defaults, log warnings

### Authentication Failures

- **Environment Sign-in Failure**: Fall back to manual authentication
- **Network Issues**: Retry with exponential backoff
- **Invalid Credentials**: Clear invalid accounts from memory
- **Service Unavailable**: Graceful degradation to guest mode

### Security Considerations

- **Credential Logging**: Never log actual passwords or sensitive data
- **Error Messages**: Sanitize error messages to prevent information disclosure
- **Memory Management**: Clear credentials from memory after use
- **Environment Exposure**: Validate environment variable access patterns

## Testing Strategy

### Unit Tests

1. **EnvCredentialsService Tests**
   - Environment variable parsing
   - Configuration validation
   - Account retrieval methods
   - Error handling scenarios

2. **AuthContext Integration Tests**
   - Environment account sign-in flow
   - Fallback to manual authentication
   - State management with environment accounts
   - Auto sign-in functionality

3. **Component Tests**
   - AuthDialog with environment accounts
   - Account selection UI behavior
   - Authentication source indicators
   - Error state handling

### Integration Tests

1. **End-to-End Authentication Flow**
   - Environment account sign-in
   - Manual authentication fallback
   - Session management
   - Settings persistence

2. **Configuration Scenarios**
   - Multiple environment accounts
   - Auto sign-in enabled/disabled
   - Environment auth disabled
   - Mixed authentication methods

### Security Tests

1. **Credential Handling**
   - No credential exposure in logs
   - Secure memory management
   - Environment variable validation
   - Error message sanitization

2. **Authentication Security**
   - Invalid credential handling
   - Session security with env accounts
   - Role-based access control
   - Fallback security measures

## Implementation Phases

### Phase 1: Core Infrastructure
- Extend environment configuration system
- Implement EnvCredentialsService
- Add environment variable validation
- Create basic unit tests

### Phase 2: Authentication Integration
- Extend AuthContext with environment methods
- Implement environment account sign-in
- Add auto sign-in functionality
- Create integration tests

### Phase 3: UI Enhancement
- Enhance AuthDialog with environment options
- Add account selection interface
- Implement authentication source indicators
- Add user feedback and error handling

### Phase 4: Security and Polish
- Implement comprehensive error handling
- Add security validations
- Create end-to-end tests
- Add documentation and examples

## Security Considerations

### Environment Variable Security
- Credentials stored in environment variables are visible to the application process
- Production deployments should use secure environment variable management
- Development environments should use `.env` files with appropriate `.gitignore` rules
- Container deployments should use secrets management systems

### Authentication Flow Security
- Environment credentials use the same Supabase authentication as manual sign-in
- No bypass of Supabase security mechanisms
- Session management remains unchanged
- Role-based access control preserved

### Error Handling Security
- No credential values in error messages or logs
- Sanitized error responses to prevent information disclosure
- Secure fallback to manual authentication
- Proper cleanup of sensitive data from memory
