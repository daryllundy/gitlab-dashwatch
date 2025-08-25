# Integration Tests

This directory contains integration tests for the GitLab DashWatch application.

## Overview

Integration tests verify that different parts of the application work together correctly. These tests focus on testing the interaction between components, services, and contexts rather than individual unit functionality.

## Test Structure

Integration tests should:
- Test real interactions between multiple components
- Use minimal mocking to verify actual integration
- Focus on user workflows and data flow
- Validate that the application works as expected from a user perspective

## Running Integration Tests

```bash
# Run all integration tests
npm test -- src/test/integration/

# Run with coverage
npm test -- src/test/integration/ --coverage
```

## Adding New Integration Tests

When adding new integration tests:
1. Create test files with descriptive names ending in `.integration.test.tsx`
2. Focus on testing complete user workflows
3. Use the test utilities from `@/test/utils` for consistent setup
4. Mock external services but keep internal integrations real
5. Document the test scenarios and requirements being validated
