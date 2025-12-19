# Backend Services Debugging Guide

## Debug Ports Configuration

When running backend services with `pnpm dev:backend`, Node.js automatically assigns sequential debug ports starting from 9229:

| Service          | Application Port | Debug Port (Auto-assigned) | URL                                    |
|------------------|------------------|----------------------------|----------------------------------------|
| API Gateway      | 3000             | 9229 (typically)           | chrome://inspect or chrome://devtools  |
| Auth Service     | 3001             | 9230 (typically)           | chrome://inspect or chrome://devtools  |
| Payments Service | 3002             | 9231 (typically)           | chrome://inspect or chrome://devtools  |
| Admin Service    | 3003             | 9232 (typically)           | chrome://inspect or chrome://devtools  |
| Profile Service  | 3004             | 9233 (typically)           | chrome://inspect or chrome://devtools  |

**Note:** Debug ports are automatically assigned by Node.js. The actual ports may vary depending on which services start first.

## How to Debug

### Using Chrome DevTools

1. Start the backend services:
   ```bash
   pnpm dev:backend
   ```

2. Open Chrome and navigate to:
   ```
   chrome://inspect
   ```

3. You should see your running services automatically detected. If not, click "Configure" and add:
   ```
   localhost:9229
   localhost:9230
   localhost:9231
   localhost:9232
   localhost:9233
   ```
   
   **Tip:** Check the terminal output when starting services to see the actual debug ports assigned.

4. Click "inspect" under the service you want to debug

### Using VS Code

Add this configuration to your `.vscode/launch.json`:

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "type": "node",
      "request": "attach",
      "name": "Debug API Gateway",
      "port": 9229,
      "restart": true,
      "skipFiles": ["<node_internals>/**"]
    },
    {
      "type": "node",
      "request": "attach",
      "name": "Debug Auth Service",
      "port": 9230,
      "restart": true,
      "skipFiles": ["<node_internals>/**"]
    },
    {
      "type": "node",
      "request": "attach",
      "name": "Debug Payments Service",
      "port": 9231,
      "restart": true,
      "skipFiles": ["<node_internals>/**"]
    },
    {
      "type": "node",
      "request": "attach",
      "name": "Debug Admin Service",
      "port": 9232,
      "restart": true,
      "skipFiles": ["<node_internals>/**"]
    },
    {
      "type": "node",
      "request": "attach",
      "name": "Debug Profile Service",
      "port": 9233,
      "restart": true,
      "skipFiles": ["<node_internals>/**"]
    }
  ],
  "compounds": [
    {
      "name": "Debug All Services",
      "configurations": [
        "Debug API Gateway",
        "Debug Auth Service",
        "Debug Payments Service",
        "Debug Admin Service",
        "Debug Profile Service"
      ]
    }
  ]
}
```

### Using Cursor

Cursor uses the same configuration as VS Code. Create the `.vscode/launch.json` file as shown above.

## Production Mode

In production mode (`NODE_ENV=production`), debugging is automatically disabled for all services.

## Troubleshooting

### Port Already in Use

If you see "address already in use" errors:

1. Check if services are already running:
   ```bash
   lsof -i :9229,9230,9231,9232,9233
   ```

2. Kill any orphaned processes:
   ```bash
   pnpm backend:kill
   ```

3. Restart services:
   ```bash
   pnpm dev:backend
   ```

### Debugger Not Connecting

1. Ensure services are running in development mode
2. Check that the debug port is correct in Chrome DevTools
3. Verify no firewall is blocking the ports
4. Try restarting the service

## Common Debug Commands

```bash
# Start all services with debugging enabled
pnpm dev:backend

# Start a single service with debugging
pnpm dev:api-gateway      # Debug port 9229
pnpm dev:auth-service     # Debug port 9230
pnpm dev:payments-service # Debug port 9231
pnpm dev:admin-service    # Debug port 9232
pnpm dev:profile-service  # Debug port 9233

# Check which ports are in use
lsof -i :9229,9230,9231,9232,9233

# Kill all backend services
pnpm backend:kill
```

## Benefits

- **No Port Conflicts**: Each service has its own debug port
- **Parallel Debugging**: Debug multiple services simultaneously
- **Clean Logs**: No more "address already in use" warnings
- **Better DX**: Attach debugger to any service instantly
