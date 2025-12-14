'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Upload, Check, X, AlertCircle, Loader } from 'lucide-react';
import { useToast } from '@/components/ui/Toast';

interface KYCFormProps {
  userId: string;
  onComplete?: () => void;
}

interface KYCData {
  currentAddress: string;
  permanentAddress: string;
  citizenshipFront: string;
  citizenshipBack: string;
  selfieWithCitizenship: string;
  kycStatus: 'PENDING' | 'VERIFIED' | 'REJECTED' | null;
  kycRejectionReason: string | null;
}

// Interface for file objects before upload
interface FileStorage {
  [key: string]: File | null;
}

// Interface for uploaded file responses
interface UploadedFile {
  publicId: string;
  filename: string;
  size: number;
}

export default function KYCForm({ userId, onComplete }: KYCFormProps) {
  const { addToast } = useToast();
  const [kycData, setKycData] = useState<KYCData>({
    currentAddress: '',
    permanentAddress: '',
    citizenshipFront: '',
    citizenshipBack: '',
    selfieWithCitizenship: '',
    kycStatus: null,
    kycRejectionReason: null,
  });

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  
  // Store selected files locally (not uploaded yet)
  const [selectedFiles, setSelectedFiles] = useState<FileStorage>({
    citizenshipFront: null,
    citizenshipBack: null,
    selfieWithCitizenship: null,
  });

  useEffect(() => {
    fetchKYCData();
  }, []);

  const fetchKYCData = async () => {
    try {
      const token = localStorage.getItem('authToken');
      const res = await fetch('/api/kyc', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      if (res.ok) {
        const data = await res.json();
        setKycData({
          currentAddress: data.currentAddress || '',
          permanentAddress: data.permanentAddress || '',
          citizenshipFront: data.citizenshipFront || '',
          citizenshipBack: data.citizenshipBack || '',
          selfieWithCitizenship: data.selfieWithCitizenship || '',
          kycStatus: data.kycStatus || null,
          kycRejectionReason: data.kycRejectionReason || null,
        });
      }
    } catch (err) {
      console.error('Error fetching KYC data:', err);
    } finally {
      setLoading(false);
    }
  };

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

  const handleSubmit = async () => {
    // Validation
    if (!kycData.currentAddress.trim()) {
      addToast('Please enter your current address', 'error');
      return;
    }
    if (!kycData.permanentAddress.trim()) {
      addToast('Please enter your permanent address', 'error');
      return;
    }
    if (!selectedFiles.citizenshipFront) {
      addToast('Please select citizenship front image', 'error');
      return;
    }
    if (!selectedFiles.citizenshipBack) {
      addToast('Please select citizenship back image', 'error');
      return;
    }
    if (!selectedFiles.selfieWithCitizenship) {
      addToast('Please select selfie with citizenship', 'error');
      return;
    }

    setSubmitting(true);
    try {
      // Upload all three files to Cloudinary
      const uploadPromises = [
        uploadFile(selectedFiles.citizenshipFront!, 'citizenshipFront'),
        uploadFile(selectedFiles.citizenshipBack!, 'citizenshipBack'),
        uploadFile(selectedFiles.selfieWithCitizenship!, 'selfieWithCitizenship'),
      ];

      const uploadResults = await Promise.all(uploadPromises);

      if (uploadResults.some(result => !result)) {
        throw new Error('One or more files failed to upload');
      }

      // Prepare KYC submission data with uploaded publicIds
      const submissionData = {
        currentAddress: kycData.currentAddress,
        permanentAddress: kycData.permanentAddress,
        citizenshipFront: uploadResults[0],
        citizenshipBack: uploadResults[1],
        selfieWithCitizenship: uploadResults[2],
      };

      // Submit KYC with uploaded publicIds
      const token = localStorage.getItem('authToken');
      const res = await fetch('/api/kyc', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(submissionData),
      });

      if (!res.ok) {
        throw new Error('Failed to submit KYC');
      }

      const result = await res.json();
      setKycData((prev) => ({
        ...prev,
        kycStatus: result.user.kycStatus,
        citizenshipFront: uploadResults[0] || '',
        citizenshipBack: uploadResults[1] || '',
        selfieWithCitizenship: uploadResults[2] || '',
      }));

      // Reset selected files
      setSelectedFiles({
        citizenshipFront: null,
        citizenshipBack: null,
        selfieWithCitizenship: null,
      });

      addToast('KYC submitted successfully. Awaiting admin verification.', 'success');
      onComplete?.();
    } catch (err) {
      console.error('Submit error:', err);
      addToast('Failed to submit KYC. Please try again.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  /**
   * Upload a single file to Cloudinary and return its URL
   */
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
        console.error(`Upload failed for ${fieldName}:`, res.status);
        addToast(`Failed to upload ${fieldName}`, 'error');
        return null;
      }

      const { url } = await res.json();
      return url;
    } catch (err) {
      console.error(`Upload error for ${fieldName}:`, err);
      addToast(`Failed to upload ${fieldName}`, 'error');
      return null;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader className="w-6 h-6 animate-spin text-nepal-accent" />
      </div>
    );
  }

  const isVerified = kycData.kycStatus === 'VERIFIED';
  const isPending = kycData.kycStatus === 'PENDING';
  const isRejected = kycData.kycStatus === 'REJECTED';

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-panel rounded-2xl p-8"
    >
      <div className="flex items-center gap-3 mb-6">
        <h2 className="text-2xl font-bold text-white">KYC Verification</h2>
        {isVerified && <Check className="w-6 h-6 text-green-400" />}
        {isPending && <AlertCircle className="w-6 h-6 text-yellow-400" />}
        {isRejected && <X className="w-6 h-6 text-red-400" />}
      </div>

      {/* Status Display */}
      {isVerified && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 p-4 bg-green-500/20 border border-green-500/50 rounded-lg"
        >
          <p className="text-green-400 font-semibold flex items-center gap-2">
            <Check className="w-5 h-5" />
            Your KYC has been verified! You can now enjoy all features.
          </p>
        </motion.div>
      )}

      {isPending && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 p-4 bg-yellow-500/20 border border-yellow-500/50 rounded-lg"
        >
          <p className="text-yellow-400 font-semibold flex items-center gap-2">
            <AlertCircle className="w-5 h-5" />
            Your KYC submission is pending admin review.
          </p>
        </motion.div>
      )}

      {isRejected && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 p-4 bg-red-500/20 border border-red-500/50 rounded-lg"
        >
          <p className="text-red-400 font-semibold flex items-center gap-2">
            <X className="w-5 h-5" />
            Your KYC was rejected
          </p>
          {kycData.kycRejectionReason && (
            <p className="text-red-300 text-sm mt-2">Reason: {kycData.kycRejectionReason}</p>
          )}
        </motion.div>
      )}

      {/* Form - Only show if not verified */}
      {!isVerified && (
        <div className="space-y-6">
          {/* Current Address */}
          <div>
            <label className="block text-sm font-semibold text-gray-300 mb-2">Current Address</label>
            <textarea
              value={kycData.currentAddress}
              onChange={(e) =>
                setKycData((prev) => ({ ...prev, currentAddress: e.target.value }))
              }
              placeholder="Enter your current address"
              className="w-full px-4 py-3 rounded-lg bg-white/10 border border-white/20 text-white placeholder-gray-500 focus:outline-none focus:border-nepal-accent resize-none"
              rows={3}
              disabled={isPending}
            />
          </div>

          {/* Permanent Address */}
          <div>
            <label className="block text-sm font-semibold text-gray-300 mb-2">
              Permanent Address
            </label>
            <textarea
              value={kycData.permanentAddress}
              onChange={(e) =>
                setKycData((prev) => ({ ...prev, permanentAddress: e.target.value }))
              }
              placeholder="Enter your permanent address"
              className="w-full px-4 py-3 rounded-lg bg-white/10 border border-white/20 text-white placeholder-gray-500 focus:outline-none focus:border-nepal-accent resize-none"
              rows={3}
              disabled={isPending}
            />
          </div>

          {/* Document Uploads */}
          <div className="grid md:grid-cols-2 gap-6">
            {/* Citizenship Front */}
            <div>
              <label className="block text-sm font-semibold text-gray-300 mb-2">
                Citizenship Front
              </label>
              <div className="relative">
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
                    <button
                      onClick={() =>
                        setSelectedFiles((prev) => ({ ...prev, citizenshipFront: null }))
                      }
                      disabled={isPending}
                      className="absolute top-2 right-2 p-2 bg-red-500 rounded-full opacity-0 group-hover:opacity-100 transition disabled:opacity-50"
                    >
                      <X className="w-4 h-4 text-white" />
                    </button>
                  </div>
                ) : (
                  <label className="block w-full h-48 border-2 border-dashed border-nepal-accent rounded-lg p-4 cursor-pointer hover:bg-white/5 transition disabled:opacity-50">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleImageUpload(e, 'citizenshipFront')}
                      className="hidden"
                      disabled={isPending}
                    />
                    <div className="h-full flex flex-col items-center justify-center">
                      <Upload className="w-8 h-8 text-nepal-accent mb-2" />
                      <p className="text-sm text-gray-400">Click to select</p>
                    </div>
                  </label>
                )}
              </div>
            </div>

            {/* Citizenship Back */}
            <div>
              <label className="block text-sm font-semibold text-gray-300 mb-2">
                Citizenship Back
              </label>
              <div className="relative">
                {selectedFiles.citizenshipBack ? (
                  <div className="relative group">
                    <img
                      src={URL.createObjectURL(selectedFiles.citizenshipBack)}
                      alt="Citizenship Back Preview"
                      className="w-full h-48 object-cover rounded-lg border-2 border-green-500"
                    />
                    <div className="absolute top-2 left-2 bg-green-500 text-white text-xs font-semibold px-2 py-1 rounded">
                      Selected
                    </div>
                    <button
                      onClick={() =>
                        setSelectedFiles((prev) => ({ ...prev, citizenshipBack: null }))
                      }
                      disabled={isPending}
                      className="absolute top-2 right-2 p-2 bg-red-500 rounded-full opacity-0 group-hover:opacity-100 transition disabled:opacity-50"
                    >
                      <X className="w-4 h-4 text-white" />
                    </button>
                  </div>
                ) : (
                  <label className="block w-full h-48 border-2 border-dashed border-nepal-accent rounded-lg p-4 cursor-pointer hover:bg-white/5 transition">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleImageUpload(e, 'citizenshipBack')}
                      className="hidden"
                      disabled={isPending}
                    />
                    <div className="h-full flex flex-col items-center justify-center">
                      <Upload className="w-8 h-8 text-nepal-accent mb-2" />
                      <p className="text-sm text-gray-400">Click to select</p>
                    </div>
                  </label>
                )}
              </div>
            </div>
          </div>

          {/* Selfie with Citizenship */}
          <div>
            <label className="block text-sm font-semibold text-gray-300 mb-2">
              Selfie with Citizenship
            </label>
            <div className="relative">
              {selectedFiles.selfieWithCitizenship ? (
                <div className="relative group">
                  <img
                    src={URL.createObjectURL(selectedFiles.selfieWithCitizenship)}
                    alt="Selfie with Citizenship Preview"
                    className="w-full h-48 object-cover rounded-lg border-2 border-green-500"
                  />
                  <div className="absolute top-2 left-2 bg-green-500 text-white text-xs font-semibold px-2 py-1 rounded">
                    Selected
                  </div>
                  <button
                    onClick={() =>
                      setSelectedFiles((prev) => ({ ...prev, selfieWithCitizenship: null }))
                    }
                    disabled={isPending}
                    className="absolute top-2 right-2 p-2 bg-red-500 rounded-full opacity-0 group-hover:opacity-100 transition disabled:opacity-50"
                  >
                    <X className="w-4 h-4 text-white" />
                  </button>
                </div>
              ) : (
                <label className="block w-full h-48 border-2 border-dashed border-nepal-accent rounded-lg p-4 cursor-pointer hover:bg-white/5 transition">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleImageUpload(e, 'selfieWithCitizenship')}
                    className="hidden"
                    disabled={isPending}
                  />
                  <div className="h-full flex flex-col items-center justify-center">
                    <Upload className="w-8 h-8 text-nepal-accent mb-2" />
                    <p className="text-sm text-gray-400">Click to select</p>
                  </div>
                </label>
              )}
            </div>
          </div>

          {/* Submit Button */}
          <button
            onClick={handleSubmit}
            disabled={submitting || isPending}
            className="w-full glass-button py-3 rounded-lg font-bold disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {submitting ? (
              <>
                <Loader className="w-4 h-4 animate-spin" />
                Submitting...
              </>
            ) : (
              <>
                <Check className="w-4 h-4" />
                Submit KYC
              </>
            )}
          </button>
        </div>
      )}
    </motion.div>
  );
}
