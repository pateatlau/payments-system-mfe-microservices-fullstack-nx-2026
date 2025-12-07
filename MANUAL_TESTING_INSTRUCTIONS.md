# Manual Testing Instructions - Sign-In Redirect Fix

## Step-by-Step Testing Guide

### Prerequisites
- Node.js 18+ and pnpm 9.x installed
- All dependencies installed: `pnpm install`
- Ports 4200, 4201, 4202 available

---

## Step 1: Kill Any Existing Servers

**Terminal 1:**
```bash
pnpm kill:all
```

This kills any processes running on ports 4200, 4201, or 4202.

**Verify ports are free:**
```bash
lsof -i :4200 -i :4201 -i :4202
```
(Should return nothing if ports are free)

---

## Step 2: Build the Remote MFEs

**Terminal 1:**
```bash
pnpm build:remotes
```

This builds both `auth-mfe` and `payments-mfe`. Wait for the build to complete (you should see "Successfully ran target build" messages).

**Expected output:**
```
✔ auth-mfe:build
✔ payments-mfe:build
```

---

## Step 3: Start All Servers in Preview Mode

**Terminal 1 (keep it running):**
```bash
pnpm preview:all
```

This starts all three servers in parallel:
- Shell app on port 4200
- Auth MFE on port 4201
- Payments MFE on port 4202

**Wait for all servers to start.** You should see messages like:
```
> Local:   http://localhost:4200/
> Local:   http://localhost:4201/
> Local:   http://localhost:4202/
```

**Keep this terminal open** - don't close it while testing.

---

## Step 4: Open the Application

Open your browser and navigate to:
```
http://localhost:4200
```

You should see the sign-in page.

---

## Step 5: Test Sign-In Flow

### Test Case 1: Sign In with Valid Credentials

1. **Enter email:** `test@example.com`
2. **Enter password:** `password123`
3. **Click "Sign In" button**

**Expected Behavior:**
- ✅ Form submits (no page refresh)
- ✅ Button shows "Signing in..." briefly
- ✅ **Automatically redirects to `/payments` page** (no manual refresh needed)
- ✅ Header shows "Test User" and logout button
- ✅ Payments page content is visible

**If it doesn't redirect automatically:**
- Open browser DevTools (F12)
- Go to Console tab
- Look for any errors
- Check if `isAuthenticated` is being set correctly

### Test Case 2: Sign In with Invalid Credentials

1. **Enter email:** `wrong@example.com`
2. **Enter password:** `wrongpassword`
3. **Click "Sign In" button**

**Expected Behavior:**
- ✅ Form submits (no page refresh)
- ✅ Error message appears: "Invalid email or password"
- ✅ **Does NOT redirect** (stays on sign-in page)
- ✅ Form fields remain filled

### Test Case 3: Sign Up Flow

1. Click "Sign up" link at bottom of sign-in page
2. Fill in the form:
   - **Name:** `New User`
   - **Email:** `newuser@example.com`
   - **Password:** `Password123!@#`
   - **Confirm Password:** `Password123!@#`
3. **Click "Sign Up" button**

**Expected Behavior:**
- ✅ Form submits (no page refresh)
- ✅ **Automatically redirects to `/payments` page**
- ✅ Header shows "New User" and logout button

---

## Step 6: Verify Navigation Works

After successful sign-in:

1. **Check URL:** Should be `http://localhost:4200/payments`
2. **Check Header:** Should show user name and logout button
3. **Check Content:** Should show payments page content

---

## Step 7: Test Logout

1. Click "Logout" button in header
2. **Expected Behavior:**
   - ✅ Automatically redirects to `/signin` page
   - ✅ User info disappears from header
   - ✅ Sign-in form is visible

---

## Troubleshooting

### Issue: Servers won't start

**Solution:**
```bash
# Kill all processes
pnpm kill:all

# Wait 2 seconds, then try again
pnpm build:remotes
pnpm preview:all
```

### Issue: "Port already in use" error

**Solution:**
```bash
# Kill specific port
pnpm kill:shell      # Port 4200
pnpm kill:auth-mfe   # Port 4201
pnpm kill:payments-mfe # Port 4202

# Or kill all
pnpm kill:all
```

### Issue: Changes not appearing

**Solution:**
1. Stop all servers (Ctrl+C in terminal)
2. Rebuild the changed project:
   ```bash
   # If you changed auth-mfe
   pnpm build:auth-mfe
   
   # If you changed payments-mfe
   pnpm build:payments-mfe
   
   # If you changed shell
   pnpm build:shell
   ```
3. Restart servers:
   ```bash
   pnpm preview:all
   ```
4. **Hard refresh browser:** Ctrl+Shift+R (Windows/Linux) or Cmd+Shift+R (Mac)

### Issue: Redirect still not working

**Check the following:**

1. **Browser Console:**
   - Open DevTools (F12)
   - Check Console tab for errors
   - Look for Zustand or React Router errors

2. **Network Tab:**
   - Check if `remoteEntry.js` files are loading (should be 200 status)
   - Check if there are any 404 errors

3. **Application Tab (in DevTools):**
   - Go to Application → Local Storage
   - Check if `auth-storage` key exists
   - Verify it contains `isAuthenticated: true`

4. **React DevTools (if installed):**
   - Check if `SignInPage` component re-renders when `isAuthenticated` changes
   - Check if `useEffect` in `SignInPage` is being called

---

## Quick Reference Commands

```bash
# Kill all servers
pnpm kill:all

# Build remotes
pnpm build:remotes

# Start all servers
pnpm preview:all

# Build and start (one command)
pnpm dev

# Build specific project
pnpm build:shell
pnpm build:auth-mfe
pnpm build:payments-mfe
```

---

## Expected Test Results

✅ **PASS:** Sign-in automatically redirects to `/payments`  
✅ **PASS:** Sign-up automatically redirects to `/payments`  
✅ **PASS:** Logout automatically redirects to `/signin`  
✅ **PASS:** No console errors  
✅ **PASS:** No navigation throttling warnings  
✅ **PASS:** All Module Federation remotes load successfully  

---

## Notes

- **HMR is not available** in preview mode - you must rebuild and refresh to see changes
- **Keep servers running** while testing - don't close the terminal
- **Use hard refresh** (Ctrl+Shift+R / Cmd+Shift+R) if changes don't appear
- **Check browser console** for any errors or warnings

