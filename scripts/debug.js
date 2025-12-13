const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  try {
    // Get all auctions
    const auctions = await prisma.auction.findMany();
    console.log('All auctions in database:', auctions.length);
    console.log(JSON.stringify(auctions, null, 2));

    // Try to get auction 1 specifically
    console.log('\n\nTrying to get auction 1...');
    const auction1 = await prisma.auction.findUnique({
      where: { id: 1 },
    });
    console.log('Auction 1:', auction1);

    // Try to get auction 25 specifically
    console.log('\n\nTrying to get auction 25...');
    const auction25 = await prisma.auction.findUnique({
      where: { id: 25 },
    });
    console.log('Auction 25:', auction25);
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
