import prisma from '@/lib/db';
import { NextResponse } from 'next/server';
import { generateSlug, ensureUniqueSlug } from '@/lib/slug';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '10');
    const skip = parseInt(searchParams.get('skip') || '0');
    const search = searchParams.get('search') || '';
    const sellerId = searchParams.get('sellerId');
    const category = searchParams.get('category') || '';
    const subCategory = searchParams.get('subCategory') || '';

    // Build where clause
    const where: any = {};
    
    if (search) {
      where.OR = [
        { title: { contains: search } },
        { description: { contains: search } },
      ];
    }

    if (sellerId) {
      where.sellerId = parseInt(sellerId);
    }

    // Category filters (safe for existing rows without category)
    if (category) {
      where.category = category;
    }

    if (subCategory) {
      where.subCategory = subCategory;
    }

    // SQLite doesn't support mode: 'insensitive', so we filter in application
    const auctions = await prisma.auction.findMany({
      where: where,
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
          orderBy: { createdAt: 'desc' },
          take: 1,
          select: {
            amount: true,
            bidder: {
              select: {
                name: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: skip,
    });

    const total = await prisma.auction.count({ where });

    return NextResponse.json({
      auctions,
      total,
      limit,
      skip,
    });
  } catch (error) {
    console.error('Error fetching auctions:', error);
    return NextResponse.json({ error: 'Failed to fetch auctions' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { title, description, startingPrice, minIncrement, startTime, endTime, imageUrl, sellerId, tags, images, category, subCategory } = body;

    // Generate slug from title
    const baseSlug = generateSlug(title);
    const slug = await ensureUniqueSlug(baseSlug, prisma);

    const auctionData: any = {
      title,
      description,
      slug,
      category: category || null,
      subCategory: subCategory || null,
      startingPrice,
      currentPrice: startingPrice,
      minIncrement: minIncrement || 100,
      startTime: new Date(startTime),
      endTime: new Date(endTime),
      imageUrl,
      tags: tags || null,
      sellerId,
    };

    // Add images if provided
    if (images && images.length > 0) {
      auctionData.images = {
        create: images.map((img: any, index: number) => ({
          url: img.url,
          order: index,
        })),
      };
    }

    const auction = await prisma.auction.create({
      data: auctionData,
      include: {
        seller: true,
      },
    });

    return NextResponse.json(auction, { status: 201 });
  } catch (error) {
    console.error('Error creating auction:', error);
    return NextResponse.json({ error: 'Failed to create auction' }, { status: 500 });
  }
}
