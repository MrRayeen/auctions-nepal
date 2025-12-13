import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";

// Check if request is from admin
function isAdminRequest(request: NextRequest): boolean {
  const adminToken = request.headers.get("x-admin-token");
  return adminToken === Buffer.from(`potato:${adminToken?.split(":")[1] || ""}`).toString("base64");
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Verify admin authentication
    if (!isAdminRequest(request)) {
      return NextResponse.json(
        { error: "Unauthorized: Admin access required" },
        { status: 401 }
      );
    }

    const auctionId = parseInt(params.id);

    if (isNaN(auctionId)) {
      return NextResponse.json(
        { error: "Invalid auction ID" },
        { status: 400 }
      );
    }

    // Check if auction exists
    const auction = await prisma.auction.findUnique({
      where: { id: auctionId },
    });

    if (!auction) {
      return NextResponse.json(
        { error: "Auction not found" },
        { status: 404 }
      );
    }

    // Delete auction (cascade delete will handle bids through Prisma relations)
    const deletedAuction = await prisma.auction.delete({
      where: { id: auctionId },
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
    console.error("Error deleting auction:", error);
    return NextResponse.json(
      { error: "Failed to delete auction" },
      { status: 500 }
    );
  }
}
