const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Clear existing data
  await prisma.bid.deleteMany();
  await prisma.auction.deleteMany();
  await prisma.user.deleteMany();

  // Create test users
  const seller1 = await prisma.user.create({
    data: {
      email: 'seller1@nepal-auction.com',
      name: 'Aarav Tech',
      password: 'hashed_password_1',
    },
  });

  const seller2 = await prisma.user.create({
    data: {
      email: 'seller2@nepal-auction.com',
      name: 'Priya Enterprises',
      password: 'hashed_password_2',
    },
  });

  const bidder1 = await prisma.user.create({
    data: {
      email: 'bidder1@nepal-auction.com',
      name: 'Rajesh Kumar',
      password: 'hashed_password_3',
    },
  });

  // Create test auctions
  const now = new Date();
  
  const auction1 = await prisma.auction.create({
    data: {
      title: 'Royal Enfield Classic 350 (2022)',
      description: 'Barely used, single hand driven. Modified exhaust and premium leather seats. Located in Lalitpur.',
      tags: JSON.stringify({
        'Condition': 'Excellent',
        'Year': '2022',
        'Mileage': '5,234 km',
        'Engine': '350cc',
        'Transmission': 'Manual',
        'Condition': 'Like New',
      }),
      startingPrice: 250000,
      currentPrice: 345000,
      startTime: new Date(now.getTime() - 2 * 60 * 60 * 1000),
      endTime: new Date(now.getTime() + 22 * 60 * 60 * 1000),
      imageUrl: 'https://images.unsplash.com/photo-1694956792421-e946fff94564?fm=jpg&q=60&w=3000&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Mnx8cm95YWwlMjBlbmZpZWxkJTIwY2xhc3NpYyUyMDM1MHxlbnwwfHwwfHx8MA%3D%3D',
      sellerId: seller1.id,
    },
  });

  const auction2 = await prisma.auction.create({
    data: {
      title: 'MacBook Pro M3 Max',
      description: 'Like new condition, 16GB RAM, 512GB SSD. Includes original box and charger.',
      tags: JSON.stringify({
        'Condition': 'Like New',
        'Model': 'M3 Max',
        'RAM': '16GB',
        'Storage': '512GB SSD',
        'Battery': 'Excellent',
        'Screen': '16-inch Liquid Retina XDR',
      }),
      startingPrice: 200000,
      currentPrice: 245000,
      startTime: new Date(now.getTime() - 5 * 60 * 60 * 1000),
      endTime: new Date(now.getTime() + 19 * 60 * 60 * 1000),
      imageUrl: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?fm=jpg&q=60&w=3000',
      sellerId: seller2.id,
    },
  });

  const auction3 = await prisma.auction.create({
    data: {
      title: 'iPhone 15 Pro Max',
      description: 'Black color, 256GB. Mint condition with all accessories.',
      tags: JSON.stringify({
        'Condition': 'Mint',
        'Color': 'Black',
        'Storage': '256GB',
        'Carrier': 'Unlocked',
        'Battery': 'Excellent',
        'Charger': 'Included',
      }),
      startingPrice: 120000,
      currentPrice: 156000,
      startTime: new Date(now.getTime() - 1 * 60 * 60 * 1000),
      endTime: new Date(now.getTime() + 35 * 60 * 60 * 1000),
      imageUrl: 'https://images.unsplash.com/photo-1592286927505-1def25115558?fm=jpg&q=60&w=3000',
      sellerId: seller1.id,
    },
  });

  const auction4 = await prisma.auction.create({
    data: {
      title: 'Vintage Rolex Watch',
      description: 'Authentic 1960s Rolex Submariner. Fully serviced and authenticated.',
      tags: JSON.stringify({
        'Year': '1960s',
        'Model': 'Submariner',
        'Condition': 'Serviced',
        'Authenticity': 'Certified',
        'Movement': 'Mechanical',
        'Waterproof': '300m',
      }),
      startingPrice: 80000,
      currentPrice: 118000,
      startTime: new Date(now.getTime() - 3 * 60 * 60 * 1000),
      endTime: new Date(now.getTime() + 45 * 60 * 60 * 1000),
      imageUrl: 'https://images.unsplash.com/photo-1523170335684-f1b0248e7fb0?fm=jpg&q=60&w=3000',
      sellerId: seller2.id,
    },
  });

  const auction5 = await prisma.auction.create({
    data: {
      title: 'Sony PlayStation 5',
      description: 'Complete bundle with 2 controllers, 3 games, and all cables.',
      tags: JSON.stringify({
        'Condition': 'Excellent',
        'Version': 'Standard',
        'Controllers': '2',
        'Games': '3',
        'Storage': '825GB',
        'Warranty': '6 months',
      }),
      startingPrice: 50000,
      currentPrice: 72000,
      startTime: new Date(now.getTime() - 4 * 60 * 60 * 1000),
      endTime: new Date(now.getTime() + 20 * 60 * 60 * 1000),
      imageUrl: 'https://images.unsplash.com/photo-1606664515524-2dba4ad8f8f3?fm=jpg&q=60&w=3000',
      sellerId: seller1.id,
    },
  });

  const auction6 = await prisma.auction.create({
    data: {
      title: 'Canon EOS R5 Camera',
      description: 'Professional mirrorless camera with RF 24-105mm lens. Excellent condition.',
      tags: JSON.stringify({
        'Condition': 'Excellent',
        'Model': 'EOS R5',
        'Sensor': '45MP',
        'Lens': 'RF 24-105mm',
        'Video': '8K Recording',
        'Shutter': '300,000 actuations',
      }),
      startingPrice: 180000,
      currentPrice: 210000,
      startTime: new Date(now.getTime() - 6 * 60 * 60 * 1000),
      endTime: new Date(now.getTime() + 18 * 60 * 60 * 1000),
      imageUrl: 'https://images.unsplash.com/photo-1609034227505-5876f6aa4e90?fm=jpg&q=60&w=3000',
      sellerId: seller2.id,
    },
  });

  // Add some bids
  await prisma.bid.create({
    data: {
      amount: 340000,
      auctionId: auction1.id,
      bidderId: bidder1.id,
    },
  });

  await prisma.bid.create({
    data: {
      amount: 345000,
      auctionId: auction1.id,
      bidderId: seller2.id,
    },
  });

  await prisma.bid.create({
    data: {
      amount: 240000,
      auctionId: auction2.id,
      bidderId: bidder1.id,
    },
  });

  await prisma.bid.create({
    data: {
      amount: 245000,
      auctionId: auction2.id,
      bidderId: seller1.id,
    },
  });

  console.log('✅ Seeding complete!');
  console.log(`📦 Created 6 auctions with test data`);
  console.log(`👥 Created 3 test users`);
  console.log(`🎯 Created 4 test bids`);
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
