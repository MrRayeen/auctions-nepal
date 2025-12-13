import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

function getUserIdFromRequest(req: NextRequest): number | null {
  const auth = req.headers.get('authorization');
  if (!auth || !auth.startsWith('Bearer ')) return null;
  const token = auth.replace('Bearer ', '');
  try {
    const payload = jwt.verify(token, JWT_SECRET) as any;
    return payload.userId;
  } catch {
    return null;
  }
}

export async function GET(req: NextRequest) {
  const userId = getUserIdFromRequest(req);
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Get all messages involving the current user, grouped by the other user
    const messages = await (prisma as any).message.findMany({
      where: {
        OR: [{ senderId: userId }, { receiverId: userId }],
      },
      include: {
        sender: { select: { id: true, name: true, email: true } },
        receiver: { select: { id: true, name: true, email: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Group messages by conversation partner
    const conversationMap = new Map<
      number,
      {
        user: { id: number; name?: string; email: string };
        lastMessage: string;
        timestamp: string;
        unread: number;
      }
    >();

    for (const msg of messages) {
      const otherUser = msg.senderId === userId ? msg.receiver : msg.sender;
      const key = otherUser.id;

      if (!conversationMap.has(key)) {
        const unreadCount = await (prisma as any).message.count({
          where: {
            senderId: otherUser.id,
            receiverId: userId,
            read: false,
          },
        });

        conversationMap.set(key, {
          user: otherUser,
          lastMessage: msg.content,
          timestamp: new Date(msg.createdAt).toLocaleString('en-US', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            hour12: true,
          }),
          unread: unreadCount,
        });
      }
    }

    const conversations = Array.from(conversationMap.values()).map((conv, idx) => ({
      id: idx,
      ...conv,
    }));

    return NextResponse.json(conversations);
  } catch (err) {
    console.error('Error fetching conversations:', err);
    return NextResponse.json({ error: 'Failed to fetch conversations' }, { status: 500 });
  }
}
