import { NextResponse, NextRequest } from 'next/server';
import prisma from '@/lib/db';

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const auctionId = parseInt(id);
    const body = await request.json();
    const { title, description, category, subCategory, startingPrice, currentPrice, minIncrement, endTime, tags, delivery, status } = body;

    const auction = await prisma.auction.findUnique({
      where: { id: auctionId },
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

    const updateData: any = {
      title,
      description,
      category: category || null,
      subCategory: subCategory || null,
      minIncrement,
      endTime: new Date(endTime),
      tags,
      delivery: delivery || "Not Available",
      status,
    };

    // Only update price fields if no bids have been placed
    if (canUpdatePrice) {
      if (startingPrice !== undefined) updateData.startingPrice = startingPrice;
      if (currentPrice !== undefined) updateData.currentPrice = currentPrice;
    }

    const updatedAuction = await prisma.auction.update({
      where: { id: auctionId },
      data: updateData,
      include: {
        images: { orderBy: { order: 'asc' } },
        seller: { select: { id: true, name: true, email: true } },
        bids: { orderBy: { createdAt: 'desc' } },
      },
    });

    return NextResponse.json(updatedAuction, { status: 200 });
  } catch (error) {
    console.error('Error updating auction:', error);
    return NextResponse.json(
      { error: 'Failed to update auction' },
      { status: 500 }
    );
  }
}
