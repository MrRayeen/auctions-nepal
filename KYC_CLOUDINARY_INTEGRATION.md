# KYC Cloudinary Integration Guide

## Overview
This document outlines the secure integration of Cloudinary for KYC (Know Your Customer) document storage and viewing. All KYC documents are stored as **private** on Cloudinary, with secure, time-limited signed URLs for admin viewing only.

## Architecture

### 1. **Upload Flow** (`/api/kyc/upload/route.ts`)
- Accepts single file uploads
- Validates file type (images only)
- Uploads to Cloudinary in the `kyc/` folder with `type: "private"`
- Returns the Cloudinary `publicId` (not the URL, since private URLs aren't directly accessible)
- Response includes:
  - `publicId`: Cloudinary public ID for later retrieval
  - `filename`: Same as publicId
  - `size`: File size in bytes

**Key Changes:**
```typescript
// Returns publicId instead of direct URL
return NextResponse.json({
  publicId: result.public_id,
  filename: result.public_id,
  size: result.bytes,
}, { status: 201 });
```

### 2. **Signed URL Generation** (`/api/kyc/signed-url/route.ts`) - NEW
- **Purpose**: Securely generate time-limited signed URLs for private KYC documents
- **Authentication**: Requires admin token (`x-admin-token` header)
- **Security Features**:
  - Validates admin authentication
  - Validates that publicId belongs to `kyc/` folder (prevents accessing other documents)
  - Generates signed URLs valid for **1 hour**
  - Includes quality optimization (`auto` format and quality)

**Request:**
```bash
POST /api/kyc/signed-url
Headers: x-admin-token: <admin-token>
Body: { "publicId": "kyc/document-id" }
```

**Response:**
```json
{
  "url": "https://res.cloudinary.com/...signed-url..."
}
```

### 3. **Admin Dashboard** (`/src/app/admin/kyc/page.tsx`)
- Fetches KYC submissions with `publicId` fields instead of direct URLs
- Uses the new `DocumentImage` component for secure image display
- Implements client-side caching of signed URLs (50-minute TTL)

**Key Features:**
- `getSignedURL()` function: Fetches signed URLs and caches them
- Cache expires after 50 minutes (safe margin from 1-hour Cloudinary expiry)
- `DocumentImage` component: Handles loading, error states, and lazy URL fetching
- Only displays images after admin authentication is verified

## Security Implementation

### Private Document Storage
```typescript
{
  folder: "kyc",
  type: "private",        // ✓ Documents are private
  tags: ["kyc_document"]  // ✓ Organized for easy management
}
```

### Signed URL Protection
- ✓ Time-limited URLs (1 hour expiry)
- ✓ Cryptographically signed by Cloudinary
- ✓ Admin authentication required for generation
- ✓ Folder validation (only `kyc/` documents accessible)

### Admin Authentication
- Requires valid `x-admin-token` header on all sensitive endpoints
- Token verified against `ADMIN_TOKEN` environment variable
- Prevents unauthorized access to document URLs

## Database Schema Changes

### User Model Fields
- `citizenshipFront`: Changed from URL to **Cloudinary publicId**
- `citizenshipBack`: Changed from URL to **Cloudinary publicId**
- `selfieWithCitizenship`: Changed from URL to **Cloudinary publicId**

**Example:**
```
Before: "https://res.cloudinary.com/.../citizenship-front-xyz.jpg"
After:  "kyc/u123/citizenship-front-xyz" (publicId only)
```

## Client-Side Implementation

### DocumentImage Component
A secure image display component that:
1. Accepts a Cloudinary `publicId`
2. Calls `/api/kyc/signed-url` to get a temporary URL
3. Caches the signed URL for 50 minutes
4. Displays the image with loading and error states
5. Provides a link to open full-size in new tab

```typescript
<DocumentImage
  label="Citizenship Front"
  publicId={submission.citizenshipFront}
  getSignedURL={getSignedURL}
/>
```

## Environment Variables Required

Ensure these are set in `.env.local`:
```env
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
ADMIN_TOKEN=your-secure-admin-token
```

## API Endpoints Summary

| Endpoint | Method | Purpose | Auth |
|----------|--------|---------|------|
| `/api/kyc/upload` | POST | Upload KYC documents | User |
| `/api/kyc/signed-url` | POST | Generate temporary viewing URLs | Admin |
| `/api/kyc/admin` | GET | Fetch all KYC submissions | Admin |
| `/api/kyc/admin` | PATCH | Approve/reject KYC | Admin |

## Error Handling

### Upload Errors
- Non-image files: Returns 400 error
- Upload failures: Returns 500 error with descriptive message

### Signed URL Errors
- Invalid admin token: Returns 401 Unauthorized
- Invalid publicId format: Returns 403 Forbidden
- Missing publicId: Returns 400 Bad Request
- Cloudinary errors: Returns 500 error

### Client Errors
- Failed to load image: Shows "Failed to load image" placeholder
- Network errors: Gracefully handled with error state

## Migration Guide

If migrating existing KYC data:

1. **Export current Cloudinary URLs** from your database
2. **Extract publicIds** from the URLs (format: `kyc/user-id/document-name`)
3. **Update database records** to store publicIds instead of URLs
4. **Verify** that images display correctly in admin dashboard

Example URL to publicId extraction:
```
URL: https://res.cloudinary.com/demo/image/upload/kyc/u123/doc.jpg
publicId: kyc/u123/doc.jpg
```

## Testing

### Test Admin Dashboard Image Display
1. Login as admin
2. Navigate to KYC Verification section
3. Expand a pending submission
4. Verify images load properly (should show loading spinner briefly)
5. Click images to view in new tab (signed URL should work)

### Test Security
1. Attempt to access signed URL endpoint without admin token → Should return 401
2. Attempt to access non-kyc publicId → Should return 403
3. Verify signed URLs expire after 1 hour
4. Clear browser cache and refresh → New signed URL should be fetched

## Future Enhancements

- [ ] Add document download functionality
- [ ] Implement document rotation/editing for admins
- [ ] Add batch verification UI
- [ ] Implement audit logging for document access
- [ ] Add multi-language support for rejection reasons
