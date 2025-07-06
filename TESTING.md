# Testing Guide

This document outlines the testing approach and practices for the GitLab DashWatch project.

## Testing Framework

We use **Vitest** as our primary testing framework, along with:

- **@testing-library/react** - Component testing utilities
- **@testing-library/jest-dom** - Custom DOM matchers
- **@testing-library/user-event** - User interaction simulation
- **MSW (Mock Service Worker)** - API mocking
- **jsdom** - DOM environment for testing

## Test Structure

```
src/
├── test/
│   ├── setup.ts              # Test configuration
│   ├── utils.tsx              # Custom render function with providers
│   └── mocks/
│       ├── server.ts          # MSW server setup
│       └── handlers.ts        # API mock handlers
├── components/
│   └── __tests__/            # Component tests
├── services/
│   └── __tests__/            # Service/integration tests
└── config/
    └── __tests__/            # Configuration tests
```

## Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Run tests with UI
npm run test:ui

# Type checking and linting
npm run check
```

## Testing Patterns

### Component Testing

```typescript
import { describe, it, expect } from 'vitest';
import { render, screen } from '@/test/utils';
import { StatusCard } from '../StatusCard';

describe('StatusCard', () => {
  it('renders with basic props', () => {
    render(<StatusCard title="Test" status="healthy" />);
    expect(screen.getByText('Test')).toBeInTheDocument();
  });
});
```

### Service Testing

```typescript
import { describe, it, expect, vi } from 'vitest';
import { loadSettings } from '../settingsService';

// Mock external dependencies
vi.mock('@/lib/supabase', () => ({
  supabase: {
    // Mock implementation
  },
}));

describe('settingsService', () => {
  it('loads settings correctly', async () => {
    const settings = await loadSettings();
    expect(settings).toBeDefined();
  });
});
```

### User Interaction Testing

```typescript
import userEvent from '@testing-library/user-event';

it('handles user interactions', async () => {
  const user = userEvent.setup();
  const handleClick = vi.fn();
  
  render(<Button onClick={handleClick}>Click me</Button>);
  
  await user.click(screen.getByRole('button'));
  expect(handleClick).toHaveBeenCalledOnce();
});
```

## Mock Strategy

### API Mocking with MSW

We use MSW to mock external API calls:

```typescript
// src/test/mocks/handlers.ts
export const handlers = [
  http.get('*/api/v4/projects', () => {
    return HttpResponse.json([{ id: 1, name: 'Test Project' }]);
  }),
];
```

### Component Mocking

For complex components or external libraries:

```typescript
vi.mock('@/components/ComplexComponent', () => ({
  default: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="complex-component">{children}</div>
  ),
}));
```

## Coverage Requirements

- **Statements**: > 80%
- **Branches**: > 75%
- **Functions**: > 80%
- **Lines**: > 80%

### Coverage Configuration

Coverage is configured in `vitest.config.ts`:

```typescript
coverage: {
  provider: 'v8',
  reporter: ['text', 'json', 'html'],
  exclude: [
    'node_modules/',
    'src/test/',
    '**/*.d.ts',
    'dist/',
    'coverage/',
  ],
}
```

## CI/CD Integration

Tests run automatically on:
- All push events to `main` and `develop` branches
- All pull requests to `main`
- Multiple Node.js versions (18.x, 20.x)

The CI pipeline includes:
1. Type checking (`npm run type-check`)
2. Linting (`npm run lint`)
3. Unit tests (`npm test`)
4. Coverage reporting (`npm run test:coverage`)
5. Build verification (`npm run build`)

## Testing Best Practices

### 1. Test Structure
- Use descriptive test names
- Group related tests with `describe` blocks
- Follow the AAA pattern (Arrange, Act, Assert)

### 2. Isolation
- Mock external dependencies
- Clean up after each test
- Use `beforeEach` and `afterEach` hooks

### 3. Assertions
- Use semantic queries (`getByRole`, `getByLabelText`)
- Test user behavior, not implementation details
- Prefer user-centric assertions

### 4. Error Scenarios
- Test both success and failure paths
- Mock error conditions
- Verify error handling and user feedback

### 5. Async Testing
- Use `async/await` for async operations
- Wait for elements to appear with `waitFor`
- Test loading states and error boundaries

## Environment Variables

Test environment variables are configured in `vitest.config.ts`:

```typescript
env: {
  VITE_SUPABASE_URL: 'https://test.supabase.co',
  VITE_SUPABASE_ANON_KEY: 'test-anon-key',
}
```

## Debugging Tests

### VS Code Configuration
Add to `.vscode/launch.json`:

```json
{
  "type": "node",
  "request": "launch",
  "name": "Debug Tests",
  "program": "${workspaceFolder}/node_modules/vitest/vitest.mjs",
  "args": ["--inspect-brk", "--no-coverage"],
  "console": "integratedTerminal"
}
```

### Browser Testing
Use the Vitest UI for interactive debugging:

```bash
npm run test:ui
```

## Future Improvements

- [ ] Add E2E tests with Playwright
- [ ] Implement visual regression testing
- [ ] Add performance testing benchmarks
- [ ] Enhance API integration testing
- [ ] Add accessibility testing with jest-axe