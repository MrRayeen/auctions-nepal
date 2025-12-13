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

// GET: List reports (admin only - check token)
export async function GET(req: NextRequest) {
  const adminToken = req.headers.get('x-admin-token');
  if (!adminToken || adminToken !== 'admin-secret-key') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const status = req.nextUrl.searchParams.get('status') || 'PENDING';

    const reports = await (prisma as any).report.findMany({
      where: status ? { status } : undefined,
      include: {
        auction: {
          select: {
            id: true,
            title: true,
            slug: true,
            currentPrice: true,
            seller: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
        reporter: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(reports);
  } catch (error) {
    console.error('Error fetching reports:', error);
    return NextResponse.json({ error: 'Failed to fetch reports' }, { status: 500 });
  }
}

// POST: Create a report
export async function POST(req: NextRequest) {
  const userId = getUserIdFromRequest(req);
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { auctionId, reason, description } = await req.json();

    if (!auctionId || !reason) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Check if auction exists
    const auction = await prisma.auction.findUnique({ where: { id: auctionId } });
    if (!auction) {
      return NextResponse.json({ error: 'Auction not found' }, { status: 404 });
    }

    // Check if already reported by this user
    const existing = await (prisma as any).report.findUnique({
      where: {
        auctionId_reporterId: { auctionId, reporterId: userId },
      },
    });

    if (existing) {
      return NextResponse.json(
        { error: 'You have already reported this listing' },
        { status: 400 }
      );
    }

    // Create report
    const report = await (prisma as any).report.create({
      data: {
        auctionId,
        reporterId: userId,
        reason,
        description: description || null,
      },
      include: {
        auction: true,
        reporter: true,
      },
    });

    return NextResponse.json(report, { status: 201 });
  } catch (error) {
    console.error('Error creating report:', error);
    return NextResponse.json({ error: 'Failed to create report' }, { status: 500 });
  }
}

// PATCH: Update report status (admin only)
export async function PATCH(req: NextRequest) {
  const adminToken = req.headers.get('x-admin-token');
  if (!adminToken || adminToken !== 'admin-secret-key') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { reportId, status } = await req.json();

    if (!reportId || !status) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const report = await (prisma as any).report.update({
      where: { id: reportId },
      data: { status },
      include: {
        auction: true,
        reporter: true,
      },
    });

    return NextResponse.json(report);
  } catch (error) {
    console.error('Error updating report:', error);
    return NextResponse.json({ error: 'Failed to update report' }, { status: 500 });
  }
}
