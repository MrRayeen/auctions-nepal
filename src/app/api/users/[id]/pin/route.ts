import { NextResponse, NextRequest } from 'next/server';
import { hash, compare } from 'bcryptjs';
import prisma from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, pin, oldPin } = body;

    if (!userId || !pin) {
      return NextResponse.json(
        { error: 'userId and pin are required' },
        { status: 400 }
      );
    }

    // Validate PIN format (4 digits)
    if (!/^\d{4}$/.test(pin)) {
      return NextResponse.json(
        { error: 'PIN must be exactly 4 digits' },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: parseInt(userId) },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // If updating existing PIN, verify old PIN
    if (user.pin && oldPin) {
      const isValidOldPin = await compare(oldPin, user.pin);
      if (!isValidOldPin) {
        return NextResponse.json(
          { error: 'Current PIN is incorrect' },
          { status: 401 }
        );
      }
    }

    // Hash new PIN
    const hashedPin = await hash(pin, 10);

    const updatedUser = await prisma.user.update({
      where: { id: parseInt(userId) },
      data: { pin: hashedPin },
      select: {
        id: true,
        email: true,
        name: true,
        fullName: true,
        pin: true, // Don't actually return the hash
      },
    });

    return NextResponse.json(
      {
        message: 'PIN set successfully',
        pinSet: !!hashedPin,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error setting PIN:', error);
    return NextResponse.json(
      { error: 'Failed to set PIN' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, pin } = body;

    if (!userId || !pin) {
      return NextResponse.json(
        { error: 'userId and pin are required' },
        { status: 400 }
      );
    }

    // Validate PIN format
    if (!/^\d{4}$/.test(pin)) {
      return NextResponse.json(
        { error: 'PIN must be exactly 4 digits' },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: parseInt(userId) },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    if (!user.pin) {
      return NextResponse.json(
        { error: 'No PIN set for this user' },
        { status: 400 }
      );
    }

    // Verify PIN
    const isValidPin = await compare(pin, user.pin);

    return NextResponse.json(
      {
        valid: isValidPin,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error verifying PIN:', error);
    return NextResponse.json(
      { error: 'Failed to verify PIN' },
      { status: 500 }
    );
  }
}
