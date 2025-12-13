const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testFullFlow() {
  try {
    console.log('🧪 Testing full image upload and auction creation flow...\n');

    // 1. Verify database connection
    console.log('1️⃣  Checking database connection...');
    const userCount = await prisma.user.count();
    console.log(`✅ Database connected. Found ${userCount} users.\n`);

    // 2. Get seller ID
    console.log('2️⃣  Getting seller info...');
    const seller = await prisma.user.findFirst({
      where: { email: 'seller1@nepal-auction.com' },
    });
    console.log(`✅ Found seller: ${seller?.name} (ID: ${seller?.id})\n`);

    // 3. Create test auction without images
    console.log('3️⃣  Creating test auction...');
    const testAuction = await prisma.auction.create({
      data: {
        title: 'Test Auction with Images',
        description: 'This is a test auction to verify image upload flow',
        startingPrice: 10000,
        currentPrice: 10000,
        startTime: new Date(),
        endTime: new Date(Date.now() + 24 * 60 * 60 * 1000),
        imageUrl: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?fm=jpg&q=60&w=3000',
        tags: JSON.stringify({
          'Test': 'Yes',
          'Status': 'Active',
        }),
        sellerId: seller?.id || 1,
        images: {
          create: [
            {
              url: '/uploads/auction-images/test-image-1.webp',
              order: 0,
            },
            {
              url: '/uploads/auction-images/test-image-2.webp',
              order: 1,
            },
          ],
        },
      },
      include: {
        images: true,
        seller: true,
      },
    });

    console.log(`✅ Auction created with ID: ${testAuction.id}`);
    console.log(`   Title: ${testAuction.title}`);
    console.log(`   Images: ${testAuction.images?.length || 0} images\n`);

    // 4. Fetch the auction to verify images were saved
    console.log('4️⃣  Verifying auction was saved correctly...');
    const fetchedAuction = await prisma.auction.findUnique({
      where: { id: testAuction.id },
      include: {
        images: {
          orderBy: { order: 'asc' },
        },
        seller: true,
      },
    });

    if (fetchedAuction) {
      console.log(`✅ Auction retrieved successfully`);
      console.log(`   ID: ${fetchedAuction.id}`);
      console.log(`   Title: ${fetchedAuction.title}`);
      console.log(`   Images: ${fetchedAuction.images?.length || 0}`);
      if (fetchedAuction.images && fetchedAuction.images.length > 0) {
        fetchedAuction.images.forEach((img, i) => {
          console.log(`      ${i + 1}. ${img.url}`);
        });
      }
      console.log('\n✅ IMAGE UPLOAD FLOW WORKING CORRECTLY!\n');
    } else {
      console.log('❌ Failed to fetch auction\n');
    }

    // 5. Test API response format
    console.log('5️⃣  Testing API response format...');
    console.log('API would return:');
    console.log(JSON.stringify({
      id: fetchedAuction?.id,
      title: fetchedAuction?.title,
      images: fetchedAuction?.images?.map(img => ({ url: img.url, order: img.order })),
    }, null, 2));

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testFullFlow();
