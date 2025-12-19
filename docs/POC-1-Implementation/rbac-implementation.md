# Role-Based Access Control (RBAC) Implementation

**POC-1 Implementation**  
**Status:** ✅ Complete

---

## Overview

POC-1 implements a **role-based access control (RBAC) system** with three roles: ADMIN, VENDOR, and CUSTOMER. RBAC is enforced at the UI level and through helper functions. In POC-1, only VENDOR and CUSTOMER roles are fully implemented; ADMIN role is defined but not yet used.

---

## Roles

### ADMIN

**Status:** ⚠️ Defined but not implemented in POC-1

**Planned Capabilities (POC-2+):**
- Full system access
- User management
- System configuration
- All VENDOR and CUSTOMER capabilities

### VENDOR

**Status:** ✅ Fully implemented

**Capabilities:**
- ✅ View all payments
- ✅ Create new payments
- ✅ Update existing payments
- ✅ Delete payments
- ✅ Access Reports (UI link visible)

**UI Elements:**
- "Create Payment" button (visible)
- "Edit" button on payments (visible)
- "Delete" button on payments (visible)
- "Reports" link in header (visible)

### CUSTOMER

**Status:** ✅ Fully implemented

**Capabilities:**
- ✅ View all payments
- ❌ Cannot create payments
- ❌ Cannot update payments
- ❌ Cannot delete payments
- ❌ Cannot access Reports

**UI Elements:**
- No "Create Payment" button
- No "Edit" or "Delete" buttons
- No "Reports" link in header
- Read-only view

---

## Implementation

### User Model

**Location:** `libs/shared-auth-store/src/lib/shared-auth-store.ts`

```typescript
export type UserRole = 'ADMIN' | 'CUSTOMER' | 'VENDOR';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
}
```

### Role Assignment

**Mock Authentication:**
```typescript
async function mockLogin(email: string, _password: string): Promise<User> {
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

**Role Determination:**
- Email contains "admin" → `ADMIN`
- Email contains "vendor" → `VENDOR`
- Otherwise → `CUSTOMER`

**Example Emails:**
- `admin@example.com` → ADMIN
- `vendor@example.com` → VENDOR
- `customer@example.com` → CUSTOMER
- `user@example.com` → CUSTOMER

---

## Helper Functions

### hasRole

**Location:** `libs/shared-auth-store/src/lib/shared-auth-store.ts`

```typescript
hasRole: (role: UserRole): boolean => {
  const { user } = get();
  return user?.role === role;
}
```

**Usage:**
```typescript
const isVendor = useAuthStore((state) => state.hasRole('VENDOR'));
const isCustomer = useAuthStore((state) => state.hasRole('CUSTOMER'));
const isAdmin = useAuthStore((state) => state.hasRole('ADMIN'));
```

**Example:**
```typescript
const isVendor = useAuthStore((state) => state.hasRole('VENDOR'));

{isVendor && (
  <button onClick={handleCreate}>Create Payment</button>
)}
```

### hasAnyRole

**Location:** `libs/shared-auth-store/src/lib/shared-auth-store.ts`

```typescript
hasAnyRole: (roles: UserRole[]): boolean => {
  const { user } = get();
  if (!user) return false;
  return roles.includes(user.role);
}
```

**Usage:**
```typescript
const canManagePayments = useAuthStore((state) => 
  state.hasAnyRole(['VENDOR', 'ADMIN'])
);

const canViewReports = useAuthStore((state) => 
  state.hasAnyRole(['VENDOR', 'ADMIN'])
);
```

**Example:**
```typescript
const canManagePayments = useAuthStore((state) => 
  state.hasAnyRole(['VENDOR', 'ADMIN'])
);

{canManagePayments && (
  <div>
    <button onClick={handleCreate}>Create Payment</button>
    <button onClick={handleEdit}>Edit Payment</button>
    <button onClick={handleDelete}>Delete Payment</button>
  </div>
)}
```

---

## UI-Level Enforcement

### Payments Page

**Location:** `apps/payments-mfe/src/components/PaymentsPage.tsx`

**VENDOR UI:**
```typescript
const isVendor = useAuthStore((state) => state.hasRole('VENDOR'));

return (
  <div>
    {isVendor && (
      <button onClick={openCreateModal}>Create Payment</button>
    )}
    
    <PaymentsList>
      {payments.map((payment) => (
        <PaymentItem key={payment.id}>
          {payment.description}
          {isVendor && (
            <>
              <button onClick={() => handleEdit(payment.id)}>Edit</button>
              <button onClick={() => handleDelete(payment.id)}>Delete</button>
            </>
          )}
        </PaymentItem>
      ))}
    </PaymentsList>
  </div>
);
```

**CUSTOMER UI:**
```typescript
const isCustomer = useAuthStore((state) => state.hasRole('CUSTOMER'));

return (
  <div>
    {/* No create button for CUSTOMER */}
    
    <PaymentsList>
      {payments.map((payment) => (
        <PaymentItem key={payment.id}>
          {payment.description}
          {/* No edit/delete buttons for CUSTOMER */}
        </PaymentItem>
      ))}
    </PaymentsList>
  </div>
);
```

### Header Component

**Location:** `libs/shared-header-ui/src/lib/shared-header-ui.tsx`

**Reports Link:**
```typescript
const isVendor = useAuthStore((state) => state.hasRole('VENDOR'));

return (
  <nav>
    <Link to="/payments">Payments</Link>
    {isVendor && (
      <Link to="/reports">Reports</Link>
    )}
  </nav>
);
```

**Note:** Reports page is not implemented in POC-1, but the link is visible to VENDOR users.

---

## Route-Level Enforcement (Future)

### Planned Implementation (POC-2+)

**Protected Routes with Roles:**
```typescript
<Route
  path="/reports"
  element={
    <ProtectedRoute requiredRoles={['VENDOR', 'ADMIN']}>
      <ReportsPage />
    </ProtectedRoute>
  }
/>
```

**Current Implementation:**
- Routes are protected by authentication only
- Role-based route protection is planned for POC-2

---

## Testing

### Unit Tests

**Location:** `libs/shared-auth-store/src/lib/shared-auth-store.spec.ts`

**Tests:**
- `hasRole` function tests
- `hasAnyRole` function tests
- Role assignment tests

**Example:**
```typescript
it('should return true if user has role', () => {
  useAuthStore.setState({
    user: { id: '1', email: 'vendor@test.com', name: 'Vendor', role: 'VENDOR' },
    isAuthenticated: true,
  });

  expect(useAuthStore.getState().hasRole('VENDOR')).toBe(true);
  expect(useAuthStore.getState().hasRole('CUSTOMER')).toBe(false);
});
```

### Integration Tests

**Location:** `apps/shell/src/integration/PaymentsFlowIntegration.test.tsx`

**Tests:**
- VENDOR can create payments
- CUSTOMER cannot create payments
- VENDOR can edit/delete payments
- CUSTOMER cannot edit/delete payments

### E2E Tests

**Location:** `apps/shell-e2e/src/role-based-access.spec.ts`

**Tests:**
- VENDOR sees create/edit/delete buttons
- CUSTOMER does not see create/edit/delete buttons
- VENDOR sees Reports link
- CUSTOMER does not see Reports link

---

## Security Considerations

### POC-1 Limitations

⚠️ **Client-Side Only:** RBAC is enforced only at the UI level  
⚠️ **No Backend Validation:** No server-side role checking  
⚠️ **No Route Protection:** Routes are not protected by roles  
⚠️ **No API Authorization:** API calls don't check roles  

### Security Patterns Established

✅ **Role Storage:** Roles stored in user object  
✅ **Helper Functions:** Type-safe role checking  
✅ **UI Enforcement:** Conditional rendering based on roles  
✅ **Type Safety:** TypeScript enforces role types  

### Future (POC-2+)

- Backend role validation
- Route-level role protection
- API-level authorization
- JWT token with role claims
- Fine-grained permissions
- Permission-based access control (PBAC)

---

## Best Practices

### 1. Use Helper Functions

**✅ Good:**
```typescript
const isVendor = useAuthStore((state) => state.hasRole('VENDOR'));
```

**❌ Bad:**
```typescript
const user = useAuthStore((state) => state.user);
const isVendor = user?.role === 'VENDOR';
```

### 2. Use hasAnyRole for Multiple Roles

**✅ Good:**
```typescript
const canManage = useAuthStore((state) => 
  state.hasAnyRole(['VENDOR', 'ADMIN'])
);
```

**❌ Bad:**
```typescript
const isVendor = useAuthStore((state) => state.hasRole('VENDOR'));
const isAdmin = useAuthStore((state) => state.hasRole('ADMIN'));
const canManage = isVendor || isAdmin;
```

### 3. Check Roles at Component Level

**✅ Good:**
```typescript
function PaymentsPage() {
  const isVendor = useAuthStore((state) => state.hasRole('VENDOR'));
  
  return (
    <div>
      {isVendor && <CreateButton />}
      <PaymentsList />
    </div>
  );
}
```

**❌ Bad:**
```typescript
function PaymentsPage() {
  const user = useAuthStore((state) => state.user);
  
  return (
    <div>
      {user?.role === 'VENDOR' && <CreateButton />}
      <PaymentsList />
    </div>
  );
}
```

---

## API Reference

### UserRole Type

```typescript
type UserRole = 'ADMIN' | 'CUSTOMER' | 'VENDOR';
```

### User Interface

```typescript
interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
}
```

### Helper Functions

```typescript
// Check single role
hasRole: (role: UserRole) => boolean

// Check multiple roles
hasAnyRole: (roles: UserRole[]) => boolean
```

### Usage Examples

```typescript
// Get current user role
const user = useAuthStore((state) => state.user);
const role = user?.role; // 'ADMIN' | 'CUSTOMER' | 'VENDOR' | undefined

// Check if user is VENDOR
const isVendor = useAuthStore((state) => state.hasRole('VENDOR'));

// Check if user can manage payments
const canManagePayments = useAuthStore((state) => 
  state.hasAnyRole(['VENDOR', 'ADMIN'])
);
```

---

## Troubleshooting

### Role Not Working

**Issue:** User doesn't have expected role.

**Solution:**
1. Check email format (must contain "vendor" or "admin" for special roles)
2. Verify user object in auth store
3. Check role assignment in mock authentication

### UI Elements Not Showing/Hiding

**Issue:** VENDOR sees CUSTOMER UI or vice versa.

**Solution:**
1. Verify `hasRole` helper is working correctly
2. Check component conditional rendering
3. Verify auth store state

### Multiple Roles Not Working

**Issue:** `hasAnyRole` not working as expected.

**Solution:**
1. Verify role array is correct
2. Check user role matches one of the roles in array
3. Verify helper function implementation

---

## Related Documentation

- [`authentication-flow.md`](./authentication-flow.md) - Authentication details
- [`payments-flow.md`](./payments-flow.md) - Payments flow details
- [`poc-1-completion-summary.md`](./poc-1-completion-summary.md) - Overall summary

---

## Future Enhancements (POC-2+)

### Planned Features

1. **ADMIN Role Implementation**
   - User management
   - System configuration
   - Full system access

2. **Route-Level Protection**
   - Role-based route guards
   - Automatic redirects
   - Permission-based routing

3. **API-Level Authorization**
   - Backend role validation
   - JWT token with role claims
   - Permission-based API access

4. **Fine-Grained Permissions**
   - Permission-based access control (PBAC)
   - Resource-level permissions
   - Action-level permissions

5. **Role Management**
   - Dynamic role assignment
   - Role hierarchy
   - Custom roles

---

**Status:** ✅ Complete  
**Last Updated:** 2026-01-XX

