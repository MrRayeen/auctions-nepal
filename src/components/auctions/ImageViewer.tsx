"use client";

import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ZoomIn, ZoomOut } from "lucide-react";
import Image from "next/image";

interface ImageViewerProps {
  isOpen: boolean;
  images: string[];
  currentIndex: number;
  onClose: () => void;
  onNavigate?: (index: number) => void;
}

export default function ImageViewer({
  isOpen,
  images,
  currentIndex,
  onClose,
  onNavigate,
}: ImageViewerProps) {
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const imageContainerRef = useRef<HTMLDivElement>(null);

  const currentImage = images[currentIndex] || "";

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft" && onNavigate) {
        onNavigate(Math.max(0, currentIndex - 1));
      }
      if (e.key === "ArrowRight" && onNavigate) {
        onNavigate(Math.min(images.length - 1, currentIndex + 1));
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, currentIndex, images.length, onNavigate, onClose]);

  const handleZoomIn = () => {
    setZoom((prev) => Math.min(prev + 0.2, 3));
  };

  const handleZoomOut = () => {
    setZoom((prev) => Math.max(prev - 0.2, 1));
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (zoom === 1) return;
    setIsDragging(true);
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;

    const container = imageContainerRef.current;
    if (!container) return;

    const maxX = (container.offsetWidth * (zoom - 1)) / 2;
    const maxY = (container.offsetHeight * (zoom - 1)) / 2;

    let newX = e.clientX - dragStart.x;
    let newY = e.clientY - dragStart.y;

    newX = Math.max(-maxX, Math.min(maxX, newX));
    newY = Math.max(-maxY, Math.min(maxY, newY));

    setPan({ x: newX, y: newY });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.1 : 0.1;
    setZoom((prev) => Math.max(1, Math.min(3, prev + delta)));
  };

  useEffect(() => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  }, [currentIndex]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 bg-black/95 z-50 flex items-center justify-center"
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-6 right-6 p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors z-10"
          title="Close (ESC)"
        >
          <X size={24} className="text-white" />
        </button>

        {/* Image Counter */}
        <div className="absolute top-6 left-6 text-white font-mono text-sm bg-black/50 px-4 py-2 rounded-full">
          {currentIndex + 1} / {images.length}
        </div>

        {/* Zoom Controls */}
        <div className="absolute bottom-6 left-6 flex gap-2 bg-black/50 p-3 rounded-full">
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleZoomOut();
            }}
            className="p-2 rounded-full hover:bg-white/20 transition-colors"
            title="Zoom Out"
          >
            <ZoomOut size={20} className="text-white" />
          </button>
          <div className="text-white text-xs font-mono px-3 flex items-center min-w-[60px] text-center justify-center">
            {Math.round(zoom * 100)}%
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleZoomIn();
            }}
            className="p-2 rounded-full hover:bg-white/20 transition-colors"
            title="Zoom In"
          >
            <ZoomIn size={20} className="text-white" />
          </button>
        </div>

        {/* Navigation Buttons */}
        {images.length > 1 && (
          <>
            <button
              onClick={(e) => {
                e.stopPropagation();
                if (onNavigate) onNavigate(Math.max(0, currentIndex - 1));
              }}
              disabled={currentIndex === 0}
              className="absolute left-6 top-1/2 -translate-y-1/2 p-3 rounded-full bg-white/10 hover:bg-white/20 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              title="Previous (Left Arrow)"
            >
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>

            <button
              onClick={(e) => {
                e.stopPropagation();
                if (onNavigate) onNavigate(Math.min(images.length - 1, currentIndex + 1));
              }}
              disabled={currentIndex === images.length - 1}
              className="absolute right-6 top-1/2 -translate-y-1/2 p-3 rounded-full bg-white/10 hover:bg-white/20 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              title="Next (Right Arrow)"
            >
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </>
        )}

        {/* Image Container */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          onClick={(e) => e.stopPropagation()}
          ref={imageContainerRef}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onWheel={handleWheel}
          className={`relative w-full h-full max-w-4xl max-h-4xl flex items-center justify-center ${
            zoom > 1 ? "cursor-grab active:cursor-grabbing" : "cursor-default"
          }`}
        >
          <motion.div
            animate={{
              scale: zoom,
              x: pan.x,
              y: pan.y,
            }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="relative w-full h-full"
          >
            <Image
              src={currentImage}
              alt={`Image ${currentIndex + 1}`}
              fill
              className="object-contain select-none"
              priority
            />
          </motion.div>
        </motion.div>

        {/* Instructions */}
        <div className="absolute bottom-6 right-6 text-white text-xs bg-black/50 px-4 py-3 rounded-lg max-w-xs text-right">
          <p>Scroll to zoom • Drag to pan • Arrow keys to navigate</p>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
