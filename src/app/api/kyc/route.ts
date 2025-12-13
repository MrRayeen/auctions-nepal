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

// GET: Fetch KYC status for current user
export async function GET(req: NextRequest) {
  const userId = getUserIdFromRequest(req);
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const user = await (prisma as any).user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        kycStatus: true,
        currentAddress: true,
        permanentAddress: true,
        citizenshipFront: true,
        citizenshipBack: true,
        selfieWithCitizenship: true,
        kycSubmittedAt: true,
        kycVerifiedAt: true,
        kycRejectionReason: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json(user);
  } catch (err) {
    console.error('Error fetching KYC:', err);
    return NextResponse.json({ error: 'Failed to fetch KYC data' }, { status: 500 });
  }
}

// POST: Submit KYC verification
export async function POST(req: NextRequest) {
  const userId = getUserIdFromRequest(req);
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const {
      currentAddress,
      permanentAddress,
      citizenshipFront,
      citizenshipBack,
      selfieWithCitizenship,
    } = await req.json();

    if (!currentAddress || !permanentAddress || !citizenshipFront || !citizenshipBack || !selfieWithCitizenship) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const user = await (prisma as any).user.update({
      where: { id: userId },
      data: {
        kycStatus: 'PENDING',
        currentAddress,
        permanentAddress,
        citizenshipFront,
        citizenshipBack,
        selfieWithCitizenship,
        kycSubmittedAt: new Date(),
      },
      select: {
        id: true,
        kycStatus: true,
        kycSubmittedAt: true,
      },
    });

    return NextResponse.json({
      message: 'KYC submitted successfully',
      user,
    });
  } catch (err) {
    console.error('Error submitting KYC:', err);
    return NextResponse.json({ error: 'Failed to submit KYC' }, { status: 500 });
  }
}
