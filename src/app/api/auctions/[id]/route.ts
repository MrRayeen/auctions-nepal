import prisma from '@/lib/db';
import { NextResponse } from 'next/server';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: idString } = await params;
    const id = parseInt(idString);

    if (isNaN(id)) {
      console.error(`Invalid auction ID: ${idString}`);
      return NextResponse.json({ error: 'Invalid auction ID' }, { status: 400 });
    }

    console.log(`Fetching auction with id: ${id}`);

    const auction = await prisma.auction.findUnique({
      where: { id },
      include: {
        seller: {
          select: {
            id: true,
            name: true,
            email: true,
            kycStatus: true,
          },
        },
        bids: {
          include: {
            bidder: {
              select: {
                id: true,
                name: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
        },
        images: {
          orderBy: { order: 'asc' },
        },
      },
    });

    if (!auction) {
      console.warn(`Auction not found with id: ${id}`);
      return NextResponse.json({ error: 'Auction not found' }, { status: 404 });
    }

    return NextResponse.json(auction);
  } catch (error) {
    console.error('Error fetching auction:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: idString } = await params;
    const id = parseInt(idString);
    const body = await request.json();
    const { title, description, startingPrice, currentPrice, minIncrement, endTime, tags, status } = body;

    // Fetch the auction with its bids to check constraints
    const auction = await prisma.auction.findUnique({
      where: { id },
      include: { bids: true },
    });

    if (!auction) {
      return NextResponse.json(
        { error: 'Auction not found' },
        { status: 404 }
      );
    }

    // Can only update price/startingPrice if no bids exist
    const canUpdatePrice = auction.bids.length === 0;

    const updateData: any = {};

    // Update basic fields
    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (minIncrement !== undefined) updateData.minIncrement = minIncrement;
    if (endTime !== undefined) updateData.endTime = new Date(endTime);
    if (tags !== undefined) updateData.tags = tags;
    if (status !== undefined) updateData.status = status;

    // Only update price fields if no bids have been placed
    if (canUpdatePrice) {
      if (startingPrice !== undefined) updateData.startingPrice = startingPrice;
      if (currentPrice !== undefined) updateData.currentPrice = currentPrice;
    }

    const updatedAuction = await prisma.auction.update({
      where: { id },
      data: updateData,
      include: {
        images: { orderBy: { order: 'asc' } },
        seller: { select: { id: true, name: true, email: true, kycStatus: true } },
        bids: { orderBy: { createdAt: 'desc' } },
      },
    });

    return NextResponse.json(updatedAuction);
  } catch (error) {
    console.error('Error updating auction:', error);
    return NextResponse.json({ error: 'Failed to update auction' }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Verify admin token
    const adminToken = request.headers.get('x-admin-token');
    if (!adminToken || adminToken !== 'admin-secret-key') {
      return NextResponse.json(
        { error: 'Unauthorized: Admin access required' },
        { status: 401 }
      );
    }

    const { id: idString } = await params;
    const id = parseInt(idString);

    if (isNaN(id)) {
      return NextResponse.json(
        { error: 'Invalid auction ID' },
        { status: 400 }
      );
    }

    // Check if auction exists
    const auction = await prisma.auction.findUnique({
      where: { id },
    });

    if (!auction) {
      return NextResponse.json(
        { error: 'Auction not found' },
        { status: 404 }
      );
    }

    // Delete auction (cascade delete will handle bids)
    const deletedAuction = await prisma.auction.delete({
      where: { id },
    });

    return NextResponse.json(
      {
        success: true,
        message: `Auction "${deletedAuction.title}" has been deleted`,
        auctionId: deletedAuction.id,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error deleting auction:', error);
    return NextResponse.json(
      { error: 'Failed to delete auction' },
      { status: 500 }
    );
  }
}
