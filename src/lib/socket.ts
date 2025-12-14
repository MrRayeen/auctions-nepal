/**
 * Socket.IO Server Configuration
 * Handles real-time chat with JWT authentication and scalable architecture
 */

import { Server as HTTPServer } from 'http';
import { Server, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import prisma from './db';
import { sanitizeUserName, sanitizeMessage } from './sanitize';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// Type definitions
export interface AuthenticatedSocket extends Socket {
  userId?: number;
  userName?: string;
  userEmail?: string;
  activeChats?: Set<number>; // Set of user IDs in active conversation
}

interface MessagePayload {
  receiverId: number;
  content: string;
  auctionId?: number;
}

interface TypingPayload {
  receiverId: number;
}

// Active users tracking for scalability
const activeUsers = new Map<number, Set<string>>();

/**
 * Initialize Socket.IO server with custom authentication
 * @param server - HTTP server instance
 * @returns Configured Socket.IO server
 */
export function initializeSocketIO(server: HTTPServer): Server {
  const io = new Server(server, {
    cors: {
      origin: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
      credentials: true,
    },
    transports: ['websocket', 'polling'],
    // Optimization settings for scalability
    pingInterval: 25000,
    pingTimeout: 20000,
    maxHttpBufferSize: 1e6, // 1MB max message size
    allowUpgrades: true,
    serveClient: false, // Client handles Socket.IO client library
  });

  // Custom authentication middleware
  io.use((socket: AuthenticatedSocket, next) => {
    const token = socket.handshake.auth.token;

    if (!token) {
      return next(new Error('Authentication error: No token provided'));
    }

    try {
      const decoded = jwt.verify(token, JWT_SECRET) as any;
      socket.userId = decoded.userId;
      socket.userName = decoded.name || decoded.email?.split('@')[0] || 'User';
      socket.userEmail = decoded.email;
      socket.activeChats = new Set();
      next();
    } catch (err) {
      next(new Error('Authentication error: Invalid token'));
    }
  });

  // Handle client connections
  io.on('connection', (socket: AuthenticatedSocket) => {
    const userId = socket.userId!;

    // Track active user sessions
    if (!activeUsers.has(userId)) {
      activeUsers.set(userId, new Set());
    }
    activeUsers.get(userId)!.add(socket.id);

    // Broadcast user online status
    io.emit('user:online', { userId, userName: socket.userName });

    // Handle joining a specific chat room
    socket.on('chat:join', (receiverId: number) => {
      const roomName = getRoomName(userId, receiverId);
      socket.join(roomName);
      socket.activeChats?.add(receiverId);

      // Notify the other user that someone joined
      socket.to(roomName).emit('chat:user-active', { userId, userName: sanitizeUserName(socket.userName || 'User') });
      
      // Send current user's status to the other user in the room
      io.to(roomName).emit('user:status-sync', { userId, isOnline: true, userName: sanitizeUserName(socket.userName || 'User') });
    });

    // Handle leaving a chat room
    socket.on('chat:leave', (receiverId: number) => {
      const roomName = getRoomName(userId, receiverId);
      
      // Check if user has other sockets in this room
      const roomSockets = io.sockets.adapter.rooms.get(roomName);
      let userHasOtherSockets = false;
      
      if (roomSockets) {
        for (const socketId of roomSockets) {
          if (socketId !== socket.id) {
            const sock = io.sockets.sockets.get(socketId) as AuthenticatedSocket;
            if (sock?.userId === userId) {
              userHasOtherSockets = true;
              break;
            }
          }
        }
      }
      
      socket.leave(roomName);
      socket.activeChats?.delete(receiverId);

      // Only notify offline if user has no other sockets in this room
      if (!userHasOtherSockets) {
        io.to(roomName).emit('user:status-sync', { userId, isOnline: false });
      }
    });

    // Handle sending messages
    socket.on('message:send', async (payload: MessagePayload) => {
      try {
        const { receiverId, content, auctionId } = payload;

        // Validate payload
        if (!receiverId || !content || !content.trim()) {
          socket.emit('error', { message: 'Invalid message payload' });
          return;
        }

        if (content.length > 5000) {
          socket.emit('error', { message: 'Message too long (max 5000 characters)' });
          return;
        }

        // Build message data, only including auctionId if it's defined
        const messageData: any = {
          senderId: userId,
          receiverId,
          content: content.trim(),
        };

        // Only add auctionId if it's provided and valid
        if (auctionId && auctionId > 0) {
          messageData.auctionId = auctionId;
        }

        // Save message to database
        const message = await prisma.message.create({
          data: messageData,
          include: {
            sender: { select: { id: true, name: true, email: true } },
          },
        });

        const roomName = getRoomName(userId, receiverId);

        // Emit to all users in the chat room
        io.to(roomName).emit('message:new', {
          id: message.id,
          content: message.content,
          senderId: message.senderId,
          receiverId: message.receiverId,
          createdAt: message.createdAt.toISOString(),
          read: false,
          senderName: sanitizeUserName(message.sender.name || message.sender.email?.split('@')[0] || 'User'),
        });

        // Notify receiver if not in chat (via their other connections)
        const receiverSessions = activeUsers.get(receiverId) || new Set();
        let isReceiverInChat = false;

        for (const sessionId of receiverSessions) {
          const sessionSocket = io.sockets.sockets.get(sessionId) as AuthenticatedSocket;
          if (sessionSocket?.activeChats?.has(userId)) {
            isReceiverInChat = true;
            break;
          }
        }

        // Send notification if receiver is not actively viewing this chat
        if (!isReceiverInChat) {
          io.to([...receiverSessions]).emit('notification:unread', {
            senderId: userId,
            senderName: sanitizeUserName(socket.userName || 'User'),
            count: await getUnreadCount(receiverId, userId),
          });
        }
      } catch (error) {
        console.error('Error sending message:', error);
        socket.emit('error', { message: 'Failed to send message' });
      }
    });

    // Handle typing indicators
    socket.on('typing:start', (payload: TypingPayload) => {
      const { receiverId } = payload;
      const roomName = getRoomName(userId, receiverId);

      socket.to(roomName).emit('typing:active', {
        userId,
        userName: socket.userName,
      });
    });

    socket.on('typing:stop', (payload: TypingPayload) => {
      const { receiverId } = payload;
      const roomName = getRoomName(userId, receiverId);

      socket.to(roomName).emit('typing:inactive', {
        userId,
      });
    });

    // Handle message read receipts
    socket.on('message:read', async (payload: { receiverId: number; auctionId?: number }) => {
      try {
        const { receiverId, auctionId } = payload;
        const where: any = {
          senderId: receiverId,
          receiverId: userId,
          read: false,
        };

        if (auctionId) where.auctionId = auctionId;

        await prisma.message.updateMany({
          where,
          data: { read: true },
        });

        // Notify the sender that messages were read
        const roomName = getRoomName(userId, receiverId);
        io.to(roomName).emit('message:read-receipt', {
          readBy: userId,
        });
      } catch (error) {
        console.error('Error marking messages as read:', error);
      }
    });

    // Handle disconnection
    socket.on('disconnect', () => {
      const userSessions = activeUsers.get(userId);

      if (userSessions) {
        userSessions.delete(socket.id);

        // If user has no more active sessions, broadcast offline
        if (userSessions.size === 0) {
          activeUsers.delete(userId);
          io.emit('user:offline', { userId });
        }
      }
    });

    // Handle errors
    socket.on('error', (error) => {
      console.error(`Socket error for user ${userId}:`, error);
    });
  });

  return io;
}

/**
 * Generate consistent room name for two users
 * Ensures both users join the same room regardless of conversation direction
 */
function getRoomName(userId1: number, userId2: number): string {
  const [smaller, larger] = userId1 < userId2 ? [userId1, userId2] : [userId2, userId1];
  return `chat:${smaller}:${larger}`;
}

/**
 * Get unread message count from a specific user
 */
async function getUnreadCount(receiverId: number, senderId: number): Promise<number> {
  return await prisma.message.count({
    where: {
      senderId,
      receiverId,
      read: false,
    },
  });
}

/**
 * Get all unread message counts for a user
 */
export async function getUnreadCounts(
  userId: number
): Promise<Record<number, number>> {
  const unreadMessages = await prisma.message.groupBy({
    by: ['senderId'],
    where: {
      receiverId: userId,
      read: false,
    },
    _count: {
      id: true,
    },
  });

  const counts: Record<number, number> = {};
  for (const { senderId, _count } of unreadMessages) {
    counts[senderId] = _count.id;
  }

  return counts;
}

/**
 * Utility to emit message to a specific user
 * Useful for notifications from server
 */
export function emitToUser(io: Server, userId: number, event: string, data: any) {
  const userSessions = activeUsers.get(userId);
  if (userSessions) {
    for (const socketId of userSessions) {
      io.to(socketId).emit(event, data);
    }
  }
}
