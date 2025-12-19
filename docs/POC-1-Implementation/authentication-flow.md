# Authentication Flow Documentation

**POC-1 Implementation**  
**Status:** ✅ Complete

---

## Overview

POC-1 implements a **mock authentication system** with sign-in and sign-up flows. Authentication is handled entirely on the client side using Zustand for state management and localStorage for persistence. No real backend is involved in POC-1.

---

## Architecture

### Components

```
┌─────────────────────────────────────────────────────────┐
│                    Shell App (Host)                       │
│                                                           │
│  ┌─────────────────────────────────────────────────┐    │
│  │         SignInPage / SignUpPage                 │    │
│  │  (Wrapper components in shell)                  │    │
│  └──────────────┬──────────────────────────────────┘    │
│                 │                                        │
│                 │ Module Federation                      │
│                 │                                        │
│                 ▼                                        │
│  ┌─────────────────────────────────────────────────┐    │
│  │         Auth MFE (Remote)                        │    │
│  │                                                   │    │
│  │  ┌──────────────┐    ┌──────────────┐          │    │
│  │  │   SignIn     │    │   SignUp     │          │    │
│  │  │  Component   │    │  Component   │          │    │
│  │  └──────┬───────┘    └──────┬───────┘          │    │
│  │         │                    │                   │    │
│  │         └──────────┬─────────┘                   │    │
│  │                    │                              │    │
│  │                    ▼                              │    │
│  │         ┌──────────────────┐                     │    │
│  │         │  useAuthStore    │                     │    │
│  │         │  (Zustand)       │                     │    │
│  │         └──────────────────┘                     │    │
│  └───────────────────────────────────────────────────┘    │
│                                                           │
│                    Shared Store                            │
│                    (Singleton)                             │
└───────────────────────────────────────────────────────────┘
```

### Key Files

- **Auth MFE:**
  - `apps/auth-mfe/src/components/SignIn.tsx` - Sign-in form component
  - `apps/auth-mfe/src/components/SignUp.tsx` - Sign-up form component

- **Shell App:**
  - `apps/shell/src/pages/SignInPage.tsx` - Sign-in page wrapper
  - `apps/shell/src/pages/SignUpPage.tsx` - Sign-up page wrapper
  - `apps/shell/src/routes/AppRoutes.tsx` - Route definitions

- **Shared Store:**
  - `libs/shared-auth-store/src/lib/shared-auth-store.ts` - Zustand auth store

---

## Sign-In Flow

### User Journey

1. User navigates to `/signin` (or redirected from protected route)
2. User enters email and password
3. User clicks "Sign In" button
4. Form validation runs (client-side)
5. If valid, `login()` action is called
6. Mock authentication simulates API call (500ms delay)
7. Store is updated with user information
8. `onSuccess` callback is triggered
9. User is automatically redirected to `/payments`

### Code Flow

```typescript
// 1. User submits form
const onSubmit = async (data: SignInFormData) => {
  await login(data.email, data.password);
};

// 2. Login action (in Zustand store)
login: async (email: string, password: string) => {
  set({ isLoading: true, error: null });
  try {
    const user = await mockLogin(email, password);
    set({
      user,
      isAuthenticated: true,
      isLoading: false,
      error: null,
    });
  } catch (error) {
    set({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      error: error.message,
    });
  }
};

// 3. SignIn component detects auth success
useEffect(() => {
  if (isAuthenticated && !error && onSuccess) {
    onSuccess(); // Triggers navigation in SignInPage
  }
}, [isAuthenticated, error, onSuccess]);

// 4. SignInPage handles navigation
const handleSuccess = () => {
  navigate('/payments', { replace: true });
};
```

### Form Validation

**Schema (Zod):**
```typescript
const signInSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});
```

**Validation Rules:**
- Email must be valid email format
- Password is required (minimum 1 character for sign-in)
- All validation happens client-side

### Mock Authentication

**Location:** `libs/shared-auth-store/src/lib/shared-auth-store.ts`

**Implementation:**
```typescript
async function mockLogin(email: string, _password: string): Promise<User> {
  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 500));

  // Mock authentication - accept any email/password combination
  const role: UserRole =
    email.includes('admin') ? 'ADMIN' :
    email.includes('vendor') ? 'VENDOR' :
    'CUSTOMER';

  return {
    id: `user-${Date.now()}`,
    email,
    name: email.split('@')[0] ?? 'User',
    role,
  };
}
```

**Behavior:**
- Accepts any email/password combination
- Determines role based on email:
  - Contains "admin" → `ADMIN`
  - Contains "vendor" → `VENDOR`
  - Otherwise → `CUSTOMER`
- Simulates 500ms API delay

---

## Sign-Up Flow

### User Journey

1. User navigates to `/signup` (via link from sign-in page)
2. User enters full name, email, password, and confirm password
3. User clicks "Sign Up" button
4. Form validation runs (client-side)
5. If valid, `signup()` action is called
6. Mock sign-up simulates API call (500ms delay)
7. Store is updated with user information
8. `onSuccess` callback is triggered
9. User is automatically redirected to `/payments`

### Code Flow

Similar to sign-in flow, but uses `signup()` action instead of `login()`.

### Form Validation

**Schema (Zod):**
```typescript
const signUpSchema = z.object({
  name: z.string().min(1, 'Full name is required'),
  email: z.string().email('Invalid email address'),
  password: z.string()
    .min(12, 'Password must be at least 12 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number')
    .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});
```

**Validation Rules:**
- Full name is required
- Email must be valid email format
- Password must be at least 12 characters
- Password must contain uppercase, lowercase, number, and special character
- Confirm password must match password
- All validation happens client-side

### Mock Sign-Up

**Implementation:**
```typescript
async function mockSignUp(data: SignUpData): Promise<User> {
  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 500));

  // Mock sign-up - create user with provided data
  const role: UserRole = (data.role ?? 'CUSTOMER') as UserRole;

  return {
    id: `user-${Date.now()}`,
    email: data.email,
    name: data.name,
    role,
  };
}
```

**Behavior:**
- Creates user with provided data
- Default role is `CUSTOMER` (can be overridden)
- Simulates 500ms API delay

---

## State Management

### Zustand Store

**Location:** `libs/shared-auth-store/src/lib/shared-auth-store.ts`

**State Structure:**
```typescript
interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  signup: (data: SignUpData) => Promise<void>;
  hasRole: (role: UserRole) => boolean;
  hasAnyRole: (roles: UserRole[]) => boolean;
  clearError: () => void;
}
```

**Persistence:**
- Uses Zustand `persist` middleware
- Stores in `localStorage` with key `'auth-storage'`
- Persists: `user` and `isAuthenticated`
- Automatically rehydrates on page load

### Store Usage

**In Components:**
```typescript
// Get auth state
const { user, isAuthenticated, login, logout } = useAuthStore();

// Use selector for reactivity
const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

// Check roles
const isVendor = useAuthStore((state) => state.hasRole('VENDOR'));
```

---

## Navigation After Authentication

### Pattern: Callback-Based Navigation

**Why:** Zustand subscriptions don't work reliably across Module Federation boundaries.

**Solution:** Use `onSuccess` callback pattern.

**Implementation:**

1. **SignInPage passes callback:**
```typescript
const handleSuccess = () => {
  navigate('/payments', { replace: true });
};

<SignInComponent onSuccess={handleSuccess} />
```

2. **SignIn component calls callback:**
```typescript
useEffect(() => {
  if (isAuthenticated && !error && onSuccess) {
    onSuccess(); // Triggers navigation
  }
}, [isAuthenticated, error, onSuccess]);
```

**Related:** See `docs/POC-1-Implementation/bug-fix-navigation-after-auth.md` for complete details.

---

## Route Protection

### ProtectedRoute Component

**Location:** `apps/shell/src/components/ProtectedRoute.tsx`

**Usage:**
```typescript
<Route
  path="/payments"
  element={
    <ProtectedRoute>
      <PaymentsPage />
    </ProtectedRoute>
  }
/>
```

**Behavior:**
- Checks `isAuthenticated` from store
- Shows loading state while checking
- Redirects to `/signin` if not authenticated
- Renders children if authenticated

### Automatic Redirects

**Already Authenticated:**
- Visiting `/signin` or `/signup` when authenticated → redirects to `/payments`

**Not Authenticated:**
- Visiting `/payments` when not authenticated → redirects to `/signin`

---

## Error Handling

### Form Validation Errors

- Displayed inline below each field
- Red text with error message
- Prevents form submission if invalid

### Authentication Errors

- Displayed in error banner above form
- Red background with error message
- Cleared automatically on next attempt

### Error States

```typescript
// In store
error: string | null;

// Clear error
clearError: () => {
  set({ error: null });
};
```

---

## Testing

### Unit Tests

- `apps/auth-mfe/src/components/SignIn.test.tsx`
- `apps/auth-mfe/src/components/SignUp.test.tsx`
- `libs/shared-auth-store/src/lib/shared-auth-store.spec.ts`

### Integration Tests

- `apps/shell/src/integration/AppIntegration.test.tsx` - Authentication flow tests

### E2E Tests

- `apps/shell-e2e/src/auth-flow.spec.ts` - Complete sign-in/sign-up flows

---

## Security Considerations

### POC-1 Limitations

⚠️ **Mock Authentication:** No real backend validation  
⚠️ **Client-Side Only:** All authentication logic is client-side  
⚠️ **No Token Management:** No JWT or session tokens  
⚠️ **No Password Hashing:** Passwords are not hashed  

### Security Patterns Established

✅ **Input Validation:** Zod schemas validate all inputs  
✅ **Secure Storage:** Uses localStorage (not sessionStorage)  
✅ **Password Complexity:** Enforced in sign-up form  
✅ **Error Handling:** No sensitive data in error messages  
✅ **Route Protection:** Protected routes check authentication  

### Future (POC-2)

- Real backend authentication
- JWT token management
- Password hashing (bcrypt)
- Session management
- CSRF protection
- Rate limiting

---

## API Reference

### useAuthStore Hook

```typescript
const {
  user,              // User | null
  isAuthenticated,   // boolean
  isLoading,         // boolean
  error,             // string | null
  login,             // (email: string, password: string) => Promise<void>
  logout,            // () => void
  signup,            // (data: SignUpData) => Promise<void>
  hasRole,           // (role: UserRole) => boolean
  hasAnyRole,        // (roles: UserRole[]) => boolean
  clearError,        // () => void
} = useAuthStore();
```

### User Interface

```typescript
interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole; // 'ADMIN' | 'CUSTOMER' | 'VENDOR'
}
```

---

## Troubleshooting

### Navigation Not Working After Login

**Issue:** Page doesn't redirect after successful login.

**Solution:** Ensure `onSuccess` callback is passed from `SignInPage` to `SignInComponent`.

**Related:** See `docs/POC-1-Implementation/bug-fix-navigation-after-auth.md`

### Store Not Persisting

**Issue:** User is logged out after page refresh.

**Solution:** Check localStorage - ensure `'auth-storage'` key exists and contains valid data.

### Form Validation Not Working

**Issue:** Form submits with invalid data.

**Solution:** Ensure `noValidate` is set on form element and `handleSubmit` is used from React Hook Form.

---

## Related Documentation

- [`bug-fix-navigation-after-auth.md`](./bug-fix-navigation-after-auth.md) - Navigation fix details
- [`poc-1-completion-summary.md`](./poc-1-completion-summary.md) - Overall POC-1 summary
- [`../References/mfe-poc1-architecture.md`](../References/mfe-poc1-architecture.md) - Architecture overview

---

**Status:** ✅ Complete  
**Last Updated:** 2026-01-XX

