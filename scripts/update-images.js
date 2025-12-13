const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  // Update test auction images to use Unsplash URLs
  await prisma.auctionImage.deleteMany({ where: { auctionId: 8 } });
  
  await prisma.auctionImage.create({
    data: {
      url: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?fm=jpg&q=60&w=3000',
      order: 0,
      auctionId: 8,
    },
  });
  
  await prisma.auctionImage.create({
    data: {
      url: 'https://images.unsplash.com/photo-1523170335684-f1b0248e7fb0?fm=jpg&q=60&w=3000',
      order: 1,
      auctionId: 8,
    },
  });

  console.log('✅ Updated test auction images');
  await prisma.$disconnect();
}

main().catch(console.error);
