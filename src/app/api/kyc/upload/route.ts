import { NextResponse } from "next/server";
import { v2 as cloudinary } from "cloudinary";
import type { UploadApiResponse, UploadApiErrorResponse } from "cloudinary";

// Configure Cloudinary (Keys must be in .env file)
cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Validate file type
    if (!file.type.startsWith("image/")) {
      return NextResponse.json(
        { error: "Only image files are allowed" },
        { status: 400 }
      );
    }

    // --- Cloudinary Upload Logic ---
    try {
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      // Upload to Cloudinary using a stream with proper types
      const result = await new Promise<UploadApiResponse>((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          {
            folder: "kyc", // Dedicated folder for KYC documents
            resource_type: "image",
            // No type restriction - images are public but admin access is controlled via API auth
            tags: ["kyc_document"], // Useful for organization
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
      });

      return NextResponse.json(
        {
          // Return direct secure URL for public image
          publicId: result.public_id,
          url: result.secure_url, // Direct public URL
          filename: result.public_id,
          size: result.bytes,
        },
        { status: 201 }
      );
    } catch (error) {
      console.error(`Error uploading KYC file:`, error);
      return NextResponse.json(
        { error: "Failed to upload KYC file" },
        { status: 500 }
      );
    }
    // -------------------------------
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json(
      { error: "Failed to process upload request" },
      { status: 500 }
    );
  }
}
