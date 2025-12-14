# KYC Form Upload Logic Fix - Summary

## Problem Identified
1. **Images were uploading immediately** when file input changed (premature upload)
2. **Response was expecting `url`** but Cloudinary now returns `publicId`
3. **Image wasn't being stored in viewbox** because it tried to display direct URLs (which won't work for private Cloudinary documents)
4. **Form submission failed** because it checked for image URLs instead of selected files

## Solution Implemented

### 1. **Two-Stage Upload Process**
- **Stage 1 (File Selection)**: User selects image → stored locally in `selectedFiles` state (NO upload yet)
- **Stage 2 (Form Submission)**: User clicks "Submit KYC" → all files upload to Cloudinary → form submits with publicIds

### 2. **State Management Changes**

**Before:**
```typescript
const [uploading, setUploading] = useState<{ [key: string]: boolean }>({...});
const [kycData, setKycData] = useState<KYCData>({
  citizenshipFront: '', // Stored URLs directly (caused issues)
  ...
});
```

**After:**
```typescript
const [selectedFiles, setSelectedFiles] = useState<FileStorage>({
  citizenshipFront: null, // Stores File objects locally
  citizenshipBack: null,
  selfieWithCitizenship: null,
});

const [kycData, setKycData] = useState<KYCData>({
  citizenshipFront: '', // Now stores publicId after successful upload
  ...
});
```

### 3. **handleImageUpload Function**

**Before:**
- Uploaded file immediately to Cloudinary
- Stored response URL in kycData
- Showed loading spinner during upload

**After:**
```typescript
const handleImageUpload = async (
  e: React.ChangeEvent<HTMLInputElement>,
  fieldName: 'citizenshipFront' | 'citizenshipBack' | 'selfieWithCitizenship'
) => {
  const file = e.target.files?.[0];
  if (!file) return;

  // Validate file type
  if (!file.type.startsWith('image/')) {
    addToast('Please select a valid image file', 'error');
    return;
  }

  // Store file locally (will be uploaded on form submit)
  setSelectedFiles((prev) => ({
    ...prev,
    [fieldName]: file,
  }));

  addToast('Image selected. Will be uploaded when you submit KYC.', 'success');
};
```

### 4. **handleSubmit Function**

**Before:**
- Checked if kycData fields had values (expected URLs)
- Submitted directly with URLs

**After:**
```typescript
const handleSubmit = async () => {
  // Validation now checks selectedFiles instead
  if (!selectedFiles.citizenshipFront) {
    addToast('Please select citizenship front image', 'error');
    return;
  }
  // ... similar for other fields

  setSubmitting(true);
  try {
    // Upload all three files in parallel
    const uploadPromises = [
      uploadFile(selectedFiles.citizenshipFront!, 'citizenshipFront'),
      uploadFile(selectedFiles.citizenshipBack!, 'citizenshipBack'),
      uploadFile(selectedFiles.selfieWithCitizenship!, 'selfieWithCitizenship'),
    ];

    const uploadResults = await Promise.all(uploadPromises);

    // Check if any upload failed
    if (uploadResults.some(result => !result)) {
      throw new Error('One or more files failed to upload');
    }

    // Submit with publicIds (not URLs)
    const submissionData = {
      currentAddress: kycData.currentAddress,
      permanentAddress: kycData.permanentAddress,
      citizenshipFront: uploadResults[0], // publicId
      citizenshipBack: uploadResults[1],  // publicId
      selfieWithCitizenship: uploadResults[2], // publicId
    };

    // Submit to backend
    const res = await fetch('/api/kyc', {...});
    
    // Reset selected files after successful submission
    setSelectedFiles({
      citizenshipFront: null,
      citizenshipBack: null,
      selfieWithCitizenship: null,
    });
  }
};
```

### 5. **New uploadFile Helper Function**

```typescript
const uploadFile = async (
  file: File,
  fieldName: string
): Promise<string | null> => {
  try {
    const formData = new FormData();
    formData.append('file', file);

    const res = await fetch('/api/kyc/upload', {
      method: 'POST',
      body: formData,
    });

    if (!res.ok) {
      addToast(`Failed to upload ${fieldName}`, 'error');
      return null;
    }

    // Extract publicId from response
    const { publicId } = await res.json();
    return publicId;
  } catch (err) {
    addToast(`Failed to upload ${fieldName}`, 'error');
    return null;
  }
};
```

### 6. **Image Preview Display**

**Before:**
```tsx
{kycData.citizenshipFront ? (
  <img src={kycData.citizenshipFront} /> // Direct URL display
) : (
  <label>Click to upload</label>
)}
```

**After:**
```tsx
{selectedFiles.citizenshipFront ? (
  <div className="relative group">
    <img
      src={URL.createObjectURL(selectedFiles.citizenshipFront)}
      alt="Citizenship Front Preview"
      className="w-full h-48 object-cover rounded-lg border-2 border-green-500"
    />
    <div className="absolute top-2 left-2 bg-green-500 text-white text-xs font-semibold px-2 py-1 rounded">
      Selected
    </div>
    <button onClick={() => setSelectedFiles({...})}>
      <X className="w-4 h-4 text-white" />
    </button>
  </div>
) : (
  <label className="cursor-pointer">Click to select</label>
)}
```

## User Flow Now

1. ✅ User opens KYC form
2. ✅ User selects image → Preview shown with "Selected" badge
3. ✅ User enters addresses
4. ✅ User clicks "Submit KYC"
5. ✅ **All 3 images upload to Cloudinary in parallel** (shows "Submitting..." state)
6. ✅ After upload completes, form data (with publicIds) submitted to backend
7. ✅ KYC status changes to PENDING
8. ✅ Selected files reset, form becomes read-only

## Security Benefits
- Private images never publicly accessible (only admins can get signed URLs)
- No temporary URLs stored in frontend
- Images only uploaded after user explicitly submits form
- Backend stores publicIds, not URLs
- Cloudinary handles access control

## Database Impact
- KYC submission now stores Cloudinary `publicId` instead of URL
- Example: `kyc/user-123/citizenship-front-abc123` instead of `https://res.cloudinary.com/.../image.jpg`
- Admin dashboard fetches signed URLs on-demand when viewing documents
