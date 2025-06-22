# Island Bitcoin Sync Server

A minimal backend server to sync game configuration across browsers.

## Quick Start

1. **Install dependencies:**
   ```bash
   cd server
   npm install
   ```

2. **Start the server:**
   ```bash
   npm start
   ```

3. **Server will run on:**
   - Default: `http://localhost:3001`
   - Health check: `http://localhost:3001/health`

## API Endpoints

### GET `/api/config`
Get current pull payment configuration
```json
{
  "success": true,
  "data": {
    "pullPaymentId": "abc123...",
    "btcPayServerUrl": "https://btcpay.example.com",
    "lastUpdated": "2024-01-01T12:00:00.000Z"
  }
}
```

### POST `/api/config`
Update pull payment configuration
```json
{
  "pullPaymentId": "abc123def456...",
  "btcPayServerUrl": "https://your-btcpay-server.com"
}
```

### DELETE `/api/config`
Remove pull payment configuration (sets values to null)

## Environment Variables

- `PORT` - Server port (default: 3001)

## Production Notes

- Currently uses in-memory storage
- For production, replace with a real database (SQLite, PostgreSQL, etc.)
- Add authentication/authorization as needed
- Consider adding rate limiting