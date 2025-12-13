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

// GET: List messages between current user and another user (optionally filtered by auction)
export async function GET(req: NextRequest) {
  const userId = getUserIdFromRequest(req);
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const { searchParams } = new URL(req.url);
  const otherUserId = parseInt(searchParams.get('userId') || '');
  const auctionId = searchParams.get('auctionId') ? parseInt(searchParams.get('auctionId')!) : undefined;
  if (!otherUserId) {
    return NextResponse.json({ error: 'Missing userId' }, { status: 400 });
  }
  const where: any = {
    OR: [
      { senderId: userId, receiverId: otherUserId },
      { senderId: otherUserId, receiverId: userId },
    ],
  };
  if (auctionId) where.auctionId = auctionId;
  const messages = await (prisma as any).message.findMany({
    where,
    orderBy: { createdAt: 'asc' },
  });
  return NextResponse.json(messages);
}

// POST: Send a message
export async function POST(req: NextRequest) {
  const userId = getUserIdFromRequest(req);
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const { receiverId, content, auctionId } = await req.json();
  if (!receiverId || !content) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
  }
  const message = await (prisma as any).message.create({
    data: {
      senderId: userId,
      receiverId,
      content,
      auctionId,
    },
  });
  return NextResponse.json(message);
}

// PATCH: Mark messages as read
export async function PATCH(req: NextRequest) {
  const myUserId = getUserIdFromRequest(req);
  if (!myUserId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const { userId, auctionId } = await req.json();
  if (!userId) {
    return NextResponse.json({ error: 'Missing userId' }, { status: 400 });
  }
  const where: any = {
    senderId: userId,
    receiverId: myUserId,
    read: false,
  };
  if (auctionId) where.auctionId = auctionId;
  await (prisma as any).message.updateMany({
    where,
    data: { read: true },
  });
  return NextResponse.json({ success: true });
}
