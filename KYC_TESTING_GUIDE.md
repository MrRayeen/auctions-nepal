# KYC Upload Fix - Testing & Verification Guide

## What Was Fixed

### Issue: Images uploading immediately and not persisting in form
- ❌ **Before**: Clicking image input → upload happens → URL stored → page refresh loses data
- ✅ **After**: Selecting image → stored locally → submit click → upload happens → persists to DB

### Issue: Form validation failing with "upload image" error
- ❌ **Before**: Checked `kycData.citizenshipFront` (URL) which was empty after page load
- ✅ **After**: Checks `selectedFiles.citizenshipFront` (File object) before submit

### Issue: Cloudinary returning `publicId` but form expecting `url`
- ❌ **Before**: Extracted `url` from response → display attempted on private document
- ✅ **After**: Extracts `publicId` → stores in DB → admin fetches signed URLs for viewing

---

## Testing Steps

### Test 1: Basic Upload Flow
1. Navigate to profile page → KYC Verification section
2. **Expected**: Form is empty with dashed upload areas
3. Click on "Citizenship Front" upload box
4. Select an image file
5. **Expected**: 
   - Image preview appears immediately
   - "Selected" badge visible in top-left
   - Toast: "Image selected. Will be uploaded when you submit KYC."
   - Upload does NOT happen yet
6. Enter current and permanent addresses
7. Select the other two images (Back, Selfie)
8. **Expected**: All three preview with "Selected" badges
9. Click "Submit KYC" button
10. **Expected**: Button shows "Submitting..." with loading spinner
11. Wait for submission to complete
12. **Expected**:
    - Toast: "KYC submitted successfully. Awaiting admin verification."
    - Form becomes read-only (disabled)
    - Status changes to "pending admin review"
    - All images still show in preview (but now from DB)

### Test 2: File Removal
1. Follow Test 1 until images are selected (before submit)
2. Hover over any image preview
3. Click the red X button in top-right corner
4. **Expected**: Image removed from preview, upload box returns to dashed state
5. Try to submit without that image
6. **Expected**: Toast error: "Please select citizenship front image"

### Test 3: Cloudinary Verification
1. Complete Test 1 (submit KYC)
2. Go to Cloudinary dashboard → Media Library
3. Look for `kyc/` folder
4. **Expected**: Your 3 uploaded images visible with `type: private`
5. Verify images are marked as **private** (not public)

### Test 4: Admin View
1. Login as admin
2. Navigate to Admin Dashboard → KYC Verification tab
3. Find your submitted KYC
4. Click to expand
5. **Expected**: Images load with a brief spinner (fetching signed URL)
6. Images display correctly (admin fetches signed URL server-side)
7. Click on any image to open full-size
8. **Expected**: Link works (signed URL valid for 1 hour)
9. Refresh page → images still load (cache hit, no new request)

### Test 5: Page Refresh During Selection
1. Start filling KYC form
2. Select images (don't submit yet)
3. Refresh the page (Ctrl+R)
4. **Expected**: 
   - Form reloads with empty upload areas
   - Selected files lost (expected - they're only in localStorage)
   - ⚠️ This is normal - images only persist after submit

### Test 6: Invalid Files
1. Try to select a non-image file (PDF, text, etc.)
2. **Expected**: Toast error: "Please select a valid image file"
3. File not added to form

### Test 7: Parallel Upload Success
1. Add all three images
2. Submit form
3. **Expected**: All three images upload simultaneously
4. Network tab shows 3 POST requests to `/api/kyc/upload` at same time
5. All complete successfully before final form submission

### Test 8: Upload Failure Handling
1. Try to submit with invalid credentials (if possible to test)
2. **Expected**: Toast: "Failed to upload [filename]"
3. Form doesn't submit if any upload fails
4. User can retry

### Test 9: Database Verification
1. Complete Test 1 successfully
2. Query database for user's kyc record
3. Check `citizenshipFront` field
4. **Expected**: Contains `publicId` format like `kyc/user-123/filename...`
5. NOT a full URL like `https://res.cloudinary.com/...`

### Test 10: Admin Signed URL Generation
1. Login as admin
2. Navigate to KYC submission in dashboard
3. Open browser DevTools → Network tab
4. Expand the KYC submission
5. **Expected**: 
   - Network call to `/api/kyc/signed-url` with POST method
   - Request body: `{ "publicId": "kyc/..." }`
   - Response: `{ "url": "https://res.cloudinary.com/...?signature=..." }`
6. Verify URL has `sign_url=true` parameter (indicates signed URL)

---

## Success Criteria

✅ **Form Flow**
- Images selected locally without uploading immediately
- Preview shows selected files with "Selected" badge
- Submit button triggers parallel uploads
- Form submits after uploads complete
- Selected files reset after successful submission

✅ **Data Integrity**
- Cloudinary stores images as `type: private`
- Database stores `publicId` (not URL)
- No direct URLs accessible for private documents

✅ **Admin Access**
- Admin can view KYC images via signed URLs
- Signed URLs expire after 1 hour
- URLs are cryptographically signed by Cloudinary
- Folder validation prevents accessing non-KYC documents

✅ **Error Handling**
- Invalid files rejected with clear message
- Upload failures prevent form submission
- Validation errors show helpful messages
- Network errors handled gracefully

---

## Common Issues & Solutions

### Issue: "No image shown in viewbox"
**Possible Causes:**
1. Image hasn't been selected yet → Click upload box and select image
2. Upload didn't complete → Check network tab for errors
3. Form refreshed after selection → Images only persist after submit

### Issue: "Upload an image to submit" error
**Possible Causes:**
1. Forgot to select an image → Select all three images before submit
2. Clicked X to remove image → Re-select the image
3. Wrong field type → Ensure it's an image file (JPG, PNG, etc.)

### Issue: Image doesn't persist after submit
**Expected Behavior:**
- After successful submit, form should become read-only
- Admin can view images via signed URL endpoint
- Images are stored as Cloudinary `publicId`, not direct URLs

### Issue: Admin can't see images in dashboard
**Possible Causes:**
1. Admin token invalid → Check ADMIN_TOKEN env variable
2. Images not uploaded yet → Verify they appear in Cloudinary dashboard
3. Signed URL endpoint error → Check server logs for `/api/kyc/signed-url` errors

### Issue: Signed URL expires too quickly
**Expected Behavior:**
- URLs valid for 1 hour from generation
- Client caches them for 50 minutes
- After refresh, new signed URL is fetched
- This is working as intended for security

---

## Environment Setup Checklist

- [ ] `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME` set in `.env.local`
- [ ] `CLOUDINARY_API_KEY` set in `.env.local`
- [ ] `CLOUDINARY_API_SECRET` set in `.env.local`
- [ ] `ADMIN_TOKEN` set in `.env.local`
- [ ] JWT_SECRET set in `.env.local`
- [ ] Cloudinary account has KYC folder created
- [ ] Database migrations run (user table has KYC fields)

---

## Files Modified
- `src/components/KYCForm.tsx` - Upload flow and preview logic
- `src/app/api/kyc/upload/route.ts` - Returns `publicId` instead of `url`
- `src/app/api/kyc/signed-url/route.ts` - NEW: Generates signed URLs for admin
- `src/app/admin/kyc/page.tsx` - Fetches signed URLs for image display
- `src/app/api/kyc/route.ts` - Already handles `publicId` correctly

---

## Rollback Information

If issues arise, previous behavior can be restored by:
1. Reverting KYCForm to check `kycData` instead of `selectedFiles`
2. Removing the `uploadFile` function and batch upload logic
3. Reverting upload response handling to extract `url`
4. Removing signed URL endpoint

However, this would reintroduce the original issues and security problems.
