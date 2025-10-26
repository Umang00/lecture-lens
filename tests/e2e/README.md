# End-to-End Tests

This directory contains Playwright E2E tests for the Lecture Lens application.

## Test Structure

### Test Files
- `user-roles.test.ts` - Comprehensive tests for different user roles (student, instructor, admin)
- `chat-interface.test.ts` - Focused tests for the chat interface functionality
- `setup.ts` - Test setup and authentication
- `utils.ts` - Common test utilities and helpers

### Test Categories

#### 1. Student User Tests
- Login and authentication
- Chat interface access
- Question asking and response handling
- Conversation history management
- Mobile responsiveness
- Error handling

#### 2. Admin User Tests
- Upload interface access
- VTT file upload
- Resource management
- Multi-cohort access
- Processing status monitoring

#### 3. Instructor User Tests
- Chat interface access
- Resource addition
- Student query monitoring
- Role-based permissions

#### 4. Cross-Role Tests
- Role-based access control
- Session management
- Logout functionality
- Security boundaries

#### 5. Error Handling Tests
- Invalid credentials
- Network errors
- API timeouts
- Graceful degradation

## Running Tests

### Prerequisites
1. Install Playwright browsers:
   ```bash
   npx playwright install
   ```

2. Set up environment variables:
   ```bash
   # Create .env.local with your Supabase credentials
   NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   SUPABASE_SERVICE_ROLE_KEY=your-service-key
   OPENROUTER_API_KEY=your-openrouter-key
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

### Test Commands

```bash
# Run all E2E tests
npm run test:e2e

# Run tests with UI
npm run test:e2e:ui

# Run tests in headed mode (see browser)
npm run test:e2e:headed

# Debug tests
npm run test:e2e:debug

# Run specific test file
npx playwright test tests/e2e/chat-interface.test.ts

# Run tests for specific browser
npx playwright test --project=chromium
```

## Test Data

The tests use the following test users:

### Student User
- Email: `student@cohort5.com`
- Password: `demo123`
- Role: Student
- Cohort: Cohort 5

### Instructor User
- Email: `instructor@cohort5.com`
- Password: `demo123`
- Role: Instructor
- Cohort: Cohort 5

### Admin User
- Email: `admin@100x.com`
- Password: `demo123`
- Role: Admin
- Access: All Cohorts

## Test Scenarios

### Chat Interface Tests
1. **Authentication Flow**
   - Login with valid credentials
   - Access control for different roles
   - Session persistence
   - Logout functionality

2. **Chat Functionality**
   - Question asking and response handling
   - Conversation history
   - Context management
   - Error handling

3. **UI/UX Tests**
   - Responsive design
   - Input validation
   - Loading states
   - Error messages

4. **Mobile Testing**
   - Mobile viewport testing
   - Touch interactions
   - Responsive layout

### Admin Interface Tests
1. **Upload Functionality**
   - VTT file upload
   - Form validation
   - Processing status
   - Error handling

2. **Resource Management**
   - Adding resources
   - Resource validation
   - Processing status

3. **Multi-Cohort Access**
   - Cohort switching
   - Data isolation
   - Permission checks

## Test Utilities

### Common Functions
- `loginAs(page, user)` - Login as specific user
- `logout(page)` - Logout current user
- `askQuestion(page, question)` - Ask question in chat
- `clearChatHistory(page)` - Clear chat history
- `verifyChatInterface(page)` - Verify chat components

### Helper Functions
- `checkAdminAccess(page, shouldHaveAccess)` - Check admin permissions
- `checkInstructorAccess(page, shouldHaveAccess)` - Check instructor permissions
- `simulateNetworkError(page, urlPattern)` - Simulate network failures
- `waitForProcessing(page, timeout)` - Wait for processing completion

## Debugging Tests

### View Test Results
```bash
# Open test results in browser
npx playwright show-report
```

### Debug Specific Test
```bash
# Debug a specific test
npx playwright test tests/e2e/chat-interface.test.ts --debug
```

### Screenshots and Videos
- Screenshots are taken on test failures
- Videos are recorded for failed tests
- Traces are collected for debugging

## Continuous Integration

The tests are designed to run in CI environments:
- Headless mode by default
- Retry failed tests
- Parallel execution
- Timeout handling

## Best Practices

1. **Test Isolation**: Each test is independent
2. **Data Cleanup**: Tests clean up after themselves
3. **Realistic Scenarios**: Tests mirror real user behavior
4. **Error Handling**: Tests verify error scenarios
5. **Performance**: Tests include timeout handling

## Troubleshooting

### Common Issues

1. **Authentication Failures**
   - Check environment variables
   - Verify Supabase connection
   - Ensure test users exist

2. **Test Timeouts**
   - Increase timeout values
   - Check network connectivity
   - Verify API responses

3. **Element Not Found**
   - Check data-testid attributes
   - Verify component rendering
   - Check for loading states

### Debug Tips

1. Use `--headed` mode to see browser
2. Use `--debug` to step through tests
3. Check browser console for errors
4. Verify network requests in DevTools
5. Use `page.pause()` to inspect state
