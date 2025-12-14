import { NextResponse } from "next/server";
import { v2 as cloudinary } from "cloudinary";
import type { UploadApiResponse, UploadApiErrorResponse } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const files = formData.getAll("files") as File[];

    if (!files || files.length === 0) {
      return NextResponse.json({ error: "No files provided" }, { status: 400 });
    }

    // Define a type for our simplified file object
    interface UploadedFile {
      filename: string;
      url: string;
      size: number;
    }

    const uploadedFiles: UploadedFile[] = [];

    for (const file of files) {
      if (!file.type.startsWith("image/")) {
        continue;
      }

      try {
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        // Upload to Cloudinary using a stream with proper types
        const result = await new Promise<UploadApiResponse>(
          (resolve, reject) => {
            const uploadStream = cloudinary.uploader.upload_stream(
              {
                folder: "auction-images",
                resource_type: "image", // explicit type helps TS
              },
              (
                error: UploadApiErrorResponse | undefined,
                result: UploadApiResponse | undefined
              ) => {
                if (error) {
                  reject(error);
                } else if (result) {
                  resolve(result);
                } else {
                  reject(new Error("Unknown upload error"));
                }
              }
            );

            // Write buffer to stream
            uploadStream.end(buffer);
          }
        );

        uploadedFiles.push({
          filename: result.public_id,
          url: result.secure_url,
          size: result.bytes,
        });
      } catch (error) {
        console.error(`Error uploading file ${file.name}:`, error);
        // Continue to next file instead of crashing the whole request
      }
    }

    if (uploadedFiles.length === 0) {
      return NextResponse.json(
        { error: "Failed to upload any files" },
        { status: 400 }
      );
    }

    return NextResponse.json({ files: uploadedFiles }, { status: 201 });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json(
      { error: "Failed to upload files" },
      { status: 500 }
    );
  }
}
