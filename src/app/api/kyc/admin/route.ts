import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';

const ADMIN_TOKEN = process.env.ADMIN_TOKEN || 'admin-secret-key';

function verifyAdminToken(req: NextRequest): boolean {
  const token = req.headers.get('x-admin-token');
  const isValid = token === ADMIN_TOKEN;
  if (!isValid) {
    console.log('KYC Admin Auth Failed:', { 
      received: token, 
      expected: ADMIN_TOKEN, 
      tokenLength: token?.length || 0,
      expectedLength: ADMIN_TOKEN.length,
      receivedType: typeof token,
    });
  }
  return isValid;
}

// GET: Fetch all pending KYC submissions
export async function GET(req: NextRequest) {
  if (!verifyAdminToken(req)) {
    return NextResponse.json({ error: 'Unauthorized', message: 'Invalid admin token' }, { status: 401 });
  }

  try {
    const submissions = await (prisma as any).user.findMany({
      where: {
        kycStatus: {
          in: ['PENDING', 'VERIFIED', 'REJECTED'],
        },
      },
      select: {
        id: true,
        email: true,
        name: true,
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
      orderBy: { kycSubmittedAt: 'desc' },
    });

    // Log to identify any null or empty publicIds
    submissions.forEach((sub: any) => {
      if (!sub.citizenshipFront || !sub.citizenshipBack || !sub.selfieWithCitizenship) {
        console.warn(`User ${sub.id} has missing KYC documents:`, {
          citizenshipFront: sub.citizenshipFront || 'NULL',
          citizenshipBack: sub.citizenshipBack || 'NULL',
          selfieWithCitizenship: sub.selfieWithCitizenship || 'NULL',
        });
      }
    });

    return NextResponse.json(submissions);
  } catch (err) {
    console.error('Error fetching KYC submissions:', err);
    return NextResponse.json({ error: 'Failed to fetch submissions' }, { status: 500 });
  }
}

// PATCH: Verify or reject KYC submission
export async function PATCH(req: NextRequest) {
  if (!verifyAdminToken(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { userId, action, rejectionReason } = await req.json();

    if (!userId || !action || !['VERIFY', 'REJECT'].includes(action)) {
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
    }

    const updateData: any = {
      kycStatus: action === 'VERIFY' ? 'VERIFIED' : 'REJECTED',
      kycVerifiedAt: action === 'VERIFY' ? new Date() : null,
    };

    if (action === 'REJECT' && rejectionReason) {
      updateData.kycRejectionReason = rejectionReason;
    }

    const user = await (prisma as any).user.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        email: true,
        kycStatus: true,
      },
    });

    return NextResponse.json({
      message: `KYC ${action === 'VERIFY' ? 'verified' : 'rejected'} successfully`,
      user,
    });
  } catch (err) {
    console.error('Error updating KYC:', err);
    return NextResponse.json({ error: 'Failed to update KYC' }, { status: 500 });
  }
}
