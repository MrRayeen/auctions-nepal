import { NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';

const UPLOAD_DIR = join(process.cwd(), 'public', 'uploads', 'auction-images');

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const files = formData.getAll('files') as File[];

    if (!files || files.length === 0) {
      return NextResponse.json(
        { error: 'No files provided' },
        { status: 400 }
      );
    }

    // Ensure upload directory exists
    if (!existsSync(UPLOAD_DIR)) {
      await mkdir(UPLOAD_DIR, { recursive: true });
    }

    const uploadedFiles = [];

    for (const file of files) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        continue; // Skip non-image files
      }

      try {
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);

        // Generate unique filename
        const timestamp = Date.now();
        const random = Math.random().toString(36).substring(7);
        const filename = `${timestamp}-${random}.webp`;
        const filepath = join(UPLOAD_DIR, filename);

        // Save file
        await writeFile(filepath, buffer);

        uploadedFiles.push({
          filename,
          url: `/uploads/auction-images/${filename}`,
          size: file.size,
        });
      } catch (error) {
        console.error(`Error uploading file ${file.name}:`, error);
      }
    }

    if (uploadedFiles.length === 0) {
      return NextResponse.json(
        { error: 'Failed to upload any files' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { files: uploadedFiles },
      { status: 201 }
    );
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { error: 'Failed to upload files' },
      { status: 500 }
    );
  }
}
