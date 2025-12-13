import prisma from '../src/lib/db';
import { generateSlug, ensureUniqueSlug } from '../src/lib/slug';

async function main() {
  console.log('Seeding database...');

  // Create test users
  const seller1 = await prisma.user.upsert({
    where: { email: 'seller1@nepal-auction.com' },
    update: {},
    create: {
      email: 'seller1@nepal-auction.com',
      name: 'Aarav Tech',
      password: 'hashed_password_1',
    },
  });

  const seller2 = await prisma.user.upsert({
    where: { email: 'seller2@nepal-auction.com' },
    update: {},
    create: {
      email: 'seller2@nepal-auction.com',
      name: 'Priya Enterprises',
      password: 'hashed_password_2',
    },
  });

  const bidder1 = await prisma.user.upsert({
    where: { email: 'bidder1@nepal-auction.com' },
    update: {},
    create: {
      email: 'bidder1@nepal-auction.com',
      name: 'Rajesh Kumar',
      password: 'hashed_password_3',
    },
  });

  // Create test auctions
  const now = new Date();
  const title1 = 'Royal Enfield Classic 350 (2022)';
  const slug1 = await ensureUniqueSlug(generateSlug(title1), prisma);
  const auction1 = await prisma.auction.create({
    data: {
      title: title1,
      slug: slug1,
      description: 'Barely used, single hand driven. Modified exhaust and premium leather seats. Located in Lalitpur.',
      startingPrice: 250000,
      currentPrice: 345000,
      startTime: new Date(now.getTime() - 2 * 60 * 60 * 1000), // Started 2 hours ago
      endTime: new Date(now.getTime() + 22 * 60 * 60 * 1000), // Ends in 22 hours
      imageUrl: 'https://images.unsplash.com/photo-1694956792421-e946fff94564?fm=jpg&q=60&w=3000&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Mnx8cm95YWwlMjBlbmZpZWxkJTIwY2xhc3NpYyUyMDM1MHxlbnwwfHwwfHx8MA%3D%3D',
      sellerId: seller1.id,
    },
  });

  const title2 = 'MacBook Pro M3 Max';
  const slug2 = await ensureUniqueSlug(generateSlug(title2), prisma);
  const auction2 = await prisma.auction.create({
    data: {
      title: title2,
      slug: slug2,
      description: 'Like new condition, 16GB RAM, 512GB SSD. Includes original box and charger.',
      startingPrice: 200000,
      currentPrice: 245000,
      startTime: new Date(now.getTime() - 5 * 60 * 60 * 1000),
      endTime: new Date(now.getTime() + 19 * 60 * 60 * 1000),
      imageUrl: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?fm=jpg&q=60&w=3000',
      sellerId: seller2.id,
    },
  });

  const title3 = 'iPhone 15 Pro Max';
  const slug3 = await ensureUniqueSlug(generateSlug(title3), prisma);
  const auction3 = await prisma.auction.create({
    data: {
      title: title3,
      slug: slug3,
      description: 'Black color, 256GB. Mint condition with all accessories.',
      startingPrice: 120000,
      currentPrice: 156000,
      startTime: new Date(now.getTime() - 1 * 60 * 60 * 1000),
      endTime: new Date(now.getTime() + 35 * 60 * 60 * 1000),
      imageUrl: 'https://images.unsplash.com/photo-1592286927505-1def25115558?fm=jpg&q=60&w=3000',
      sellerId: seller1.id,
    },
  });

  const title4 = 'Vintage Rolex Watch';
  const slug4 = await ensureUniqueSlug(generateSlug(title4), prisma);
  const auction4 = await prisma.auction.create({
    data: {
      title: title4,
      slug: slug4,
      description: 'Authentic 1960s Rolex Submariner. Fully serviced and authenticated.',
      startingPrice: 80000,
      currentPrice: 118000,
      startTime: new Date(now.getTime() - 3 * 60 * 60 * 1000),
      endTime: new Date(now.getTime() + 45 * 60 * 60 * 1000),
      imageUrl: 'https://images.unsplash.com/photo-1523170335684-f1b0248e7fb0?fm=jpg&q=60&w=3000',
      sellerId: seller2.id,
    },
  });

  const title5 = 'Sony PlayStation 5';
  const slug5 = await ensureUniqueSlug(generateSlug(title5), prisma);
  const auction5 = await prisma.auction.create({
    data: {
      title: title5,
      slug: slug5,
      description: 'Complete bundle with 2 controllers, 3 games, and all cables.',
      startingPrice: 50000,
      currentPrice: 72000,
      startTime: new Date(now.getTime() - 4 * 60 * 60 * 1000),
      endTime: new Date(now.getTime() + 20 * 60 * 60 * 1000),
      imageUrl: 'https://images.unsplash.com/photo-1606664515524-2dba4ad8f8f3?fm=jpg&q=60&w=3000',
      sellerId: seller1.id,
    },
  });

  // Add some bids
  await prisma.bid.create({
    data: {
      amount: 345000,
      auctionId: auction1.id,
      bidderId: bidder1.id,
    },
  });

  await prisma.bid.create({
    data: {
      amount: 245000,
      auctionId: auction2.id,
      bidderId: bidder1.id,
    },
  });

  console.log('✅ Seeding complete!');
  console.log(`Created ${5} auctions with test data`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
