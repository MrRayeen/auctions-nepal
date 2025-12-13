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

// GET: List favorites for current user
export async function GET(req: NextRequest) {
  const userId = getUserIdFromRequest(req);
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const favorites = await (prisma as any).favorite.findMany({
      where: { userId },
      include: {
        auction: {
          select: {
            id: true,
            title: true,
            slug: true,
            imageUrl: true,
            currentPrice: true,
            startingPrice: true,
            endTime: true,
            seller: {
              select: {
                id: true,
                name: true,
                email: true,
                kycStatus: true,
              },
            },
            bids: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Extract auction data directly from favorites for profile page
    const favoritesData = favorites.map(fav => fav.auction);
    return NextResponse.json({ favorites: favoritesData });
  } catch (error) {
    console.error('Error fetching favorites:', error);
    return NextResponse.json({ error: 'Failed to fetch favorites' }, { status: 500 });
  }
}

// POST: Toggle favorite for an auction
export async function POST(req: NextRequest) {
  const userId = getUserIdFromRequest(req);
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { auctionId } = await req.json();

    if (!auctionId) {
      return NextResponse.json({ error: 'Missing auctionId' }, { status: 400 });
    }

    // Check if favorite exists
    const existing = await (prisma as any).favorite.findUnique({
      where: {
        userId_auctionId: { userId, auctionId },
      },
    });

    if (existing) {
      // Remove favorite
      await (prisma as any).favorite.delete({
        where: {
          userId_auctionId: { userId, auctionId },
        },
      });
      return NextResponse.json({ favorited: false });
    } else {
      // Add favorite
      await (prisma as any).favorite.create({
        data: { userId, auctionId },
      });
      return NextResponse.json({ favorited: true });
    }
  } catch (error) {
    console.error('Error toggling favorite:', error);
    return NextResponse.json({ error: 'Failed to toggle favorite' }, { status: 500 });
  }
}
