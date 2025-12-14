# Socket.IO Chat System - Implementation Guide

## Overview

The chat system has been completely overhauled with **Socket.IO** for real-time, bidirectional communication. This replaces the old polling-based approach with true WebSocket support for instant message delivery, typing indicators, online status, and read receipts.

## Architecture

### Server-Side (`/src/lib/socket.ts`)

- **JWT Authentication**: Custom middleware verifies tokens on connection handshake
- **Room-Based Messaging**: Users in the same conversation are in a dedicated room
- **Scalable Design**: Uses Set-based user tracking, supports multiple server instances with message queues
- **Event Handlers**:
  - `chat:join` - User joins a conversation room
  - `chat:leave` - User leaves a conversation room
  - `message:send` - New message is sent and persisted to database
  - `typing:start` - Typing indicator starts
  - `typing:stop` - Typing indicator stops
  - `message:read` - Messages marked as read by receiver

### Client-Side (`/src/hooks/useSocket.ts`)

- **Custom React Hook**: `useSocket()` for direct socket management
- **Chat-Specific Hook**: `useChatSocket()` provides simplified chat API
- **Singleton Pattern**: Prevents multiple socket instances
- **Auto-Reconnection**: Handles disconnections with exponential backoff
- **Event Listeners**: Methods to subscribe to socket events with cleanup

### UI Component (`/src/app/(shop)/chat/ChatClient.tsx`)

- Real-time message display with no latency
- Live typing indicators showing who's typing
- Online/offline status with green indicator dots
- Read receipts (check marks for message delivery status)
- Connection status bar showing network state
- Graceful fallbacks when connection lost

## Key Features

### 1. Real-Time Messaging
Messages are instantly sent to connected clients via Socket.IO. Database persistence still happens for message history.

```typescript
// Client sends message
socketSendMessage(content, auctionId);

// Server receives and broadcasts
socket.on('message:send', async (payload) => {
  // Persist to database
  const message = await prisma.message.create({...});
  // Broadcast to chat room
  io.to(roomName).emit('message:new', message);
});
```

### 2. Typing Indicators
Users see real-time typing status without any lag.

```typescript
// Auto-stops after 3 seconds of inactivity
setTyping(true); // Emits typing:start
// ... timeout clears it
setTyping(false); // Emits typing:stop
```

### 3. Online Status
Green dot shows if conversation partner is actively using the app.

```typescript
// Broadcast when user connects
io.emit('user:online', { userId, userName });

// Broadcast when user disconnects
io.emit('user:offline', { userId });
```

### 4. Read Receipts
Check marks indicate message delivery and read status.

```typescript
// Client marks as read when opening conversation
markAsRead(auctionId);

// Server updates database and notifies sender
emit('message:read-receipt', { readBy: userId });
```

### 5. Unread Notifications
When receiver isn't actively viewing the chat, they get notified of new messages.

```typescript
if (!isReceiverInChat) {
  io.to([...receiverSessions]).emit('notification:unread', {
    senderId, senderName, count
  });
}
```

## Installation & Setup

### 1. Dependencies Already Installed
```bash
npm install socket.io socket.io-client
```

### 2. Server Configuration

The Socket.IO server is initialized with custom JWT authentication. For development with Next.js, use the built-in server. For production deployments, create a custom server:

**Option A: Next.js Built-in Server (Development)**
The Socket.IO server will initialize automatically on first client connection.

**Option B: Custom Server (Production)**

Create `server.ts` in your project root:

```typescript
import { createServer } from 'http';
import { parse } from 'url';
import next from 'next';
import { initializeSocketIO } from './src/lib/socket';

const dev = process.env.NODE_ENV !== 'production';
const app = next({ dev });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const server = createServer((req, res) => {
    handle(req, res);
  });

  const io = initializeSocketIO(server);

  server.listen(3000, (err?: any) => {
    if (err) throw err;
    console.log('> Ready on http://localhost:3000');
    console.log('> Socket.IO server initialized');
  });
});
```

Update `package.json`:
```json
{
  "scripts": {
    "dev": "tsx server.ts",
    "build": "next build",
    "start": "NODE_ENV=production tsx server.ts"
  }
}
```

### 3. Environment Variables

Add to `.env`:
```env
NEXT_PUBLIC_APP_URL=http://localhost:3000  # Client-side URL
JWT_SECRET=your-secret-key-change-in-production
```

## Usage

### Basic Socket Connection

```typescript
import { useSocket } from '@/hooks/useSocket';

const MyComponent = () => {
  const { socket, isConnected, emit, on } = useSocket({
    token: authToken,
    userId: currentUserId,
    onConnect: () => console.log('Connected!'),
    onError: (error) => console.error(error),
  });

  return (
    <div>
      {isConnected ? 'Connected' : 'Disconnected'}
    </div>
  );
};
```

### Chat-Specific Usage

```typescript
import { useChatSocket } from '@/hooks/useSocket';

const ChatComponent = ({ receiverId }) => {
  const {
    isConnected,
    sendMessage,
    setTyping,
    markAsRead,
    onMessageReceived,
    onTypingStatus,
  } = useChatSocket(token, userId, receiverId);

  // Send message
  const handleSend = (text) => {
    sendMessage(text);
  };

  // Listen to messages
  useEffect(() => {
    const unsubscribe = onMessageReceived((msg) => {
      console.log('New message:', msg);
    });
    return unsubscribe;
  }, [onMessageReceived]);

  // Listen to typing
  useEffect(() => {
    const unsubscribe = onTypingStatus((data) => {
      console.log('Typing:', data);
    });
    return unsubscribe;
  }, [onTypingStatus]);
};
```

## Event Reference

### Client → Server Events

| Event | Payload | Description |
|-------|---------|-------------|
| `chat:join` | `receiverId: number` | Join conversation room |
| `chat:leave` | `receiverId: number` | Leave conversation room |
| `message:send` | `{ receiverId, content, auctionId? }` | Send message |
| `typing:start` | `{ receiverId }` | Start typing |
| `typing:stop` | `{ receiverId }` | Stop typing |
| `message:read` | `{ receiverId, auctionId? }` | Mark as read |

### Server → Client Events

| Event | Payload | Description |
|-------|---------|-------------|
| `message:new` | Message object | New message received |
| `typing:active` | `{ userId, userName }` | Someone started typing |
| `typing:inactive` | `{ userId }` | Someone stopped typing |
| `chat:user-active` | `{ userId, userName }` | User joined chat room |
| `chat:user-inactive` | `{ userId }` | User left chat room |
| `message:read-receipt` | `{ readBy }` | Messages marked as read |
| `user:online` | `{ userId, userName }` | User came online |
| `user:offline` | `{ userId }` | User went offline |
| `notification:unread` | `{ senderId, senderName, count }` | Unread notification |

## Scalability Features

### 1. Room-Based Architecture
- Messages only broadcast to relevant users in conversation room
- Reduces server load compared to broadcasting to all users

### 2. Singleton Socket Instance
- Prevents multiple connections from same client
- Reduces memory usage and connection overhead

### 3. Active User Tracking
- Efficient Set-based tracking of active users
- Only notifies offline when ALL sessions disconnected

### 4. Message Batching
- Unread counts calculated on demand
- No constant polling or interval-based queries

### 5. Production-Ready Optimization
- Configurable ping/pong intervals (25s, 20s timeouts)
- Max message size limit (1MB)
- WebSocket + HTTP polling fallback support
- Proper error handling and cleanup

## Database Integration

Messages are persisted to the `Message` model:

```prisma
model Message {
  id         Int      @id @default(autoincrement())
  sender     User     @relation("SentMessages", fields: [senderId], references: [id])
  senderId   Int
  receiver   User     @relation("ReceivedMessages", fields: [receiverId], references: [id])
  receiverId Int
  content    String
  read       Boolean  @default(false)
  auction    Auction? @relation(fields: [auctionId], references: [id], onDelete: Cascade)
  auctionId  Int?
  createdAt  DateTime @default(now())
}
```

## Deployment Checklist

- [ ] Update `JWT_SECRET` to strong random value
- [ ] Set `NEXT_PUBLIC_APP_URL` to production domain
- [ ] Use custom server setup for production
- [ ] Configure CORS origins in Socket.IO config
- [ ] Set up message persistence backup (optional)
- [ ] Monitor Socket.IO server with appropriate logging
- [ ] Configure load balancer for WebSocket support
- [ ] Test reconnection scenarios
- [ ] Monitor memory usage under load

## Troubleshooting

### Connection Issues

**Socket fails to connect:**
- Verify `NEXT_PUBLIC_APP_URL` is correct
- Check JWT token is valid and not expired
- Ensure Socket.IO server is running
- Check browser console for CORS errors

**Messages not sending:**
- Verify socket is connected (`isConnected === true`)
- Check token is still valid
- Ensure receiver ID is correct

### Performance

**High memory usage:**
- Check for connection leaks (ensure cleanup)
- Monitor active user sessions
- Consider using message queue (Redis) for production

**Typing indicators laggy:**
- Normal on slow connections
- 3-second timeout auto-clears on client
- Consider reducing frequency if needed

## Future Enhancements

1. **Message Typing Persistence**: Save draft messages
2. **Message Reactions**: Emoji reactions to messages
3. **File Sharing**: Image/file uploads in chat
4. **Voice Messages**: Audio message support
5. **Message Search**: Full-text search in conversations
6. **Group Chat**: Multi-user conversations
7. **Encryption**: End-to-end message encryption
8. **Presence Tracking**: Last seen timestamp
9. **Message Editing**: Edit sent messages
10. **Message Pinning**: Pin important messages
