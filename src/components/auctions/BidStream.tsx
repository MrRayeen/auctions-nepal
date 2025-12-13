"use client";
import { motion, AnimatePresence } from "framer-motion";
import { UserRound } from "lucide-react";

interface Bid {
  id: string | number;
  user: string;
  amount: number;
  timestamp: string;
}

export default function BidStream({ bids }: { bids: Bid[] }) {
  return (
    <div className="relative h-[300px] w-full overflow-hidden flex flex-col justify-end mask-image-gradient">
      {/* Gradient Mask to fade out top items */}
      <div className="absolute top-0 left-0 w-full h-20 bg-gradient-to-b from-nepal-900 to-transparent z-10 pointer-events-none" />

      <div className="flex flex-col-reverse gap-3 p-4">
        <AnimatePresence initial={false}>
          {bids.map((bid) => (
            <motion.div
              key={bid.id}
              initial={{ opacity: 0, x: 20, scale: 0.9 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.5 }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
              className="glass-panel p-3 rounded-2xl flex items-center gap-3 border-l-4 border-l-nepal-accent bg-black/40"
            >
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-purple-500 to-blue-500 flex items-center justify-center text-xs font-bold">
                {bid.user.charAt(0)}
              </div>
              <div className="flex-1">
                <div className="flex justify-between items-baseline">
                  <span className="text-sm font-bold text-white">
                    {bid.user}
                  </span>
                  <span className="text-xs text-gray-400">{bid.timestamp}</span>
                </div>
                <div className="text-nepal-accent font-mono font-bold">
                  Rs. {bid.amount.toLocaleString("en-IN")}
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
