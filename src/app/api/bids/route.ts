import prisma from '@/lib/db';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const bidderId = searchParams.get('bidderId');
    const limit = parseInt(searchParams.get('limit') || '10');
    const skip = parseInt(searchParams.get('skip') || '0');

    if (!bidderId) {
      return NextResponse.json(
        { error: 'bidderId is required' },
        { status: 400 }
      );
    }

    const bids = await prisma.bid.findMany({
      where: {
        bidderId: parseInt(bidderId),
      },
      include: {
        auction: {
          select: {
            id: true,
            title: true,
            currentPrice: true,
            endTime: true,
          },
        },
        bidder: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: skip,
    });

    // Determine if each bid is winning (highest bid for that auction)
    const bidsWithWinningStatus = await Promise.all(
      bids.map(async (bid) => {
        const highestBid = await prisma.bid.findFirst({
          where: { auctionId: bid.auctionId },
          orderBy: { amount: 'desc' },
        });

        return {
          ...bid,
          isWinning: bid.id === highestBid?.id,
        };
      })
    );

    const total = await prisma.bid.count({
      where: {
        bidderId: parseInt(bidderId),
      },
    });

    return NextResponse.json({ bids: bidsWithWinningStatus, total }, { status: 200 });
  } catch (error) {
    console.error('Error fetching bids:', error);
    return NextResponse.json(
      { error: 'Failed to fetch bids' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { auctionId, bidderId, amount } = body;

    // Verify bid is higher than current price
    const auction = await prisma.auction.findUnique({
      where: { id: auctionId },
      include: { bids: true },
    });

    if (!auction) {
      return NextResponse.json({ error: 'Auction not found' }, { status: 404 });
    }

    // Prevent seller from bidding on their own auction
    if (auction.sellerId === bidderId) {
      return NextResponse.json(
        { error: 'Sellers cannot bid on their own listings' },
        { status: 403 }
      );
    }

    // Check if there are bids above the starting price
    const hasBidsAboveStart = auction.bids.filter(bid => bid.amount > auction.startingPrice).length > 0;

    // If there are bids above starting price, new bid must exceed current price
    // If no bids above starting price yet, allow under-bidding (negotiation mode)
    if (hasBidsAboveStart) {
      if (amount <= auction.currentPrice) {
        return NextResponse.json(
          { error: 'Bid must be higher than current price' },
          { status: 400 }
        );
      }
    } else {
      // Under-bidding allowed, but amount must be positive
      if (amount < 0) {
        return NextResponse.json(
          { error: 'Bid amount must be positive' },
          { status: 400 }
        );
      }
    }

    // Create bid
    const bid = await prisma.bid.create({
      data: {
        amount,
        auctionId,
        bidderId,
      },
      include: {
        bidder: true,
      },
    });

    // Update auction current price
    await prisma.auction.update({
      where: { id: auctionId },
      data: { currentPrice: amount },
    });

    return NextResponse.json(bid, { status: 201 });
  } catch (error) {
    console.error('Error creating bid:', error);
    return NextResponse.json({ error: 'Failed to create bid' }, { status: 500 });
  }
}
