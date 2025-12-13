"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { AlertCircle, Loader, DollarSign, Plus, Minus, Zap } from "lucide-react";

interface AutoBidProps {
  auctionId: number;
  currentPrice: number;
  onAutoBidUpdate?: (enabled: boolean, maxAmount: number) => void;
}

export default function AutoBidSection({ auctionId, currentPrice, onAutoBidUpdate }: AutoBidProps) {
  const [showAutobid, setShowAutobid] = useState(false);
  const [maxBidAmount, setMaxBidAmount] = useState(currentPrice + 1000);
  const [isLoading, setIsLoading] = useState(false);
  const [enabled, setEnabled] = useState(false);
  const [error, setError] = useState("");

  const handleSetupAutoBid = async () => {
    if (maxBidAmount <= currentPrice) {
      setError("Max bid must be higher than current price");
      return;
    }

    setIsLoading(true);
    try {
      const token = localStorage.getItem("authToken");
      const response = await fetch("/api/auto-bid", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ auctionId, maxBidAmount, enabled: true }),
      });

      if (!response.ok) throw new Error("Failed to set auto-bid");
      setEnabled(true);
      setError("");
      onAutoBidUpdate?.(true, maxBidAmount);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to enable auto-bid");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDisableAutoBid = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem("authToken");
      const response = await fetch(`/api/auto-bid?auctionId=${auctionId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) throw new Error("Failed to disable auto-bid");
      setEnabled(false);
      setError("");
      onAutoBidUpdate?.(false, 0);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to disable auto-bid");
    } finally {
      setIsLoading(false);
    }
  };

  if (!showAutobid && !enabled) {
    return (
      <button
        onClick={() => setShowAutobid(true)}
        className="w-full glass-panel py-4 text-lg flex items-center justify-center gap-2 hover:bg-white/20 transition-all"
      >
        <Zap size={20} className="text-yellow-400" />
        Set Up Auto-Bid
      </button>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: "auto" }}
      exit={{ opacity: 0, height: 0 }}
      className="glass-panel rounded-3xl p-6 space-y-4 border border-yellow-500/20"
    >
      <div className="flex items-center gap-2 mb-4">
        <Zap size={20} className="text-yellow-400" />
        <h3 className="font-bold text-white">Automatic Bidding</h3>
      </div>

      <p className="text-sm text-gray-400">
        We'll automatically bid on your behalf up to your maximum amount when others bid.
      </p>

      {error && (
        <div className="flex gap-2 bg-red-500/10 border border-red-500/20 rounded-lg p-3 text-red-400 text-sm">
          <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {enabled ? (
        <div className="bg-white/5 border border-green-500/20 rounded-lg p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-400">Max Bid Amount</span>
            <span className="text-lg font-bold text-green-400">
              Rs. {maxBidAmount.toLocaleString("en-IN")}
            </span>
          </div>
          <p className="text-xs text-green-400">✓ Auto-bid enabled</p>
          <button
            onClick={handleDisableAutoBid}
            disabled={isLoading}
            className="w-full py-2 rounded-lg bg-red-500/20 hover:bg-red-500/30 text-red-400 font-bold text-sm disabled:opacity-50"
          >
            {isLoading ? <Loader className="animate-spin mx-auto" size={16} /> : "Disable Auto-Bid"}
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="bg-white/5 rounded-lg p-4 space-y-2">
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm text-gray-300">Maximum Bid Amount (Rs.)</label>
              <span className="text-lg font-bold text-nepal-accent">
                {maxBidAmount.toLocaleString("en-IN")}
              </span>
            </div>
            <input
              type="range"
              min={currentPrice + 100}
              max={currentPrice + 1000000}
              value={maxBidAmount}
              onChange={(e) => setMaxBidAmount(Number(e.target.value))}
              className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer"
            />
            <div className="flex gap-2 mt-3">
              <button
                onClick={() => setMaxBidAmount(Math.max(currentPrice + 100, maxBidAmount - 10000))}
                className="flex-1 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-sm"
              >
                <Minus size={16} className="mx-auto" />
              </button>
              <input
                type="number"
                value={maxBidAmount}
                onChange={(e) => setMaxBidAmount(Number(e.target.value))}
                min={currentPrice + 100}
                className="flex-1 px-3 py-2 rounded-lg bg-white/5 border border-white/20 text-white text-center"
              />
              <button
                onClick={() => setMaxBidAmount(maxBidAmount + 10000)}
                className="flex-1 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-sm"
              >
                <Plus size={16} className="mx-auto" />
              </button>
            </div>
            <p className="text-xs text-gray-400 mt-2">
              Minimum: Rs. {(currentPrice + 100).toLocaleString("en-IN")}
            </p>
          </div>

          <button
            onClick={handleSetupAutoBid}
            disabled={isLoading || maxBidAmount <= currentPrice}
            className="w-full glass-button py-3 rounded-lg font-bold text-lg flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <>
                <Loader size={20} className="animate-spin" />
                Enabling...
              </>
            ) : (
              <>
                <Zap size={20} />
                Enable Auto-Bid
              </>
            )}
          </button>
        </div>
      )}
    </motion.div>
  );
}
