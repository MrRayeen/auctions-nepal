"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import Image from "next/image";
import AuctionTimer from "./AuctionTimer";
import ImageViewer from "./ImageViewer";

interface ImageCarouselProps {
  images: Array<{ url: string; order: number }>;
  title: string;
  endTime?: string;
  status?: string;
}

export default function ImageCarousel({ images, title, endTime, status }: ImageCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isViewerOpen, setIsViewerOpen] = useState(false);

  // Use provided images, fallback to default
  const displayImages = images && images.length > 0 ? images : [
    { url: "https://images.unsplash.com/photo-1694956792421-e946fff94564?fm=jpg&q=60&w=3000", order: 0 }
  ];

  const goToPrevious = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIndex((prevIndex) =>
      prevIndex === 0 ? displayImages.length - 1 : prevIndex - 1
    );
  };

  const goToNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIndex((prevIndex) =>
      prevIndex === displayImages.length - 1 ? 0 : prevIndex + 1
    );
  };

  const goToSlide = (index: number) => {
    setCurrentIndex(index);
  };

  return (
    <div className="space-y-4">
      {/* Main Image */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        onClick={() => setIsViewerOpen(true)}
        className="relative aspect-video rounded-3xl overflow-hidden glass-panel group cursor-pointer"
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={currentIndex}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="relative w-full h-full"
          >
            <Image
              src={displayImages[currentIndex].url}
              alt={`${title} - Image ${currentIndex + 1}`}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-300"
              priority
            />
          </motion.div>
        </AnimatePresence>

        {/* Navigation Arrows */}
        {displayImages.length > 1 && (
          <>
            <button
              onClick={goToPrevious}
              className="absolute left-4 top-1/2 -translate-y-1/2 p-2 rounded-full glass-panel hover:bg-white/30 transition-all z-10 group-hover:opacity-100 opacity-0"
              aria-label="Previous image"
            >
              <ChevronLeft size={24} className="text-white" />
            </button>
            <button
              onClick={goToNext}
              className="absolute right-4 top-1/2 -translate-y-1/2 p-2 rounded-full glass-panel hover:bg-white/30 transition-all z-10 group-hover:opacity-100 opacity-0"
              aria-label="Next image"
            >
              <ChevronRight size={24} className="text-white" />
            </button>

            {/* Image Counter */}
            <div className="absolute top-4 right-4 glass-panel px-3 py-1 rounded-full text-sm font-bold">
              {currentIndex + 1} / {displayImages.length}
            </div>

            {/* Auction Status/Timer Overlay */}
            {status === "SOLD" ? (
              <div className="absolute bottom-4 left-4 z-20">
                <div className="glass-panel px-6 py-3 rounded-full">
                  <p className="text-lg font-bold text-red-400 uppercase">Sold</p>
                </div>
              </div>
            ) : endTime ? (
              <div className="absolute bottom-4 left-4 z-20">
                <AuctionTimer endDate={new Date(endTime)} />
              </div>
            ) : null}
          </>
        )}
        
        {/* Status/Timer for single image */}
        {displayImages.length === 1 && (
          <div className="absolute bottom-4 left-4 z-20">
            {status === "SOLD" ? (
              <div className="glass-panel px-6 py-3 rounded-full">
                <p className="text-lg font-bold text-red-400 uppercase">Sold</p>
              </div>
            ) : endTime ? (
              <AuctionTimer endDate={new Date(endTime)} />
            ) : null}
          </div>
        )}
      </motion.div>

      {/* Thumbnail Strip */}
      {displayImages.length > 1 && (
        <div className="flex gap-3 px-2 overflow-x-auto py-2">
          {displayImages.map((image, index) => (
            <motion.button
              key={index}
              onClick={() => goToSlide(index)}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className={`relative flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden transition-all p-3 ${
                currentIndex === index
                  ? "ring-2 ring-nepal-accent scale-105"
                  : "glass-panel hover:ring-1 hover:ring-white/50"
              }`}
            >
              <Image
                src={image.url}
                alt={`Thumbnail ${index + 1}`}
                fill
                className="object-cover"
              />
            </motion.button>
          ))}
        </div>
      )}

      {/* Image Viewer Modal */}
      <ImageViewer
        isOpen={isViewerOpen}
        images={displayImages.map((img) => img.url)}
        currentIndex={currentIndex}
        onClose={() => setIsViewerOpen(false)}
        onNavigate={setCurrentIndex}
      />
    </div>
  );
}
