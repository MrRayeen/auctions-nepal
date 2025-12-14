# Socket.IO Connection Issues - Troubleshooting

## Issue: "Connection lost. Reconnecting." stuck message

### Root Cause
The Socket.IO server wasn't running. In Next.js development, you need a **custom server** to run Socket.IO alongside Next.js.

### Solution

#### Step 1: Stop Current Dev Server
Press `Ctrl+C` in your terminal running `npm run dev`

#### Step 2: Start New Dev Server with Socket.IO
```bash
npm run dev
```

This now runs the custom `server.js` which:
- Starts Next.js
- Initializes Socket.IO on the same HTTP server
- Listens for WebSocket connections

#### Step 3: Verify Connection
When server starts, you should see:
```
✅ Socket.IO server initialized
🚀 Server running on http://localhost:3000
✅ Socket.IO ready for WebSocket connections
```

#### Step 4: Test Chat
1. Open http://localhost:3000 in browser
2. Login with a user
3. Go to chat page
4. The connection status bar should disappear
5. Messages should send instantly

---

## Quick Checklist

✅ Socket.IO server initialized (check console output)
✅ Client can connect (no reconnecting message after 2-3 seconds)
✅ JWT_SECRET is set in .env
✅ NEXT_PUBLIC_APP_URL is http://localhost:3000 (for development)
✅ Firewall not blocking port 3000

---

## Common Issues & Fixes

### Still seeing "Reconnecting..."?

**Check 1: Server Console**
Look for error messages like:
- `Failed to initialize Socket.IO` - Server startup failed
- `Socket.IO server already initialized` - Only happens once, then works

**Check 2: Browser Console**
Open DevTools (F12) → Console tab
- Look for WebSocket errors
- Look for CORS errors
- Check network tab for WebSocket connection

**Check 3: Kill Port 3000**
If port is already in use:
```powershell
# Windows
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# Or just restart your computer
```

**Check 4: Clear Browser Cache**
- Hard refresh: `Ctrl+Shift+R` or `Cmd+Shift+R`
- Clear localStorage: Open DevTools → Application → Storage → Clear All

---

## If Still Not Working

### Debug Mode
Add this to enable Socket.IO client debugging:

In browser console:
```javascript
localStorage.debug = 'socket.io-client:*';
```

Then refresh page and watch console for connection attempts.

### Check Network
In DevTools → Network tab:
1. Filter by "WS" (WebSocket)
2. Initiate chat or send message
3. Should see WebSocket connection attempt
4. Should show `101` status (successful upgrade)

### Verify Backend
Check that server.js is actually running Socket.IO:

```bash
# In another terminal, check if server is listening
curl http://localhost:3000/api/socket
```

Should return:
```json
{
  "status": "ok",
  "message": "Socket.IO server is configured and ready",
  "timestamp": "2025-12-14T10:30:00.000Z"
}
```

---

## For Production Deployment

Use this in your production server startup:
```bash
NODE_ENV=production npm run build
NODE_ENV=production npm start
```

The `start` script uses `next start` which starts the built app on port 3000.

For production with custom server, create a similar setup but use the compiled Next.js build.

---

## Scripts Available

| Command | Purpose |
|---------|---------|
| `npm run dev` | **USE THIS** - Runs custom server with Socket.IO |
| `npm run dev:next` | Old command (no Socket.IO) |
| `npm run build` | Production build |
| `npm start` | Production start |

---

**Status:** If you see the green "Connected" status in chat, Socket.IO is working! 🎉
