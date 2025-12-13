"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { MoreVertical, AlertTriangle, Loader, Check } from "lucide-react";
import { useToast } from "@/components/ui/Toast";

interface ReportButtonProps {
  auctionId: number;
  onReportSubmitted?: () => void;
}

const REPORT_REASONS = [
  { id: "FRAUD_SCAM", label: "Fraud/Scam", icon: "🚨" },
  { id: "HARMFUL_WEAPON_DRUGS", label: "Harmful/Weapon/Drugs", icon: "⚠️" },
  { id: "OTHER", label: "Other", icon: "📝" },
];

export default function ReportButton({ auctionId, onReportSubmitted }: ReportButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [selectedReason, setSelectedReason] = useState("");
  const [description, setDescription] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const { addToast } = useToast();

  const handleSubmitReport = async () => {
    if (!selectedReason) {
      addToast("Please select a reason for the report.", "error");
      return;
    }
    
    setIsLoading(true);
    try {
      const token = localStorage.getItem("authToken");
      if (!token) {
        addToast("You must be logged in to report items.", "error");
        setIsLoading(false);
        return;
      }
      
      const response = await fetch("/api/reports", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          auctionId,
          reason: selectedReason,
          description: description.trim() || null,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to submit report");
      }

      setSuccess(true);
      addToast("Report submitted successfully. Thank you for your feedback.", "success");
      
      setTimeout(() => {
        setShowModal(false);
        setIsOpen(false);
        // Reset state
        setSelectedReason("");
        setDescription("");
        setSuccess(false);
        onReportSubmitted?.();
      }, 1500);

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "An unknown error occurred.";
      addToast(errorMessage, "error");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <div className="relative">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setIsOpen(!isOpen)}
          className="w-12 h-12 flex items-center justify-center rounded-full glass-panel hover:bg-white/20 transition-all"
          title="More options"
        >
          <MoreVertical size={22} className="text-gray-300" />
        </motion.button>

        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute top-14 -right-20 bg-black/80 backdrop-blur-md border border-white/20 rounded-lg overflow-hidden z-50 min-w-[180px] shadow-lg"
          >
            <button
              onClick={() => {
                setShowModal(true);
                setIsOpen(false);
              }}
              className="w-full px-4 py-3 text-left text-sm text-red-400 hover:bg-red-500/10 flex items-center gap-3 transition-colors"
            >
              <AlertTriangle size={18} />
              <span className="font-semibold">Report Listing</span>
            </button>
            {/* Future options can be added here */}
          </motion.div>
        )}
      </div>

      {/* Report Modal */}
      {showModal && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => !isLoading && setShowModal(false)}
          className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-[100] p-4"
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-gray-900 border border-white/20 rounded-3xl max-w-md w-full p-6 sm:p-8 space-y-6"
          >
            <div>
              <h2 className="text-2xl font-bold text-white mb-2">Report Listing</h2>
              <p className="text-sm text-gray-400">Your feedback is important. Help us maintain a safe marketplace.</p>
            </div>

            {success ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-8"
              >
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', delay: 0.2 }}
                  className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-500/20 mb-4"
                >
                  <Check size={32} className="text-green-400" />
                </motion.div>
                <p className="text-lg text-green-400 font-bold">Thank You!</p>
                <p className="text-sm text-gray-400">Your report has been submitted.</p>
              </motion.div>
            ) : (
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-bold text-gray-300 block mb-3">Select a Reason</label>
                  <div className="space-y-2">
                    {REPORT_REASONS.map((reason) => (
                      <motion.button
                        key={reason.id}
                        whileHover={{ x: 4 }}
                        onClick={() => setSelectedReason(reason.id)}
                        className={`w-full text-left p-3 rounded-lg border-2 transition-all ${
                          selectedReason === reason.id
                            ? "bg-red-500/20 border-red-500/50"
                            : "bg-white/5 border-transparent hover:bg-white/10"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-xl">{reason.icon}</span>
                          <span className="font-semibold text-white">{reason.label}</span>
                        </div>
                      </motion.button>
                    ))}
                  </div>
                </div>

                {selectedReason === "OTHER" && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    className="pt-2"
                  >
                    <label className="text-sm font-bold text-gray-300 block mb-2">Additional Details (Optional)</label>
                    <textarea
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Please provide more information..."
                      className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/20 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-nepal-accent resize-none"
                      rows={4}
                    />
                  </motion.div>
                )}

                <div className="flex flex-col sm:flex-row gap-3 pt-4">
                  <button
                    onClick={() => setShowModal(false)}
                    disabled={isLoading}
                    className="w-full px-4 py-3 rounded-lg glass-panel hover:bg-white/20 font-bold transition-all disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSubmitReport}
                    disabled={isLoading || !selectedReason}
                    className="w-full px-4 py-3 rounded-lg bg-red-600 hover:bg-red-700 text-white font-bold disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {isLoading ? (
                      <>
                        <Loader size={18} className="animate-spin" />
                        Submitting...
                      </>
                    ) : (
                      <>
                        <AlertTriangle size={18} />
                        Submit Report
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </>
  );
}
