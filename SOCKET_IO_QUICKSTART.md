# Socket.IO Chat System - Quick Start Guide

## What Was Changed

Your chat system has been completely overhauled with **real-time Socket.IO** integration. This replaces the old polling system with instant WebSocket communication.

## Key Improvements

✅ **Real-Time Messaging** - Messages appear instantly, no polling delays  
✅ **Typing Indicators** - See when someone is typing (auto-stops after 3 seconds)  
✅ **Online Status** - Green dot shows if conversation partner is active  
✅ **Read Receipts** - Check marks indicate message delivery and read status  
✅ **Scalable Architecture** - Room-based messaging, efficient user tracking  
✅ **Connection Status** - Shows when reconnecting to the chat service  
✅ **Professional UI** - Enhanced styling with smooth animations  

## Files Created/Modified

### New Files
- **`/src/lib/socket.ts`** - Server-side Socket.IO configuration with JWT auth
- **`/src/hooks/useSocket.ts`** - React hooks for Socket.IO client management
- **`/src/app/api/socket/route.ts`** - Socket.IO status endpoint
- **`/src/lib/socketServer.ts`** - Custom server setup utilities
- **`SOCKET_IO_GUIDE.md`** - Complete technical documentation

### Modified Files
- **`/src/app/(shop)/chat/ChatClient.tsx`** - Full Socket.IO integration with live features
- **`.env`** - Added Socket.IO configuration variables

## How It Works

### Connection Flow

1. User opens chat page
2. `useChatSocket` hook connects to Socket.IO server with JWT token
3. Server verifies token and authenticates connection
4. User joins conversation room when selecting a chat
5. Socket.IO establishes persistent WebSocket connection
6. Messages and events flow in real-time

### Event Flow

```
User A Types → TypeScript detects input → emit('typing:start') 
   ↓
Socket.IO server broadcasts → emit('typing:active')
   ↓
User B receives in real-time → Shows typing indicator
   ↓
User A stops typing (3s timeout) → emit('typing:stop')
   ↓
User B typing indicator disappears
```

## Usage for Developers

### Using the Chat Socket Hook

```typescript
import { useChatSocket } from '@/hooks/useSocket';

function MyChatComponent() {
  const {
    isConnected,
    sendMessage,
    setTyping,
    markAsRead,
    onMessageReceived,
    onTypingStatus,
    onUserActive,
    onReadReceipt,
  } = useChatSocket(token, currentUserId, receiverId);

  // Send a message
  const handleSend = (text: string) => {
    sendMessage(text); // Optional: auctionId as second param
  };

  // Listen to incoming messages
  useEffect(() => {
    const unsubscribe = onMessageReceived((msg) => {
      console.log('New message:', msg);
      // Update UI
    });
    return unsubscribe;
  }, [onMessageReceived]);

  // Check connection status
  if (!isConnected) {
    return <p>Connecting...</p>;
  }

  return (
    // Your UI
  );
}
```

### Socket Events Quick Reference

**Sending Events (Client → Server)**
- `sendMessage(content, auctionId?)` - Send message
- `setTyping(true/false)` - Show/hide typing indicator
- `markAsRead(auctionId?)` - Mark messages as read
- `joinChat()` - Join conversation room (auto on select)
- `leaveChat()` - Leave conversation room (auto on unmount)

**Listening to Events (Server → Client)**
- `onMessageReceived(callback)` - New message arrived
- `onTypingStatus(callback)` - Someone typing/stopped
- `onUserActive(callback)` - User joined/left chat
- `onReadReceipt(callback)` - Messages marked as read

## Configuration

### Environment Variables

```env
NEXT_PUBLIC_APP_URL=http://localhost:3000  # Change for production
JWT_SECRET=your-secret-key                  # Use strong random value
```

### Socket.IO Settings

Server settings in `/src/lib/socket.ts`:
- **Ping/Pong**: 25s interval, 20s timeout
- **Max message size**: 1MB
- **Transports**: WebSocket + HTTP polling fallback
- **CORS**: Configured for your domain

## Deployment

### Development
```bash
npm run dev
# Socket.IO automatically initializes
```

### Production with Custom Server

Create `server.ts`:
```typescript
import { createServer } from 'http';
import next from 'next';
import { setupSocket } from './src/lib/socketServer';

const dev = process.env.NODE_ENV !== 'production';
const app = next({ dev });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const server = createServer((req, res) => {
    handle(req, res);
  });

  setupSocket(server);

  server.listen(3000, () => {
    console.log('Ready on http://localhost:3000');
  });
});
```

Update `package.json`:
```json
{
  "scripts": {
    "dev": "tsx server.ts",
    "start": "NODE_ENV=production tsx server.ts"
  }
}
```

## Testing the Features

### Test Real-Time Messaging
1. Open two browser windows/tabs logged in as different users
2. Open chat between them
3. Send message - appears instantly in other window
4. No delay, no refresh needed ✅

### Test Typing Indicators
1. In one window, start typing in message input
2. Other window shows "typing..." indicator instantly
3. Stop typing, indicator disappears after 3 seconds ✅

### Test Online Status
1. Both windows open chat
2. Green dot appears on conversation partner's avatar
3. Refresh/close one window, dot disappears ✅

### Test Read Receipts
1. User A sends message (empty check mark shown)
2. User B receives and marks as read
3. User A sees filled check mark (message read) ✅

### Test Connection Status
1. Disconnect internet while chatting
2. Yellow bar appears: "Reconnecting to chat..."
3. Reconnect internet
4. Bar disappears, connection restored ✅

## Performance Optimization

The system is built for scale:

- **Room-based messaging** reduces broadcast overhead
- **Singleton socket pattern** prevents duplicate connections  
- **Efficient user tracking** uses Set-based data structures
- **Smart notifications** only sent when user not actively viewing chat
- **Message persistence** uses existing database (no message queue needed yet)

For 1000+ concurrent users, consider adding:
- Redis message queue for pub/sub
- Socket.IO adapter for multi-server deployment
- Message archival to separate database

## Troubleshooting

### Connection won't establish
- Check `NEXT_PUBLIC_APP_URL` matches your domain
- Verify JWT_SECRET is set
- Check browser console for CORS errors

### Messages not sending
- Ensure socket is connected (`isConnected === true`)
- Check token hasn't expired
- Verify receiverId is correct

### Typing indicator laggy
- Normal on slow connections
- 3-second auto-clear prevents stuck indicators
- Adjust timeout in `ChatClient.tsx` if needed

## Next Steps

1. **Test thoroughly** - Use the testing checklist above
2. **Monitor in production** - Log Socket.IO errors and connection issues
3. **Gather feedback** - Get user feedback on real-time experience
4. **Scale as needed** - Add Redis/message queue when needed

## Support

For detailed technical documentation, see [SOCKET_IO_GUIDE.md](./SOCKET_IO_GUIDE.md)

For Socket.IO official docs: https://socket.io/docs/v4/
