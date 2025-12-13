"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Heart, Loader } from "lucide-react";
import { useToast } from "@/components/ui/Toast";

interface FavoriteButtonProps {
  auctionId: number;
  isFavorited?: boolean;
  onFavoriteChange?: (favorited: boolean) => void;
}

export default function FavoriteButton({ auctionId, isFavorited = false, onFavoriteChange }: FavoriteButtonProps) {
  const [favorited, setFavorited] = useState(isFavorited);
  const [isLoading, setIsLoading] = useState(false);
  const { addToast } = useToast();

  useEffect(() => {
    setFavorited(isFavorited);
  }, [isFavorited]);

  const handleToggleFavorite = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem("authToken");
      if (!token) {
        addToast("You must be logged in to favorite items.", "error");
        setIsLoading(false);
        return;
      }
      const response = await fetch("/api/favorites", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ auctionId }),
      });

      if (!response.ok) throw new Error("Failed to update favorite status");
      
      const data = await response.json();
      const newFavoritedState = data.favorited;
      setFavorited(newFavoritedState);
      onFavoriteChange?.(newFavoritedState);
      addToast(newFavoritedState ? "Added to favorites" : "Removed from favorites", "success");
    } catch (error) {
      console.error("Failed to toggle favorite:", error);
      addToast(error instanceof Error ? error.message : "Could not update favorites.", "error");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <motion.button
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.95 }}
      onClick={handleToggleFavorite}
      disabled={isLoading}
      className="relative w-12 h-12 flex items-center justify-center rounded-full glass-panel hover:bg-white/20 transition-all disabled:opacity-50"
      title={favorited ? "Remove from favorites" : "Add to favorites"}
    >
      <AnimatePresence>
        {isLoading ? (
          <motion.div key="loading" initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.5 }} className="absolute">
            <Loader size={22} className="animate-spin text-gray-300" />
          </motion.div>
        ) : (
          <motion.div
            key="icon"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
          >
            <Heart
              size={22}
              className={`transition-all ${favorited ? "fill-red-500 text-red-500" : "text-gray-300"}`}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </motion.button>
  );
}
