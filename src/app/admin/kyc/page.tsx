"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Check, X, Clock, ChevronDown, AlertCircle } from "lucide-react";
import { showToast } from "@/components/ui/Toast";

interface KYCSubmission {
  id: string;
  email: string;
  name: string;
  kycStatus: "PENDING" | "VERIFIED" | "REJECTED";
  currentAddress: string;
  permanentAddress: string;
  citizenshipFront: string;
  citizenshipBack: string;
  selfieWithCitizenship: string;
  kycSubmittedAt: string;
  kycVerifiedAt: string | null;
  kycRejectionReason: string | null;
}

export default function AdminKYCPage() {
  const [submissions, setSubmissions] = useState<KYCSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState<string>("");
  const [activeTab, setActiveTab] = useState<
    "PENDING" | "VERIFIED" | "REJECTED"
  >("PENDING");

  const [adminToken, setAdminToken] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("adminToken") || "";
    setAdminToken(token);
    if (token) fetchSubmissions(token);
  }, []);

  const fetchSubmissions = async (token: string) => {
    try {
      const res = await fetch("/api/kyc/admin", {
        headers: {
          "x-admin-token": token,
        },
      });

      if (!res.ok) {
        throw new Error("Failed to fetch submissions");
      }

      const data = await res.json();
      setSubmissions(data);
    } catch (err) {
      console.error(err);
      showToast("Failed to load KYC submissions", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (userId: string) => {
    setProcessingId(userId);
    try {
      const res = await fetch("/api/kyc/admin", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "x-admin-token": adminToken,
        },
        body: JSON.stringify({ userId, action: "VERIFY" }),
      });

      if (!res.ok) {
        throw new Error("Failed to approve KYC");
      }

      setSubmissions(
        submissions.map((sub) =>
          sub.id === userId
            ? {
                ...sub,
                kycStatus: "VERIFIED",
                kycVerifiedAt: new Date().toISOString(),
              }
            : sub
        )
      );
      showToast("KYC approved successfully", "success");
    } catch (err) {
      console.error(err);
      showToast("Failed to approve KYC", "error");
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (userId: string) => {
    if (!rejectReason.trim()) {
      showToast("Please provide a rejection reason", "error");
      return;
    }

    setProcessingId(userId);
    try {
      const res = await fetch("/api/kyc/admin", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "x-admin-token": adminToken,
        },
        body: JSON.stringify({
          userId,
          action: "REJECT",
          rejectionReason: rejectReason,
        }),
      });

      if (!res.ok) {
        throw new Error("Failed to reject KYC");
      }

      setSubmissions(
        submissions.map((sub) =>
          sub.id === userId
            ? {
                ...sub,
                kycStatus: "REJECTED",
                kycRejectionReason: rejectReason,
              }
            : sub
        )
      );
      setRejectReason("");
      showToast("KYC rejected", "success");
    } catch (err) {
      console.error(err);
      showToast("Failed to reject KYC", "error");
    } finally {
      setProcessingId(null);
    }
  };

  const filteredSubmissions = submissions.filter(
    (sub) => sub.kycStatus === activeTab
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case "PENDING":
        return "bg-yellow-50 border-yellow-200";
      case "VERIFIED":
        return "bg-green-50 border-green-200";
      case "REJECTED":
        return "bg-red-50 border-red-200";
      default:
        return "bg-gray-50 border-gray-200";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "PENDING":
        return <Clock className="w-5 h-5 text-yellow-600" />;
      case "VERIFIED":
        return <Check className="w-5 h-5 text-green-600" />;
      case "REJECTED":
        return <X className="w-5 h-5 text-red-600" />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-gray-600">Loading KYC submissions...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-blue-50 to-blue-100 p-6">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl font-bold text-gray-900 mb-8">
          KYC Verification Dashboard
        </h1>

        {/* Tab Navigation */}
        <div className="flex gap-4 mb-8 border-b">
          {(["PENDING", "VERIFIED", "REJECTED"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-6 py-3 font-medium transition-colors ${
                activeTab === tab
                  ? "text-nepal-accent border-b-2 border-nepal-accent"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              {tab} ({submissions.filter((s) => s.kycStatus === tab).length})
            </button>
          ))}
        </div>

        {/* Submissions List */}
        <div className="space-y-4">
          {filteredSubmissions.length === 0 ? (
            <div className="bg-white rounded-lg p-12 text-center">
              <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">
                No {activeTab.toLowerCase()} submissions
              </p>
            </div>
          ) : (
            filteredSubmissions.map((submission) => (
              <motion.div
                key={submission.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`border rounded-lg overflow-hidden transition-all ${getStatusColor(
                  submission.kycStatus
                )}`}
              >
                {/* Header */}
                <button
                  onClick={() =>
                    setExpandedId(
                      expandedId === submission.id ? null : submission.id
                    )
                  }
                  className="w-full p-6 flex items-center justify-between hover:bg-white/50 transition"
                >
                  <div className="flex items-center gap-4 text-left">
                    {getStatusIcon(submission.kycStatus)}
                    <div>
                      <p className="font-semibold text-gray-900">
                        {submission.name}
                      </p>
                      <p className="text-sm text-gray-600">
                        {submission.email}
                      </p>
                    </div>
                  </div>
                  <ChevronDown
                    className={`w-5 h-5 text-gray-600 transition-transform ${
                      expandedId === submission.id ? "rotate-180" : ""
                    }`}
                  />
                </button>

                {/* Expanded Details */}
                {expandedId === submission.id && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="border-t bg-white/60 p-6 space-y-6"
                  >
                    {/* Addresses */}
                    <div className="grid md:grid-cols-2 gap-6">
                      <div>
                        <p className="text-sm font-semibold text-gray-700 mb-2">
                          Current Address
                        </p>
                        <p className="text-gray-700 whitespace-pre-wrap">
                          {submission.currentAddress}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-gray-700 mb-2">
                          Permanent Address
                        </p>
                        <p className="text-gray-700 whitespace-pre-wrap">
                          {submission.permanentAddress}
                        </p>
                      </div>
                    </div>

                    {/* Documents */}
                    <div className="grid md:grid-cols-3 gap-6">
                      {[
                        {
                          label: "Citizenship Front",
                          publicId: submission.citizenshipFront,
                        },
                        {
                          label: "Citizenship Back",
                          publicId: submission.citizenshipBack,
                        },
                        {
                          label: "Selfie with Citizenship",
                          publicId: submission.selfieWithCitizenship,
                        },
                      ].map((doc) => (
                        <DocumentImage
                          key={doc.label}
                          label={doc.label}
                          publicId={doc.publicId}
                        />
                      ))}
                    </div>

                    {/* Metadata */}
                    <div className="pt-4 border-t space-y-2 text-sm text-gray-600">
                      <p>
                        Submitted:{" "}
                        {new Date(submission.kycSubmittedAt).toLocaleString()}
                      </p>
                      {submission.kycVerifiedAt && (
                        <p>
                          Verified:{" "}
                          {new Date(submission.kycVerifiedAt).toLocaleString()}
                        </p>
                      )}
                      {submission.kycRejectionReason && (
                        <div className="bg-red-100 p-3 rounded-lg mt-3">
                          <p className="font-semibold text-red-900">
                            Rejection Reason:
                          </p>
                          <p className="text-red-800">
                            {submission.kycRejectionReason}
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Action Buttons */}
                    {submission.kycStatus === "PENDING" && (
                      <div className="pt-6 border-t space-y-4">
                        <button
                          onClick={() => handleApprove(submission.id)}
                          disabled={processingId === submission.id}
                          className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-semibold py-2 rounded-lg transition"
                        >
                          {processingId === submission.id
                            ? "Processing..."
                            : "Approve KYC"}
                        </button>
                        <div className="space-y-2">
                          <textarea
                            placeholder="Reason for rejection (required)"
                            value={rejectReason}
                            onChange={(e) => setRejectReason(e.target.value)}
                            className="w-full border rounded-lg p-3 focus:ring-2 focus:ring-nepal-accent focus:border-transparent"
                            rows={3}
                          />
                          <button
                            onClick={() => handleReject(submission.id)}
                            disabled={processingId === submission.id}
                            className="w-full bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white font-semibold py-2 rounded-lg transition"
                          >
                            {processingId === submission.id
                              ? "Processing..."
                              : "Reject KYC"}
                          </button>
                        </div>
                      </div>
                    )}
                  </motion.div>
                )}
              </motion.div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * DocumentImage Component
 * Displays KYC documents directly from Cloudinary secure URLs.
 */
interface DocumentImageProps {
  label: string;
  publicId: string; // Now contains the direct Cloudinary URL
}

function DocumentImage({ label, publicId }: DocumentImageProps) {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!publicId || publicId.trim() === '') {
      console.warn(`No URL for document: ${label}`);
      setError(true);
      return;
    }

    // publicId is now actually a direct URL
    setImageUrl(publicId);
    setError(false);
  }, [publicId, label]);

  return (
    <div>
      <p className="text-sm font-semibold text-gray-700 mb-2">{label}</p>
      {error || !imageUrl ? (
        <div className="w-full h-48 bg-gray-300 rounded-lg flex items-center justify-center text-gray-600">
          No image available
        </div>
      ) : (
        <a
          href={imageUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="block border-2 border-nepal-accent rounded-lg overflow-hidden hover:opacity-75 transition"
        >
          <img
            src={imageUrl}
            alt={label}
            className="w-full h-48 object-cover"
          />
        </a>
      )}
    </div>
  );
}
