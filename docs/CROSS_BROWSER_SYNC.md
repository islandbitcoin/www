# Cross-Browser Configuration Sync

Island Bitcoin's admin configuration automatically syncs across different browsers and devices using the unified server.

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

### 3. Admin Access

You must be logged in as an admin user in all browsers where you want sync to work.

## Features

### Synced Settings

All admin configuration settings sync across browsers:
- BTCPay Server configuration
- Game reward amounts
- Payout limits
- Rate limits
- Admin public keys
- Maintenance mode

### Save Config Button

The "Save Config" button on the Limits tab:
- Forces an immediate save to the server
- Ensures all browsers receive the latest configuration
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
1. Add your IP to the whitelist (see [DEPLOYMENT.md](./DEPLOYMENT.md))
2. Or wait a few minutes for the rate limit to reset

## Technical Details

- **Polling Interval**: 10 seconds
- **Cache TTL**: 5 minutes on server, 1 minute on client
- **Storage**: Redis for caching, in-memory for persistence
- **Security**: API key authentication required