import { NextRequest, NextResponse } from "next/server";
import { v2 as cloudinary } from "cloudinary";

// Configure Cloudinary (Keys must be in .env file)
cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const ADMIN_TOKEN = process.env.ADMIN_TOKEN || "admin-secret-key";

function verifyAdminToken(req: NextRequest): boolean {
  const token = req.headers.get("x-admin-token");
  return token === ADMIN_TOKEN;
}

/**
 * POST /api/kyc/signed-url
 * 
 * Generates a secure, time-limited signed URL for viewing private KYC documents.
 * Only authenticated admins can request signed URLs to view sensitive KYC materials.
 * 
 * Request body:
 * {
 *   publicId: string  // Cloudinary public_id of the image
 * }
 * 
 * Response:
 * {
 *   url: string  // Signed URL valid for 1 hour
 * }
 */
export async function POST(request: NextRequest) {
  // Verify admin authentication
  if (!verifyAdminToken(request)) {
    return NextResponse.json(
      { error: "Unauthorized - Invalid admin token" },
      { status: 401 }
    );
  }

  try {
    const { publicId } = await request.json();

    if (!publicId || typeof publicId !== "string") {
      return NextResponse.json(
        { error: "Missing or invalid publicId parameter" },
        { status: 400 }
      );
    }

    const trimmedPublicId = publicId.trim();
    
    if (!trimmedPublicId) {
      return NextResponse.json(
        { error: "publicId cannot be empty" },
        { status: 400 }
      );
    }

    // Validate that the public_id belongs to the kyc folder (security check)
    if (!trimmedPublicId.startsWith("kyc/")) {
      console.error('Security: Attempted access to non-KYC document:', trimmedPublicId);
      return NextResponse.json(
        { error: "Invalid document ID - must be in kyc folder" },
        { status: 403 }
      );
    }

    console.log('Generating authenticated URL for publicId:', trimmedPublicId);

    // For authenticated/private images, we need to generate a signed URL
    // that includes both the authentication token and expiration time
    const signedUrl = cloudinary.url(trimmedPublicId, {
      secure: true,
      sign_url: true,
      expires_in: 3600, // 1 hour
      quality: "auto",
      fetch_format: "auto",
    });

    console.log('Generated authenticated URL:', signedUrl);

    return NextResponse.json(
      {
        url: signedUrl,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error generating authenticated URL:", error);
    return NextResponse.json(
      { error: "Failed to generate authenticated URL", details: String(error) },
      { status: 500 }
    );
  }
}
