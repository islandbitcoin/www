# Cross-Browser Configuration Sync

Island Bitcoin's configuration automatically syncs across all browsers and devices using the unified server. This allows all users to see updated settings like minimum withdrawal amounts in real-time.

## How It Works

1. **Automatic Polling**: The app checks for configuration updates every 10 seconds
2. **Server Storage**: Configuration is stored on the server and synced to all connected browsers
3. **Instant Updates**: Changes made in one browser appear in others within 10 seconds
4. **Manual Save**: Use the "Save Config" button on the Limits tab to force an immediate sync

## Setup Requirements

### 1. Environment Variables

Make sure your `.env` file includes:

```env
# API Configuration
API_SECRET=your-secret-key-here
VITE_API_SECRET=your-secret-key-here  # Must match API_SECRET
```

### 2. Server Running

The unified server must be running with the configuration API enabled:
```bash
docker compose up -d
```

### 3. User Access

- **All users** (logged in or anonymous) can view the configuration
- **Only admin users** can modify the configuration
- Configuration updates sync to all users automatically

## Features

### Synced Settings

All configuration settings sync across browsers for all users:
- **Visible to all users:**
  - Minimum withdrawal amount
  - Game reward amounts
  - Payout limits
  - Maintenance mode status
- **Admin-only visibility:**
  - BTCPay Server configuration
  - Rate limits
  - Admin public keys

### Save Config Button

The "Save Config" button on the Admin page's Limits tab:
- Available only to admin users
- Forces an immediate save to the server
- Updates sync to all users (both admin and non-admin)
- Shows a confirmation when sync is successful

## Troubleshooting

### Settings Not Syncing

1. **Check API Key**: Ensure `VITE_API_SECRET` matches `API_SECRET` in your `.env`
2. **Verify Server**: Check that the server is running: `curl http://localhost:3000/api/health`
3. **Browser Console**: Look for sync errors in the browser developer console
4. **Network Tab**: Check if API calls to `/api/config` are succeeding

### Manual Sync

If automatic sync isn't working:
1. Click "Save Config" in the browser where you made changes
2. Refresh the other browser tabs
3. Settings should now be synchronized

### Rate Limiting

If you see "Too many requests" errors:
1. The rate limits have been increased to 1000 requests per 15 minutes
2. If still experiencing issues, wait a few minutes for the rate limit to reset

## Technical Details

- **Polling Interval**: 10 seconds
- **Storage**: Redis for persistent storage across server restarts
- **Cache TTL**: 5 minutes for performance optimization
- **Security**: 
  - Read access: Public (no authentication required)
  - Write access: Admin-only (API key authentication required)