import prisma from "@/lib/db";
import { NextResponse } from "next/server";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const auctionId = parseInt(id);
    const body = await request.json();
    const { userId, ipAddress } = body;

    // Create or update view
    const view = await prisma.auctionView.upsert({
      where: userId
        ? { auctionId_userId: { auctionId, userId } }
        : { auctionId_ipAddress: { auctionId, ipAddress: ipAddress || "" } },
      create: {
        auctionId,
        userId: userId || null,
        ipAddress: ipAddress || null,
      },
      update: {
        viewedAt: new Date(),
      },
    });

    return NextResponse.json({ success: true, view }, { status: 201 });
  } catch (error) {
    console.error("Error recording view:", error);
    return NextResponse.json(
      { error: "Failed to record view" },
      { status: 500 }
    );
  }
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const auctionId = parseInt(id);

    // Get count of unique views
    const viewCount = await prisma.auctionView.count({
      where: { auctionId },
    });

    return NextResponse.json({ viewCount }, { status: 200 });
  } catch (error) {
    console.error("Error fetching view count:", error);
    return NextResponse.json(
      { error: "Failed to fetch view count" },
      { status: 500 }
    );
  }
}

