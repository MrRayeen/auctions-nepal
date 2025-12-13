const fs = require('fs');
const path = require('path');

async function testImageUpload() {
  try {
    // Create a simple 1x1 pixel PNG for testing
    const pngData = Buffer.from([
      0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a,
      0x00, 0x00, 0x00, 0x0d, 0x49, 0x48, 0x44, 0x52,
      0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
      0x08, 0x02, 0x00, 0x00, 0x00, 0x90, 0x77, 0x53,
      0xde, 0x00, 0x00, 0x00, 0x0c, 0x49, 0x44, 0x41,
      0x54, 0x08, 0xd7, 0x63, 0xf8, 0xcf, 0xc0, 0x00,
      0x00, 0x00, 0x03, 0x00, 0x01, 0xf5, 0x5b, 0x6e,
      0x3b, 0x70, 0x00, 0x00, 0x00, 0x00, 0x49, 0x45,
      0x4e, 0x44, 0xae, 0x42, 0x60, 0x82
    ]);

    // Write test image to uploads directory
    const uploadsDir = path.join(process.cwd(), 'public', 'uploads', 'auction-images');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    const testImagePath = path.join(uploadsDir, 'test-image.png');
    fs.writeFileSync(testImagePath, pngData);
    console.log('✅ Test image created at:', testImagePath);

    // Now test the API upload endpoint
    const FormData = require('form-data');
    const testForm = new FormData();
    testForm.append('files', fs.createReadStream(testImagePath), 'test-image.png');

    console.log('📤 Uploading to /api/upload...');
    const response = await fetch('http://localhost:3000/api/upload', {
      method: 'POST',
      body: testForm,
      headers: testForm.getHeaders(),
    });

    if (response.ok) {
      const data = await response.json();
      console.log('✅ Upload successful!');
      console.log('Response:', JSON.stringify(data, null, 2));
    } else {
      console.error('❌ Upload failed with status:', response.status);
      const error = await response.text();
      console.error('Error response:', error);
    }
  } catch (error) {
    console.error('Error during test:', error);
  }
}

testImageUpload();
