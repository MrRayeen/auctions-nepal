# KYC Upload Fix - Quick Reference

## What Changed

### The Problem
When users selected KYC images in their profile:
1. ❌ Image uploaded immediately (premature)
2. ❌ Not shown in form viewbox
3. ❌ Form submission said "upload an image"
4. ❌ Response format mismatch (url vs publicId)

### The Solution
1. ✅ Images selected locally, stored in state
2. ✅ Preview shown with "Selected" badge
3. ✅ Upload happens only on "Submit KYC" click
4. ✅ All files upload in parallel
5. ✅ Form submits with Cloudinary publicIds
6. ✅ Secure admin viewing via signed URLs

---

## User Experience Flow

### Before (Broken)
```
Select Image → Upload starts → (?) → Submit fails with error
```

### After (Fixed)
```
Select Image → Preview shown → Submit → Uploads 3x in parallel → Success
```

---

## Technical Changes

| Component | Change |
|-----------|--------|
| **KYCForm.tsx** | Use `selectedFiles` state for file selection; upload on submit, not on change |
| **kyc/upload/route.ts** | Return `publicId` instead of `url` |
| **kyc/signed-url/route.ts** | NEW: Generate time-limited signed URLs for admin viewing |
| **admin/kyc/page.tsx** | Fetch signed URLs for private image display |

---

## File Upload Flow

```
┌─────────────┐
│  User       │
│ Selects     │
│  Image      │
└──────┬──────┘
       │
       v
┌──────────────────────┐
│ Stored in Local State│
│ (selectedFiles)      │
│ No upload yet        │
└──────┬───────────────┘
       │
       v
┌──────────────────────┐
│  User Clicks         │
│  Submit KYC          │
└──────┬───────────────┘
       │
       v
┌──────────────────────┐
│ Upload all 3 files   │
│ in parallel to       │
│ /api/kyc/upload      │
└──────┬───────────────┘
       │
       v
┌──────────────────────┐
│ Get 3 publicIds      │
│ from Cloudinary      │
└──────┬───────────────┘
       │
       v
┌──────────────────────┐
│ Submit form with     │
│ publicIds to         │
│ /api/kyc             │
└──────┬───────────────┘
       │
       v
┌──────────────────────┐
│ Stored in Database   │
│ Ready for admin      │
│ review               │
└──────────────────────┘
```

---

## Key Code Changes

### handleImageUpload (Before → After)

**BEFORE**: Upload immediately
```typescript
const handleImageUpload = async (e, fieldName) => {
  const file = e.target.files?.[0];
  setUploading((prev) => ({ ...prev, [fieldName]: true }));
  // ... upload to Cloudinary immediately
  const { url } = await res.json();
  setKycData((prev) => ({ ...prev, [fieldName]: url }));
};
```

**AFTER**: Store locally only
```typescript
const handleImageUpload = async (e, fieldName) => {
  const file = e.target.files?.[0];
  if (!file) return;
  
  // Just store file locally
  setSelectedFiles((prev) => ({
    ...prev,
    [fieldName]: file,
  }));
  
  addToast('Image selected. Will be uploaded when you submit KYC.', 'success');
};
```

### handleSubmit (Before → After)

**BEFORE**: Checked kycData for URLs
```typescript
const handleSubmit = async () => {
  if (!kycData.citizenshipFront) {
    addToast('Please upload citizenship front image', 'error');
    return;
  }
  // ... submit directly with URLs
};
```

**AFTER**: Check selectedFiles, upload on submit
```typescript
const handleSubmit = async () => {
  if (!selectedFiles.citizenshipFront) {
    addToast('Please select citizenship front image', 'error');
    return;
  }
  
  // Upload all files in parallel
  const uploadPromises = [
    uploadFile(selectedFiles.citizenshipFront!, 'citizenshipFront'),
    uploadFile(selectedFiles.citizenshipBack!, 'citizenshipBack'),
    uploadFile(selectedFiles.selfieWithCitizenship!, 'selfieWithCitizenship'),
  ];
  
  const uploadResults = await Promise.all(uploadPromises);
  
  // Submit with publicIds
  const submissionData = {
    currentAddress: kycData.currentAddress,
    permanentAddress: kycData.permanentAddress,
    citizenshipFront: uploadResults[0],  // publicId
    citizenshipBack: uploadResults[1],
    selfieWithCitizenship: uploadResults[2],
  };
  
  // ... submit to /api/kyc
};
```

### Image Preview (Before → After)

**BEFORE**: Direct URL display (won't work for private images)
```tsx
{kycData.citizenshipFront ? (
  <img src={kycData.citizenshipFront} />  // Direct URL
) : ...}
```

**AFTER**: Local file preview with "Selected" badge
```tsx
{selectedFiles.citizenshipFront ? (
  <div className="relative group">
    <img
      src={URL.createObjectURL(selectedFiles.citizenshipFront)}
      alt="Preview"
      className="border-2 border-green-500"
    />
    <div className="bg-green-500 text-white text-xs px-2 py-1">
      Selected
    </div>
  </div>
) : ...}
```

---

## Testing Checklist

- [ ] Select image → preview appears with "Selected" badge
- [ ] Select another image → both preview
- [ ] Click X to remove image → removed from preview
- [ ] Submit without all images → error message
- [ ] Submit with all images → "Submitting..." spinner
- [ ] After submit → form becomes read-only
- [ ] Check Cloudinary → images in kyc/ folder marked private
- [ ] Admin dashboard → images load via signed URL
- [ ] Click image in admin → opens full-size in new tab
- [ ] Page refresh in admin → images load from cache

---

## Environment Variables Needed

```env
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
ADMIN_TOKEN=your-secure-admin-token
JWT_SECRET=your-jwt-secret
```

---

## Response Formats

### Upload Response (new format)
```json
{
  "publicId": "kyc/user-123/citizenship-front-abc",
  "filename": "kyc/user-123/citizenship-front-abc",
  "size": 245682
}
```

### Signed URL Response
```json
{
  "url": "https://res.cloudinary.com/demo/image/upload/s--sig--/kyc/user-123/doc.jpg"
}
```

---

## Security Improvements

| Aspect | Before | After |
|--------|--------|-------|
| Image Access | Public URLs | Private + Admin Only |
| URL Expiration | No | 1 hour signed URLs |
| Storage | Direct URLs | Cloudinary publicIds |
| Admin Auth | Basic token | Token + Folder validation |
| Upload Timing | Immediate | On form submit |

---

## Troubleshooting

### "Upload an image to submit" error
- **Cause**: Form checks selectedFiles before images selected
- **Fix**: Click upload box and select each image (should see "Selected" badge)

### Image not showing in preview
- **Cause**: File type validation failed
- **Fix**: Use JPG/PNG/WebP images, not PDF or other formats

### Submit button stays in "Submitting..." state
- **Cause**: Upload failed but error not caught
- **Fix**: Check browser console for error messages, verify Cloudinary credentials

### Admin can't see images
- **Cause**: Admin token invalid or images not uploaded
- **Fix**: Check ADMIN_TOKEN env variable, verify images in Cloudinary

### "Failed to load image" in admin
- **Cause**: Signed URL request failed or expired
- **Fix**: Page refresh will generate new signed URL, check admin token

---

## Files Modified

1. **src/components/KYCForm.tsx** - Upload flow logic (MAIN FIX)
2. **src/app/api/kyc/upload/route.ts** - Return publicId (Minor change)
3. **src/app/api/kyc/signed-url/route.ts** - NEW endpoint for admin viewing
4. **src/app/admin/kyc/page.tsx** - Fetch signed URLs (Already updated)

---

## Success Indicators

✅ User can select and preview 3 KYC images
✅ Submit button uploads all images in parallel
✅ Form displays "Successfully submitted" message
✅ Admin can view KYC images via signed URLs
✅ Images stored as private in Cloudinary
✅ Database stores publicIds, not URLs
✅ Signed URLs expire after 1 hour
✅ No direct access to private documents

---

## References

- [Cloudinary Documentation](https://cloudinary.com/documentation)
- [Signed URLs (Private Images)](https://cloudinary.com/documentation/transformation_reference#sign_url)
- [Upload API Responses](https://cloudinary.com/documentation/upload_widget_reference)
