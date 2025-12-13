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

// GET: Fetch auto-bid for user on an auction
export async function GET(req: NextRequest) {
  const userId = getUserIdFromRequest(req);
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const auctionId = parseInt(req.nextUrl.searchParams.get('auctionId') || '');

    if (!auctionId) {
      return NextResponse.json({ error: 'Missing auctionId' }, { status: 400 });
    }

    const autoBid = await (prisma as any).autoBid.findUnique({
      where: {
        auctionId_bidderId: { auctionId, bidderId: userId },
      },
    });

    return NextResponse.json({ autoBid: autoBid || null });
  } catch (error) {
    console.error('Error fetching auto-bid:', error);
    return NextResponse.json({ error: 'Failed to fetch auto-bid' }, { status: 500 });
  }
}

// POST: Create or update auto-bid
export async function POST(req: NextRequest) {
  const userId = getUserIdFromRequest(req);
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { auctionId, maxBidAmount, enabled } = await req.json();

    if (!auctionId || maxBidAmount === undefined) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    if (maxBidAmount <= 0) {
      return NextResponse.json(
        { error: 'Max bid amount must be positive' },
        { status: 400 }
      );
    }

    // Check if auction exists
    const auction = await prisma.auction.findUnique({
      where: { id: auctionId },
      select: { currentPrice: true, id: true },
    });

    if (!auction) {
      return NextResponse.json({ error: 'Auction not found' }, { status: 404 });
    }

    if (maxBidAmount < auction.currentPrice) {
      return NextResponse.json(
        { error: 'Max bid must be greater than current price' },
        { status: 400 }
      );
    }

    // Upsert auto-bid
    const autoBid = await (prisma as any).autoBid.upsert({
      where: {
        auctionId_bidderId: { auctionId, bidderId: userId },
      },
      update: {
        maxBidAmount,
        enabled: enabled !== undefined ? enabled : true,
      },
      create: {
        auctionId,
        bidderId: userId,
        maxBidAmount,
        enabled: enabled !== undefined ? enabled : true,
      },
    });

    return NextResponse.json(autoBid, { status: 201 });
  } catch (error) {
    console.error('Error creating/updating auto-bid:', error);
    return NextResponse.json({ error: 'Failed to manage auto-bid' }, { status: 500 });
  }
}

// DELETE: Remove auto-bid
export async function DELETE(req: NextRequest) {
  const userId = getUserIdFromRequest(req);
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const auctionId = parseInt(req.nextUrl.searchParams.get('auctionId') || '');

    if (!auctionId) {
      return NextResponse.json({ error: 'Missing auctionId' }, { status: 400 });
    }

    await (prisma as any).autoBid.delete({
      where: {
        auctionId_bidderId: { auctionId, bidderId: userId },
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting auto-bid:', error);
    return NextResponse.json({ error: 'Failed to delete auto-bid' }, { status: 500 });
  }
}
