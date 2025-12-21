# Profile MFE

The Profile Microfrontend provides user profile management functionality within the Payments System MFE platform.

## Overview

The Profile MFE allows authenticated users to:

- View and edit their profile information (phone, address, bio, avatar)
- Manage user preferences (theme, language, currency, timezone, notifications)
- View account information (read-only)

## Features

### Profile Management

- **Contact Information**: Phone number, address, bio
- **Avatar Upload**: Image upload with preview and validation
- **Form Validation**: Client-side validation with Zod schemas
- **Real-time Updates**: Immediate feedback on successful updates

### User Preferences

- **Theme Selection**: Light, dark, or system theme
- **Localization**: Language, currency, and timezone settings
- **Notifications**: Email, push, and SMS notification preferences

### Account Information

- **Read-only Display**: User ID, email, role, account creation/update dates
- **Email Verification Status**: Visual indicators for verification state

## Architecture

### Component Structure

```
ProfilePage (main entry point)
├── ProfileForm (profile editing)
│   ├── AvatarUpload (image upload component)
│   └── Form validation with React Hook Form + Zod
├── PreferencesForm (preferences editing)
└── AccountInfo (read-only account details)
```

### API Integration

- **Backend Service**: Profile Service (port 3004)
- **API Gateway**: Routes through API Gateway (port 3000)
- **Endpoints**:
  - `GET /api/profile` - Fetch user profile
  - `PUT /api/profile` - Update profile information
  - `GET /api/profile/preferences` - Fetch user preferences
  - `PUT /api/profile/preferences` - Update user preferences

### State Management

- **TanStack Query**: Data fetching and caching
- **Zustand Store**: Authentication state (via shared-auth-store)
- **React Hook Form**: Form state management
- **Local State**: Tab navigation and UI state

## Development

### Prerequisites

- Node.js 24.11.x LTS
- pnpm 9.x
- Running infrastructure (PostgreSQL, RabbitMQ, Redis)

### Running the MFE

```bash
# Start Profile MFE in development mode
pnpm dev:profile-mfe

# Start all MFEs together
pnpm dev:mf

# Start with HTTPS (production-like)
pnpm dev:mf:https
```

### Building

```bash
# Build Profile MFE
pnpm build:profile-mfe

# Build all MFEs
pnpm build:remotes
```

### Testing

```bash
# Run unit tests
pnpm test:profile-mfe

# Run E2E tests
pnpm e2e

# Run with coverage
pnpm test:profile-mfe --coverage
```

## Module Federation

### Exposed Modules

```javascript
// rspack.config.js
exposes: {
  './ProfilePage': './src/components/ProfilePage.tsx'
}
```

### Shared Dependencies

- `react`, `react-dom`
- `@tanstack/react-query`
- `zustand`
- `shared-auth-store`
- `shared-design-system`
- `shared-api-client`

### Consumption

```javascript
// In shell app
const ProfilePage = React.lazy(() => import('profileMfe/ProfilePage'));
```

## Error Handling

### Client-side Validation

- **Zod Schemas**: Runtime validation for all form inputs
- **React Hook Form**: Integrated validation with user-friendly error messages
- **Field-level Validation**: Real-time feedback on individual fields

### API Error Handling

- **Network Errors**: Graceful degradation with retry mechanisms
- **Authentication Errors**: Automatic redirect to login
- **Validation Errors**: Server-side validation with detailed error messages
- **Toast Notifications**: User-friendly error and success feedback

### Error Boundaries

- **Sentry Integration**: Error tracking and reporting
- **Graceful Degradation**: Fallback UI when components fail
- **User Feedback**: Clear error messages and recovery instructions

## Testing Strategy

### Unit Tests

- **Component Tests**: React Testing Library for UI components
- **Hook Tests**: TanStack Query hooks and custom hooks
- **API Tests**: Mocked API client functions
- **Utility Tests**: Validation schemas and helper functions

### Integration Tests

- **Full-stack Tests**: Playwright tests for complete user journeys
- **API Integration**: Backend service integration testing
- **Form Submission**: End-to-end form workflows

### E2E Tests

- **User Journeys**: Complete profile management workflows
- **Cross-browser**: Chrome, Firefox, Safari compatibility
- **Mobile Testing**: Responsive design verification

## Accessibility

### WCAG 2.1 AA Compliance

- **Keyboard Navigation**: Full keyboard support for all interactions
- **Screen Reader**: Proper ARIA labels and semantic HTML
- **Focus Management**: Logical tab order and focus indicators
- **Color Contrast**: Sufficient contrast ratios for readability

### Features

- **ARIA Labels**: Comprehensive labeling for screen readers
- **Semantic HTML**: Proper heading hierarchy and landmarks
- **Error Announcements**: Screen reader announcements for validation errors
- **Focus Trapping**: Proper focus management in modals

## Performance

### Bundle Optimization

- **Code Splitting**: Lazy loading of components
- **Tree Shaking**: Removal of unused code
- **Compression**: Gzipped bundles for production

### Runtime Performance

- **Query Caching**: 5-minute stale time for profile data
- **Optimistic Updates**: Immediate UI feedback for mutations
- **Debounced Inputs**: Efficient form input handling

### Metrics

- **Bundle Size**: ~1MB for ProfilePage chunk
- **Load Time**: < 2 seconds for initial page load
- **Time to Interactive**: < 3 seconds for full functionality

## Security

### Authentication & Authorization

- **JWT Tokens**: Secure token-based authentication
- **Route Protection**: Authentication required for all profile routes
- **Role-based Access**: Different permissions for vendors vs customers

### Data Validation

- **Client-side**: Zod schemas for input validation
- **Server-side**: Backend validation with detailed error responses
- **Sanitization**: Input sanitization to prevent XSS attacks

## Dependencies

### Runtime Dependencies

- `react`: ^18.3.1
- `react-dom`: ^18.3.1
- `@tanstack/react-query`: ^5.0.0
- `zustand`: ^4.5.0
- `react-hook-form`: ^7.52.0
- `zod`: ^3.25.76

### Shared Dependencies

- `shared-auth-store`: Authentication state management
- `shared-design-system`: UI components and styling
- `shared-api-client`: HTTP client with error handling
- `@mfe-poc/shared-observability`: Error tracking and monitoring

## Configuration

### Environment Variables

```bash
NX_API_BASE_URL=http://localhost:3000/api  # API Gateway URL
NX_WS_URL=ws://localhost:3000/ws           # WebSocket URL
NX_HTTPS_MODE=true                         # HTTPS mode flag
```

### Build Configuration

- **Rspack**: Module Federation bundler
- **TypeScript**: Strict type checking enabled
- **Tailwind CSS v4**: Utility-first styling
- **Jest + Vitest**: Testing frameworks

## Troubleshooting

### Common Issues

**Profile data not loading**

- Check API Gateway is running on port 3000
- Verify authentication token is valid
- Check Profile Service logs for database connection

**Form submission failing**

- Verify backend validation rules match frontend schemas
- Check network connectivity to API Gateway
- Review browser console for validation errors

**Module Federation issues**

- Ensure all shared dependencies have matching versions
- Check remoteEntry.js is accessible
- Verify Module Federation configuration in shell app

### Debug Commands

```bash
# Check Profile MFE build
pnpm build:profile-mfe

# Check Profile Service health
curl http://localhost:3004/health

# Check API Gateway proxy
curl http://localhost:3000/api/profile

# View Profile MFE logs
pnpm dev:profile-mfe
```

## Contributing

### Code Style

- **TypeScript**: Strict mode enabled, no `any` types
- **ESLint**: Follows project linting rules
- **Prettier**: Consistent code formatting
- **JSDoc**: Comprehensive documentation for all exports

### Testing Requirements

- **Unit Tests**: > 70% coverage for new code
- **Integration Tests**: All new features tested end-to-end
- **Accessibility**: WCAG 2.1 AA compliance verified

### Commit Guidelines

- **Conventional Commits**: Use semantic commit messages
- **Atomic Commits**: One feature/bug fix per commit
- **Descriptive Messages**: Clear explanation of changes

## Related Documentation

- [Profile MFE Implementation Plan](../docs/POC-3-Implementation/PROFILE-MFE-IMPLEMENTATION-PLAN.md)
- [Profile MFE Task List](../docs/POC-3-Implementation/PROFILE-MFE-TASK-LIST.md)
- [API Gateway Documentation](../docs/POC-3-Implementation/SWAGGER_API_DOCUMENTATION.md)
- [Module Federation Guide](../docs/POC-3-Implementation/MODULE_FEDERATION_GUIDE.md)
