# KYC Upload Architecture - Complete Overview

## Problem Statement
The KYC upload system had several critical issues:
1. Images were uploading immediately when selected (premature upload)
2. Uploaded images weren't being stored or displayed in the form
3. Form submission failed because it couldn't find stored images
4. Cloudinary's `publicId` response wasn't being handled correctly
5. No security for private KYC documents

## Solution Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    USER KYC FORM (Frontend)                     │
│                                                                 │
│  1. User Selects Image                                         │
│     ↓                                                           │
│     File stored locally in React state (selectedFiles)         │
│     ✓ Preview shows immediately                               │
│     ✓ NO upload happens yet                                   │
│                                                                 │
│  2. User Clicks Submit                                         │
│     ↓                                                           │
│     All 3 files upload in parallel to /api/kyc/upload         │
│     ✓ Receive publicIds from Cloudinary                       │
│     ✓ Submit form with publicIds + addresses                  │
└─────────────────────────────────────────────────────────────────┘
                             ↓
┌─────────────────────────────────────────────────────────────────┐
│                   UPLOAD ENDPOINT                               │
│              /api/kyc/upload (POST)                            │
│                                                                 │
│  - Receive file from client                                    │
│  - Validate file type (image only)                            │
│  - Upload to Cloudinary with:                                 │
│    • folder: "kyc"                                            │
│    • type: "private"  (← KEY: NOT publicly accessible)        │
│    • tags: ["kyc_document"]                                   │
│  - Return publicId to client                                  │
│    (NOT the URL, because it won't work for private docs)      │
└─────────────────────────────────────────────────────────────────┘
                             ↓
┌─────────────────────────────────────────────────────────────────┐
│                   KYC SUBMISSION ENDPOINT                       │
│                 /api/kyc (POST)                                │
│                                                                 │
│  - Receive publicIds from client                              │
│  - Store in database:                                         │
│    • citizenshipFront: "kyc/user-123/doc-abc"               │
│    • citizenshipBack: "kyc/user-123/doc-def"                │
│    • selfieWithCitizenship: "kyc/user-123/doc-ghi"          │
│    • kycStatus: "PENDING"                                     │
│  - Return success                                             │
└─────────────────────────────────────────────────────────────────┘
                             ↓
┌─────────────────────────────────────────────────────────────────┐
│                      DATABASE (Prisma)                          │
│                                                                 │
│  User {                                                        │
│    id: 123                                                     │
│    citizenshipFront: "kyc/user-123/doc-abc"                  │
│    citizenshipBack: "kyc/user-123/doc-def"                   │
│    selfieWithCitizenship: "kyc/user-123/doc-ghi"             │
│    kycStatus: "PENDING"                                        │
│    kycSubmittedAt: 2025-12-13T...                            │
│  }                                                             │
└─────────────────────────────────────────────────────────────────┘
```

---

## Image Viewing Flow (Admin)

```
┌─────────────────────────────────────────────────────────────────┐
│              ADMIN KYC DASHBOARD (Frontend)                     │
│                                                                 │
│  1. Load KYC Submissions                                        │
│     GET /api/kyc/admin                                         │
│     Response includes publicIds (not URLs)                     │
│                                                                 │
│  2. Expand Submission to View Images                           │
│     DocumentImage component triggers:                          │
│     POST /api/kyc/signed-url                                   │
│     Body: { publicId: "kyc/user-123/doc-abc" }               │
└─────────────────────────────────────────────────────────────────┘
                             ↓
┌─────────────────────────────────────────────────────────────────┐
│              SIGNED URL ENDPOINT (Backend)                      │
│             /api/kyc/signed-url (POST)                         │
│                                                                 │
│  - Verify admin authentication                                 │
│  - Validate publicId starts with "kyc/" (security check)      │
│  - Call Cloudinary SDK:                                        │
│    cloudinary.url(publicId, {                                 │
│      sign_url: true,          ← Generate signature            │
│      expires_in: 3600,         ← Valid 1 hour                 │
│      type: "private"           ← For private documents         │
│    })                                                          │
│  - Return signed URL to client                                │
│    (URL includes signature that expires after 1 hour)        │
└─────────────────────────────────────────────────────────────────┘
                             ↓
┌─────────────────────────────────────────────────────────────────┐
│        CLIENT-SIDE URL CACHING (Admin Dashboard)               │
│                                                                 │
│  - Cache signed URL for 50 minutes (safe before expiry)       │
│  - On page refresh: check cache first                         │
│  - If expired: request new signed URL                         │
│  - Display image with cached/fresh signed URL                 │
└─────────────────────────────────────────────────────────────────┘
                             ↓
┌─────────────────────────────────────────────────────────────────┐
│          CLOUDINARY PRIVATE IMAGE DELIVERY                      │
│                                                                 │
│  - Admin has valid signed URL with signature                  │
│  - Browser requests image with signature                      │
│  - Cloudinary verifies signature                              │
│  - If valid and within expiry: deliver image                  │
│  - If invalid or expired: 403 Forbidden                       │
│                                                                 │
│  ✓ User (non-admin) cannot view images                       │
│  ✓ Admin can only view within 1-hour window                   │
│  ✓ Each view requires fresh admin authentication               │
└─────────────────────────────────────────────────────────────────┘
```

---

## State Flow Diagram

### User Form State

```
INITIAL STATE
├─ selectedFiles: { all null }
├─ kycData: { all empty strings }
├─ submitting: false

USER SELECTS IMAGE
├─ selectedFiles: { citizenshipFront: File object }
├─ kycData: { unchanged }
├─ submitting: false

USER ENTERS ADDRESSES
├─ selectedFiles: { all File objects }
├─ kycData: { currentAddress, permanentAddress filled }
├─ submitting: false

USER CLICKS SUBMIT
├─ selectedFiles: { all File objects }
├─ kycData: { all fields filled }
├─ submitting: true
│  ├─ Upload citizen_front.jpg → publicId: "kyc/123/abc"
│  ├─ Upload citizen_back.jpg  → publicId: "kyc/123/def"
│  └─ Upload selfie.jpg        → publicId: "kyc/123/ghi"
│  ├─ Submit form with publicIds + addresses
│  └─ submitting: false

AFTER SUCCESSFUL SUBMISSION
├─ selectedFiles: { all null }  ← RESET
├─ kycData: { all filled with publicIds, kycStatus: PENDING }
├─ submitting: false
├─ Form becomes READ-ONLY
```

---

## API Response Formats

### Upload Response (publicId-based)
```json
{
  "publicId": "kyc/user-123/citizenship-front-xyz",
  "filename": "kyc/user-123/citizenship-front-xyz",
  "size": 245682
}
```

### KYC Submission Request
```json
{
  "currentAddress": "...",
  "permanentAddress": "...",
  "citizenshipFront": "kyc/user-123/citizenship-front-xyz",
  "citizenshipBack": "kyc/user-123/citizenship-back-xyz",
  "selfieWithCitizenship": "kyc/user-123/selfie-xyz"
}
```

### Signed URL Response
```json
{
  "url": "https://res.cloudinary.com/demo/image/upload/s--signature--/kyc/user-123/citizenship-front-xyz.jpg"
}
```

---

## Security Model

### Public vs Private Access

| Document Type | Stored As | Public Access | Admin Access |
|---|---|---|---|
| Auction Images | URL (cloudinary public) | ✓ Direct access | ✓ Direct access |
| **KYC Documents** | **publicId** | **✗ NO** | **✓ Via Signed URL** |

### Authentication Layers

1. **User Upload**
   - Must have valid JWT token
   - Can only upload to their own profile

2. **Form Submission**
   - Must have valid JWT token
   - publicIds received from upload endpoint

3. **Admin View**
   - Must have valid admin token (x-admin-token header)
   - publicId must start with "kyc/" (folder validation)
   - Receives signed URL (time-limited, signature-verified)

4. **Cloudinary Delivery**
   - Admin must have valid signed URL
   - Signature must match publicId
   - Must be within 1-hour expiration window

---

## Data Flow Summary

```
Frontend Upload
├─ File selected → stored in state
├─ Submit clicked → upload to /api/kyc/upload
├─ Receive publicId → store in form state
├─ Submit form → POST to /api/kyc with publicIds
└─ Success → form resets, status becomes PENDING

Database Storage
├─ citizenshipFront: "kyc/..." (publicId)
├─ citizenshipBack: "kyc/..." (publicId)
├─ selfieWithCitizenship: "kyc/..." (publicId)
└─ kycStatus: "PENDING"

Admin Viewing
├─ Fetch submissions → GET /api/kyc/admin
├─ For each image → POST /api/kyc/signed-url
├─ Receive signed URL → display in img tag
└─ URL valid for 1 hour, then auto-refresh needed

Security
├─ Images marked "private" in Cloudinary
├─ No direct URLs given to frontend
├─ Signed URLs require admin authentication
├─ Time-limited access (1 hour)
└─ Folder validation prevents access control bypass
```

---

## Key Improvements

### Before This Fix
❌ Images uploaded immediately on selection
❌ Direct URLs stored in DB (risky)
❌ Form validation checked wrong state
❌ Failed to handle new Cloudinary `publicId` response
❌ No access control on KYC documents
❌ Images lost on page refresh if not submitted

### After This Fix
✅ Images upload only on form submit
✅ Cloudinary publicIds stored in DB
✅ Form validation checks selected files
✅ Proper publicId handling from Cloudinary
✅ Secured access via signed URLs (admin only)
✅ Proper error handling for upload failures
✅ State properly managed with React
✅ Parallel upload of all 3 images
✅ Graceful error messages to users

---

## Performance Optimizations

1. **Parallel Uploads**
   - All 3 images upload simultaneously
   - Faster than sequential uploads

2. **Client-Side URL Caching**
   - Admin dashboard caches signed URLs for 50 minutes
   - Reduces API calls for frequently viewed submissions

3. **On-Demand Signing**
   - Signed URLs only generated when needed
   - Reduces server load
   - Fresh URLs fetched after expiration

4. **File Validation**
   - Client-side type checking before upload
   - Fails fast with clear errors
