# Integration Tests

This directory contains integration tests for the GitLab DashWatch application.

## Environment Authentication Integration Tests

### File: `envAuth.focused.test.tsx`

This file contains comprehensive end-to-end integration tests for the environment authentication feature, covering all the requirements specified in task 11:

#### Test Coverage

**Complete Environment Authentication Flow**
- ✅ Successfully initialize environment authentication system
- ✅ Handle environment authentication service errors gracefully  
- ✅ Complete auto sign-in flow when enabled
- ✅ Handle auto sign-in failure and continue with manual auth

**Multiple Account Scenarios and Account Switching**
- ✅ Handle multiple environment accounts configuration
- ✅ Handle account switching scenarios

**Session Management with Environment-based Authentication**
- ✅ Handle existing session restoration
- ✅ Handle session expiration

**Mixed Authentication Scenarios (Environment + Manual)**
- ✅ Support environment auth with manual fallback
- ✅ Handle strict mode preventing manual fallback

**AuthDialog Integration**
- ✅ Integrate environment authentication with AuthDialog
- ✅ Handle environment authentication disabled in dialog
- ✅ Show configuration issues warning in dialog

**Error Handling and Edge Cases**
- ✅ Handle network errors during authentication
- ✅ Handle service validation errors
- ✅ Handle concurrent authentication attempts
- ✅ Handle environment service initialization errors

**Logging and Audit Trail**
- ✅ Log authentication events properly
- ✅ Maintain audit trail for authentication events

#### Requirements Coverage

The tests validate all requirements specified in the task:

- **Requirements 2.4**: Session management with environment-based authentication
- **Requirements 3.2**: Multiple account scenarios and role-based access
- **Requirements 5.1**: Environment account selection and UI integration
- **Requirements 5.2**: Authentication source indicators and user feedback

#### Test Structure

The tests use a focused approach with minimal mocking to test real integration between:
- AuthProvider context
- AuthDialog component  
- Environment credentials service
- Authentication logging
- Session management
- Error handling

#### Running the Tests

```bash
# Run all integration tests
npm test -- src/test/integration/

# Run only environment auth integration tests
npm test -- src/test/integration/envAuth.focused.test.tsx

# Run with coverage
npm test -- src/test/integration/envAuth.focused.test.tsx --coverage
```

#### Test Results

All 19 integration tests pass successfully, providing comprehensive coverage of the environment authentication feature's end-to-end functionality.
