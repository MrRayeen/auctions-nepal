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
  const [uploading, setUploading] = useState<{ [key: string]: boolean }>({
    citizenshipFront: false,
    citizenshipBack: false,
    selfieWithCitizenship: false,
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

    setUploading((prev) => ({ ...prev, [fieldName]: true }));

    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('/api/kyc/upload', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        throw new Error('Upload failed');
      }

      const { url } = await res.json();
      setKycData((prev) => ({
        ...prev,
        [fieldName]: url,
      }));
      addToast('Image uploaded successfully', 'success');
    } catch (err) {
      console.error('Upload error:', err);
      addToast('Failed to upload image', 'error');
    } finally {
      setUploading((prev) => ({ ...prev, [fieldName]: false }));
    }
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
    if (!kycData.citizenshipFront) {
      addToast('Please upload citizenship front image', 'error');
      return;
    }
    if (!kycData.citizenshipBack) {
      addToast('Please upload citizenship back image', 'error');
      return;
    }
    if (!kycData.selfieWithCitizenship) {
      addToast('Please upload selfie with citizenship', 'error');
      return;
    }

    setSubmitting(true);
    try {
      const token = localStorage.getItem('authToken');
      const res = await fetch('/api/kyc', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          currentAddress: kycData.currentAddress,
          permanentAddress: kycData.permanentAddress,
          citizenshipFront: kycData.citizenshipFront,
          citizenshipBack: kycData.citizenshipBack,
          selfieWithCitizenship: kycData.selfieWithCitizenship,
        }),
      });

      if (!res.ok) {
        throw new Error('Failed to submit KYC');
      }

      const result = await res.json();
      setKycData((prev) => ({
        ...prev,
        kycStatus: result.user.kycStatus,
      }));
      addToast('KYC submitted successfully. Awaiting admin verification.', 'success');
      onComplete?.();
    } catch (err) {
      console.error('Submit error:', err);
      addToast('Failed to submit KYC', 'error');
    } finally {
      setSubmitting(false);
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
                {kycData.citizenshipFront ? (
                  <div className="relative group">
                    <img
                      src={kycData.citizenshipFront}
                      alt="Citizenship Front"
                      className="w-full h-48 object-cover rounded-lg border-2 border-nepal-accent"
                    />
                    <button
                      onClick={() =>
                        setKycData((prev) => ({ ...prev, citizenshipFront: '' }))
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
                      disabled={isPending || uploading.citizenshipFront}
                    />
                    <div className="h-full flex flex-col items-center justify-center">
                      {uploading.citizenshipFront ? (
                        <Loader className="w-8 h-8 animate-spin text-nepal-accent mb-2" />
                      ) : (
                        <>
                          <Upload className="w-8 h-8 text-nepal-accent mb-2" />
                          <p className="text-sm text-gray-400">Click to upload</p>
                        </>
                      )}
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
                {kycData.citizenshipBack ? (
                  <div className="relative group">
                    <img
                      src={kycData.citizenshipBack}
                      alt="Citizenship Back"
                      className="w-full h-48 object-cover rounded-lg border-2 border-nepal-accent"
                    />
                    <button
                      onClick={() =>
                        setKycData((prev) => ({ ...prev, citizenshipBack: '' }))
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
                      disabled={isPending || uploading.citizenshipBack}
                    />
                    <div className="h-full flex flex-col items-center justify-center">
                      {uploading.citizenshipBack ? (
                        <Loader className="w-8 h-8 animate-spin text-nepal-accent mb-2" />
                      ) : (
                        <>
                          <Upload className="w-8 h-8 text-nepal-accent mb-2" />
                          <p className="text-sm text-gray-400">Click to upload</p>
                        </>
                      )}
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
              {kycData.selfieWithCitizenship ? (
                <div className="relative group">
                  <img
                    src={kycData.selfieWithCitizenship}
                    alt="Selfie with Citizenship"
                    className="w-full h-48 object-cover rounded-lg border-2 border-nepal-accent"
                  />
                  <button
                    onClick={() =>
                      setKycData((prev) => ({ ...prev, selfieWithCitizenship: '' }))
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
                    disabled={isPending || uploading.selfieWithCitizenship}
                  />
                  <div className="h-full flex flex-col items-center justify-center">
                    {uploading.selfieWithCitizenship ? (
                      <Loader className="w-8 h-8 animate-spin text-nepal-accent mb-2" />
                    ) : (
                      <>
                        <Upload className="w-8 h-8 text-nepal-accent mb-2" />
                        <p className="text-sm text-gray-400">Click to upload</p>
                      </>
                    )}
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
