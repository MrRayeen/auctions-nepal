"use client";

import { useState, useEffect } from "react";
import { Timer } from "lucide-react";
import { motion } from "framer-motion";

interface TimeRemaining {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  isExpired: boolean;
}

function calculateTimeRemaining(endDateInput: string | Date): TimeRemaining {
  const endDate = new Date(endDateInput);
  const now = new Date();
  const diff = Math.max(0, endDate.getTime() - now.getTime());

  const isExpired = diff === 0;
  const totalSeconds = Math.floor(diff / 1000);
  const days = Math.floor(totalSeconds / (24 * 3600));
  const hours = Math.floor((totalSeconds % (24 * 3600)) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  return { days, hours, minutes, seconds, isExpired };
}

function formatTimeDisplay(time: TimeRemaining): string {
  if (time.isExpired) return "Auction Ended";

  if (time.days > 0) {
    return `${time.days}d ${time.hours}h`;
  } else if (time.hours > 0) {
    return `${time.hours}h ${time.minutes}m`;
  } else if (time.minutes > 0) {
    return `${time.minutes}m ${time.seconds}s`;
  } else {
    return `${time.seconds}s`;
  }
}

interface AuctionTimerProps {
  endDate: string | Date;
  compact?: boolean;
}

export default function AuctionTimer({
  endDate,
  compact = false,
}: AuctionTimerProps) {
  // Initialize state
  const [timeRemaining, setTimeRemaining] = useState<TimeRemaining>(() =>
    calculateTimeRemaining(endDate)
  );

  useEffect(() => {
    // Update immediately on mount to fix potential server/client hydration mismatch
    setTimeRemaining(calculateTimeRemaining(endDate));

    const interval = setInterval(() => {
      setTimeRemaining(calculateTimeRemaining(endDate));
    }, 1000);

    return () => clearInterval(interval);
  }, [endDate]);

  const displayText = formatTimeDisplay(timeRemaining);

  const containerClasses = compact
    ? `glass-panel px-2 py-1 rounded-full flex items-center gap-2 text-white text-xs border-white/20 shadow-sm`
    : `glass-panel px-2 sm:px-6 py-2 sm:py-3 rounded-full flex items-center gap-3 text-white border-white/30 shadow-[0_0_30px_rgba(245,158,11,0.2)]`;

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`${containerClasses} ${
        timeRemaining.isExpired ? "opacity-50" : ""
      }`}
    >
      <Timer
        className={`text-nepal-accent ${
          !timeRemaining.isExpired ? "animate-pulse" : ""
        }`}
        size={compact ? 14 : 20}
      />

      {/* Expanded View */}
      {!compact && (
        <div className="flex flex-col leading-none">
          <span className="text-[10px] uppercase tracking-widest opacity-70">
            Time Remaining
          </span>
          <span className="sm:text-xl font-mono font-bold tracking-wider">
            {displayText}
          </span>
        </div>
      )}

      {/* Compact View */}
      {compact && <span className="font-mono font-bold">{displayText}</span>}
    </motion.div>
  );
}
