import prisma from "@/lib/db";
import { NextResponse } from "next/server";
import { generateSlug, ensureUniqueSlug } from "@/lib/slug";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);

    const limit = Number(searchParams.get("limit")) || 10;
    const skip = Number(searchParams.get("skip")) || 0;
    const search = searchParams.get("search")?.trim();
    const sellerId = searchParams.get("sellerId");
    const category = searchParams.get("category");
    const subCategory = searchParams.get("subCategory");

    const where: any = {};

    if (search) {
      where.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
      ];
    }

    if (sellerId && !isNaN(Number(sellerId))) {
      where.sellerId = Number(sellerId);
    }

    if (category) {
      where.category = category;
    }

    if (subCategory) {
      where.subCategory = subCategory;
    }

    const [auctions, total] = await Promise.all([
      prisma.auction.findMany({
        where,
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
            orderBy: { createdAt: "desc" },
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
        orderBy: { createdAt: "desc" },
        take: limit,
        skip: skip,
      }),
      prisma.auction.count({ where }),
    ]);

    return NextResponse.json({
      auctions,
      total,
      limit,
      skip,
    });
  } catch (error) {
    console.error("Error fetching auctions:", error);

    // 🔒 CRITICAL: always return same response shape
    return NextResponse.json(
      {
        auctions: [],
        total: 0,
        limit: 0,
        skip: 0,
        error: "Failed to fetch auctions",
      },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const {
      title,
      description,
      startingPrice,
      minIncrement,
      startTime,
      endTime,
      imageUrl,
      sellerId,
      tags,
      images,
      category,
      subCategory,
      locationLat,
      locationLng,
      locationArea,
      locationCity,
      delivery,
    } = body;

    const baseSlug = generateSlug(title);
    const slug = await ensureUniqueSlug(baseSlug, prisma);

    const auction = await prisma.auction.create({
      data: {
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
        locationLat: locationLat || null,
        locationLng: locationLng || null,
        locationArea: locationArea || null,
        locationCity: locationCity || null,
        delivery: delivery || "Not Available",
        images: images?.length
          ? {
              create: images.map((img: any, index: number) => ({
                url: img.url,
                order: index,
              })),
            }
          : undefined,
      },
      include: {
        seller: true,
      },
    });

    return NextResponse.json(auction, { status: 201 });
  } catch (error) {
    console.error("Error creating auction:", error);

    return NextResponse.json(
      { error: "Failed to create auction" },
      { status: 500 }
    );
  }
}
