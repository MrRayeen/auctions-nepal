"use client";

import dynamic from "next/dynamic";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Plus, X, Upload, GripVertical, Trash2, MapPin } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { compressImageFile, formatFileSize } from "@/lib/imageCompressor";
import { AUCTION_CONSTANTS } from "@/lib/constants";

const LocationPickerMap = dynamic(
  () => import("@/components/auctions/LocationPickerMap"),
  { ssr: false }
);

import type { LocationData } from "@/components/auctions/LocationPickerMap";

interface Tag {
  key: string;
  value: string;
}

interface UploadedImage {
  id: string;
  url: string;
  file: File;
  preview: string;
  size: number;
}

export default function CreateAuctionPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [uploadImages, setUploadImages] = useState<UploadedImage[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [draggedImage, setDraggedImage] = useState<string | null>(null);
  const [userId, setUserId] = useState<number | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [tags, setTags] = useState<Tag[]>(AUCTION_CONSTANTS.DEFAULT_TAGS);
  const [newTagKey, setNewTagKey] = useState("");
  const [newTagValue, setNewTagValue] = useState("");

  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    startingPrice: "",
    minIncrement: "",
    endTime: "",
    category: "",
    subCategory: "",
    locationLat: 0,
    locationLng: 0,
    locationArea: "",
    locationCity: "",
    delivery: "Not Available",
  });
  const [location, setLocation] = useState<LocationData | null>(null);

  // Extract user ID from token on mount
  useEffect(() => {
    const token = localStorage.getItem("authToken");
    if (token) {
      setIsLoggedIn(true);
      try {
        // Decode JWT token to get userId
        const payload = JSON.parse(atob(token.split(".")[1]));
        setUserId(payload.userId);
      } catch (error) {
        console.error("Failed to extract user ID from token:", error);
      }
    } else {
      setIsLoggedIn(false);
    }
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Category helpers
  const categories = AUCTION_CONSTANTS.CATEGORY_OPTIONS;
  const selectedCategoryObj = categories.find((c) => c.id === formData.category) || null;

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    await handleImageFiles(files);
  };

  const handleImageFiles = async (files: FileList) => {
    const newImages: UploadedImage[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (!file.type.startsWith("image/")) continue;

      try {
        // Compress image to WebP
        const compressedFile = await compressImageFile(file, 2000, 2000, 0.8);
        
        // Create preview
        const reader = new FileReader();
        reader.onload = (e) => {
          const preview = e.target?.result as string;
          newImages.push({
            id: `${Date.now()}-${Math.random()}`,
            url: "",
            file: compressedFile,
            preview,
            size: compressedFile.size,
          });
        };
        reader.readAsDataURL(compressedFile);
      } catch (error) {
        console.error("Error compressing image:", error);
      }
    }

    // Wait for all previews to load
    setTimeout(() => {
      setUploadImages((prev) => [...prev, ...newImages]);
    }, 100);
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      handleImageFiles(e.target.files);
    }
  };

  const removeImage = (id: string) => {
    setUploadImages((prev) => prev.filter((img) => img.id !== id));
  };

  const handleImageDragStart = (id: string) => {
    setDraggedImage(id);
  };

  const handleImageDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleImageDrop = (targetId: string) => {
    if (!draggedImage || draggedImage === targetId) return;

    const draggedIndex = uploadImages.findIndex((img) => img.id === draggedImage);
    const targetIndex = uploadImages.findIndex((img) => img.id === targetId);

    const newImages = [...uploadImages];
    [newImages[draggedIndex], newImages[targetIndex]] = [
      newImages[targetIndex],
      newImages[draggedIndex],
    ];

    setUploadImages(newImages);
    setDraggedImage(null);
  };

  const handleTagChange = (index: number, field: "key" | "value", value: string) => {
    const newTags = [...tags];
    newTags[index][field] = value;
    setTags(newTags);
  };

  const addTag = () => {
    if (newTagKey.trim() && newTagValue.trim()) {
      setTags([...tags, { key: newTagKey, value: newTagValue }]);
      setNewTagKey("");
      setNewTagValue("");
    }
  };

  const removeTag = (index: number) => {
    setTags(tags.filter((_, i) => i !== index));
  };

  const handleLocationChange = (locationData: LocationData) => {
    setLocation(locationData);
    setFormData(prev => ({
      ...prev,
      locationLat: locationData.lat,
      locationLng: locationData.lng,
      locationArea: locationData.area,
      locationCity: locationData.city,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (!userId) {
        alert("Please log in to create an auction");
        setIsLoading(false);
        return;
      }

      if (uploadImages.length === 0) {
        alert("Please upload at least one image");
        setIsLoading(false);
        return;
      }

      // Upload images first
      const formDataImages = new FormData();
      uploadImages.forEach((img) => {
        formDataImages.append("files", img.file);
      });

      const uploadRes = await fetch("/api/upload", {
        method: "POST",
        body: formDataImages,
      });

      if (!uploadRes.ok) {
        throw new Error("Failed to upload images");
      }

      const uploadedData = await uploadRes.json();
      const imageUrls = uploadedData.files.map((f: any) => f.url);

      // Convert tags array to JSON object
      const tagsObject = tags.reduce((acc, tag) => {
        if (tag.key && tag.value) {
          acc[tag.key] = tag.value;
        }
        return acc;
      }, {} as Record<string, string>);

      const auctionData = {
        title: formData.title,
        description: formData.description,
        category: formData.category || null,
        subCategory: formData.subCategory || null,
        startingPrice: parseFloat(formData.startingPrice),
        currentPrice: parseFloat(formData.startingPrice),
        minIncrement: parseFloat(formData.minIncrement) || 100,
        startTime: new Date(),
        endTime: new Date(formData.endTime),
        tags: JSON.stringify(tagsObject),
        imageUrl: imageUrls[0], // Set first image as main
        locationLat: formData.locationLat,
        locationLng: formData.locationLng,
        locationArea: formData.locationArea,
        locationCity: formData.locationCity,
        delivery: formData.delivery,
        images: imageUrls.map((url: string, index: number) => ({
          url,
          order: index,
        })),
        sellerId: userId,
      };

      const res = await fetch("/api/auctions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(auctionData),
      });

      if (!res.ok) {
        throw new Error("Failed to create auction");
      }

      const newAuction = await res.json();
      router.push(`/auctions/${newAuction.slug}`);
    } catch (error) {
      console.error("Error creating auction:", error);
      alert("Failed to create auction: " + (error instanceof Error ? error.message : "Unknown error"));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="min-h-screen pb-24 pt-24 relative overflow-x-hidden">
      {!isLoggedIn ? (
        <div className="flex-1 flex items-center justify-center min-h-screen">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center space-y-6 max-w-md mx-auto px-4"
          >
            <div className="w-24 h-24 rounded-full bg-linear-to-br from-nepal-accent to-purple-500 mx-auto flex items-center justify-center">
              <Upload size={48} className="text-white" />
            </div>
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">Start Selling</h1>
              <p className="text-gray-400 mb-6">Sign in to create your first auction and reach thousands of buyers</p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Link href="/auth/login">
                  <button className="glass-button px-8 py-3 rounded-full font-bold">
                    Login
                  </button>
                </Link>
                <Link href="/auth/signup">
                  <button className="px-8 py-3 rounded-full border border-white/20 hover:bg-white/10 transition-colors text-white font-bold">
                    Sign Up
                  </button>
                </Link>
              </div>
            </div>
          </motion.div>
        </div>
      ) : (
        <>
          <div className="fixed top-0 right-0 w-[500px] h-[500px] bg-purple-600/20 blur-[120px] rounded-full pointer-events-none z-0" />

          <div className="container mx-auto px-4 relative z-10">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="max-w-4xl mx-auto"
            >
              <Link href="/auctions" className="flex items-center gap-2 text-nepal-accent hover:underline mb-8">
                <ArrowLeft size={20} />
                Back to Auctions
              </Link>

              <div className="glass-panel p-8 rounded-3xl">
                <h1 className="text-4xl font-bold text-white mb-2">Create New Auction</h1>
                <p className="text-gray-400 mb-8">List your item for auction. Be detailed and honest for better results.</p>            <form onSubmit={handleSubmit} className="space-y-8">
              {/* Image Upload */}
              <div>
                <label className="block text-sm font-bold text-gray-300 mb-4">Product Images</label>
                
                {/* Drag and Drop Area */}
                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-2xl p-8 text-center transition-all cursor-pointer ${
                    isDragging
                      ? "border-nepal-accent bg-nepal-accent/10"
                      : "border-white/20 hover:border-white/40"
                  }`}
                >
                  <Upload className="mx-auto mb-3 text-nepal-accent" size={32} />
                  <p className="text-white font-bold mb-1">Drag and drop images here</p>
                  <p className="text-gray-400 text-sm mb-4">or click to select files</p>
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handleFileInput}
                    className="hidden"
                    id="imageInput"
                  />
                  <label htmlFor="imageInput">
                    <button type="button" className="glass-button px-6 py-2 rounded-full text-sm font-bold cursor-pointer inline-block">
                      Select Images
                    </button>
                  </label>
                  <p className="text-xs text-gray-500 mt-3">Images will be automatically compressed to WebP format</p>
                </div>

                {/* Image Preview Grid */}
                {uploadImages.length > 0 && (
                  <div className="mt-6">
                    <p className="text-sm text-gray-400 mb-3">
                      {uploadImages.length} image{uploadImages.length !== 1 ? "s" : ""} selected
                    </p>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                      <AnimatePresence>
                        {uploadImages.map((img, index) => (
                          <motion.div
                            key={img.id}
                            draggable
                            onDragStart={() => handleImageDragStart(img.id)}
                            onDragOver={handleImageDragOver}
                            onDrop={() => handleImageDrop(img.id)}
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            className="relative group cursor-move"
                          >
                            <div className="relative w-full aspect-square rounded-lg overflow-hidden glass-panel">
                              <Image
                                src={img.preview}
                                alt={`Preview ${index + 1}`}
                                fill
                                className="object-cover"
                              />
                              {index === 0 && (
                                <div className="absolute top-2 left-2 bg-nepal-accent text-black text-xs font-bold px-2 py-1 rounded">
                                  Primary
                                </div>
                              )}
                              
                              {/* Drag Handle */}
                              <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity bg-black/70 p-2 rounded">
                                <GripVertical size={16} className="text-nepal-accent" />
                              </div>

                              {/* Remove Button */}
                              <motion.button
                                type="button"
                                onClick={() => removeImage(img.id)}
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.95 }}
                                className="absolute bottom-2 right-2 p-1 rounded glass-panel hover:bg-white/30 transition-colors opacity-0 group-hover:opacity-100"
                              >
                                <Trash2 size={16} className="text-red-400" />
                              </motion.button>
                            </div>
                            <p className="text-xs text-gray-400 mt-1 text-center truncate">
                              {formatFileSize(img.size)}
                            </p>
                          </motion.div>
                        ))}
                      </AnimatePresence>
                    </div>
                  </div>
                )}
              </div>

              {/* Title */}
              <div>
                <label className="block text-sm font-bold text-gray-300 mb-2">Auction Title</label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  placeholder="e.g., MacBook Pro M3 Max 2023"
                  required
                  className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/20 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-nepal-accent"
                />
              </div>

              {/* Category selector */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-gray-300 mb-2">Category</label>
                  <select
                    name="category"
                    value={formData.category}
                    onChange={(e) => setFormData((p) => ({ ...p, category: e.target.value, subCategory: "" }))}
                    className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/20 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-nepal-accent"
                  >
                    <option value="">Select category</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>{c.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-300 mb-2">Subcategory</label>
                  <select
                    name="subCategory"
                    value={formData.subCategory}
                    onChange={(e) => setFormData((p) => ({ ...p, subCategory: e.target.value }))}
                    disabled={!selectedCategoryObj || selectedCategoryObj.sub.length === 0}
                    className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/20 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-nepal-accent"
                  >
                    <option value="">Select subcategory</option>
                    {selectedCategoryObj?.sub.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-bold text-gray-300 mb-2">Description</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  placeholder="Describe your item in detail..."
                  rows={5}
                  required
                  className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/20 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-nepal-accent resize-none"
                />
              </div>

              {/* Location Picker */}
              <div>
                <label className="text-sm font-bold text-gray-300 mb-2 flex items-center gap-2">
                  <MapPin size={16} />
                  Item Location (Optional)
                </label>
                <LocationPickerMap onLocationSelect={handleLocationChange} />
                {location && (
                  <div className="mt-4 p-3 rounded-lg bg-white/5 border border-white/20">
                    <p className="text-sm text-gray-300">
                      <span className="font-bold">{location.area || "Unknown Area"}</span>
                      {location.city && <span>, {location.city}</span>}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      Coordinates: {location.lat.toFixed(4)}, {location.lng.toFixed(4)}
                    </p>
                  </div>
                )}
              </div>

              {/* Delivery Option */}
              <div>
                <label className="block text-sm font-bold text-gray-300 mb-2">Delivery Option</label>
                <select
                  name="delivery"
                  value={formData.delivery}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/20 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-nepal-accent"
                >
                  <option value="Not Available">Not Available</option>
                  <option value="Only in my City">Only in my City</option>
                  <option value="Paid Delivery">Paid Delivery</option>
                </select>
              </div>

              {/* Price and End Time */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-bold text-gray-300 mb-2">Starting Price (Rs.)</label>
                  <input
                    type="number"
                    name="startingPrice"
                    value={formData.startingPrice}
                    onChange={handleInputChange}
                    placeholder="50000"
                    min="1"
                    required
                    className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/20 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-nepal-accent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-300 mb-2">Minimum Bid Increment (Rs.)</label>
                  <input
                    type="number"
                    name="minIncrement"
                    value={formData.minIncrement}
                    onChange={handleInputChange}
                    placeholder="100"
                    min="10"
                    required
                    className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/20 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-nepal-accent"
                  />
                  <p className="text-xs text-gray-400 mt-1">Buyers must bid in this increment</p>
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-300 mb-2">Auction End Time</label>
                  <input
                    type="datetime-local"
                    name="endTime"
                    value={formData.endTime}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/20 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-nepal-accent"
                  />
                </div>
              </div>

              {/* Product Details/Tags */}
              <div>
                <label className="block text-sm font-bold text-gray-300 mb-4">Product Details</label>
                <div className="space-y-3 mb-4">
                  {tags.map((tag, index) => (
                    <div key={index} className="flex gap-3">
                      <div className="flex-1">
                        <input
                          type="text"
                          value={tag.key}
                          onChange={(e) => handleTagChange(index, "key", e.target.value)}
                          placeholder="e.g., Color"
                          className="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/20 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-nepal-accent text-sm"
                        />
                      </div>
                      <div className="flex-[1.5]">
                        <input
                          type="text"
                          value={tag.value}
                          onChange={(e) => handleTagChange(index, "value", e.target.value)}
                          placeholder="e.g., Space Gray"
                          className="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/20 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-nepal-accent text-sm"
                        />
                      </div>
                      {tags.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeTag(index)}
                          className="p-2 rounded-lg glass-panel hover:bg-white/20 transition-colors text-red-400"
                        >
                          <X size={18} />
                        </button>
                      )}
                    </div>
                  ))}
                </div>

                {/* Add New Tag */}
                <div className="glass-panel p-4 rounded-lg space-y-3">
                  <p className="text-sm text-gray-400">Add More Details</p>
                  <div className="flex gap-3">
                    <input
                      type="text"
                      value={newTagKey}
                      onChange={(e) => setNewTagKey(e.target.value)}
                      placeholder="Detail name"
                      className="flex-1 px-3 py-2 rounded-lg bg-white/5 border border-white/20 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-nepal-accent text-sm"
                    />
                    <input
                      type="text"
                      value={newTagValue}
                      onChange={(e) => setNewTagValue(e.target.value)}
                      placeholder="Detail value"
                      className="flex-[1.5] px-3 py-2 rounded-lg bg-white/5 border border-white/20 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-nepal-accent text-sm"
                    />
                    <button
                      type="button"
                      onClick={addTag}
                      className="px-4 py-2 rounded-lg glass-panel hover:bg-white/20 transition-colors text-nepal-accent font-bold flex items-center gap-2"
                    >
                      <Plus size={18} />
                      Add
                    </button>
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <div className="flex gap-4 pt-4">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="flex-1 glass-button py-4 rounded-lg font-bold text-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  {isLoading ? "Creating..." : "Create Auction"}
                </button>
                <Link href="/auctions" className="flex-1">
                  <button type="button" className="w-full py-4 rounded-lg glass-panel font-bold text-lg hover:bg-white/20 transition-all">
                    Cancel
                  </button>
                </Link>
              </div>
            </form>
          </div>
        </motion.div>
      </div>
        </>
      )}
    </main>
  );
}
