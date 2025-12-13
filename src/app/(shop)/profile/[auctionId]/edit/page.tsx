"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Upload, Trash2, GripVertical, Plus } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { useParams, useRouter } from "next/navigation";
import { useToast } from "@/components/ui/Toast";

interface Auction {
  id: number;
  title: string;
  description: string;
  startingPrice: number;
  currentPrice: number;
  minIncrement: number;
  endTime: string;
  tags?: string;
  images?: Array<{ id: number; url: string; order: number }>;
  bids: Array<{ id: number }>;
  status: string;
}

interface ImageFile {
  id?: number;
  url: string;
  order: number;
  file?: File;
  isNew?: boolean;
}

export default function EditAuctionPage() {
  const params = useParams();
  const router = useRouter();
  const auctionId = parseInt(params.auctionId as string);
  const { addToast } = useToast();

  const [auction, setAuction] = useState<Auction | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    startingPrice: 0,
    minIncrement: 0,
    endTime: "",
    tags: "",
    status: "ACTIVE",
  });
  const [images, setImages] = useState<ImageFile[]>([]);
  const [draggedItem, setDraggedItem] = useState<number | null>(null);

  useEffect(() => {
    const fetchAuction = async () => {
      try {
        const res = await fetch(`/api/auctions/${auctionId}`);
        if (!res.ok) throw new Error("Failed to fetch auction");

        const data = await res.json();
        setAuction(data);
        setFormData({
          title: data.title,
          description: data.description,
          startingPrice: data.startingPrice,
          minIncrement: data.minIncrement,
          endTime: new Date(data.endTime).toISOString().slice(0, 16),
          tags: data.tags || "",
          status: data.status || "ACTIVE",
        });
        setImages(
          data.images?.map((img: any) => ({
            id: img.id,
            url: img.url,
            order: img.order,
          })) || []
        );
      } catch (err) {
        addToast("Failed to load auction", "error");
        router.push("/profile");
      } finally {
        setLoading(false);
      }
    };

    fetchAuction();
  }, [auctionId, router, addToast]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    files.forEach((file) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const url = event.target?.result as string;
        setImages((prev) => [
          ...prev,
          {
            url,
            order: Math.max(0, ...prev.map((img) => img.order)) + 1,
            file,
            isNew: true,
          },
        ]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  const reorderImages = (fromIndex: number, toIndex: number) => {
    const newImages = [...images];
    const [removed] = newImages.splice(fromIndex, 1);
    newImages.splice(toIndex, 0, removed);
    setImages(newImages.map((img, idx) => ({ ...img, order: idx })));
  };

  const handleSave = async () => {
    if (!formData.title || !formData.description) {
      addToast("Title and description are required", "warning");
      return;
    }

    setSaving(true);
    try {
      // Upload new images first
      const uploadedImages = [];
      for (const img of images) {
        if (img.file && img.isNew) {
          const uploadFormData = new FormData();
          uploadFormData.append("file", img.file);

          const uploadRes = await fetch("/api/upload", {
            method: "POST",
            body: uploadFormData,
          });

          if (!uploadRes.ok) throw new Error("Image upload failed");
          const uploadData = await uploadRes.json();
          uploadedImages.push({
            url: uploadData.url,
            order: img.order,
          });
        } else if (img.id) {
          uploadedImages.push({
            id: img.id,
            url: img.url,
            order: img.order,
          });
        }
      }

      // Update auction
      const updateData = {
        ...formData,
        endTime: new Date(formData.endTime).toISOString(),
      };

      const res = await fetch(`/api/auctions/${auctionId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updateData),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to update auction");
      }

      addToast("Auction updated successfully!", "success");
      router.push("/profile");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Update failed";
      addToast(message, "error");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <main className="min-h-screen pb-16 pt-24 flex items-center justify-center">
        <div className="animate-spin text-nepal-accent">
          <Upload size={40} />
        </div>
      </main>
    );
  }

  if (!auction) {
    return (
      <main className="min-h-screen pb-16 pt-24">
        <div className="container mx-auto px-4">
          <p className="text-red-400">Auction not found</p>
        </div>
      </main>
    );
  }

  const canEditPrice = auction.bids.length === 0;

  return (
    <main className="min-h-screen pb-16 pt-24 relative overflow-x-hidden">
      <div className="fixed top-0 left-0 w-96 h-96 bg-purple-500/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="fixed bottom-0 right-0 w-96 h-96 bg-blue-500/10 rounded-full blur-[120px] pointer-events-none" />

      <div className="container mx-auto px-4 relative z-10 max-w-4xl">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-4 mb-8"
        >
          <Link href="/profile" className="glass-panel p-2 rounded-full hover:bg-white/20 transition-all">
            <ArrowLeft size={20} />
          </Link>
          <h1 className="text-3xl font-bold">Edit Listing</h1>
        </motion.div>

        {/* Form */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-panel rounded-3xl p-8 space-y-6"
        >
          {/* Basic Info */}
          <div className="space-y-4">
            <h2 className="text-2xl font-bold text-white">Listing Details</h2>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Title</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-4 py-2 rounded-lg bg-white/10 border border-white/20 text-white placeholder-gray-500 focus:outline-none focus:border-nepal-accent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={4}
                className="w-full px-4 py-2 rounded-lg bg-white/10 border border-white/20 text-white placeholder-gray-500 focus:outline-none focus:border-nepal-accent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Tags</label>
              <input
                type="text"
                value={formData.tags}
                onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                placeholder="Comma-separated tags"
                className="w-full px-4 py-2 rounded-lg bg-white/10 border border-white/20 text-white placeholder-gray-500 focus:outline-none focus:border-nepal-accent"
              />
            </div>
          </div>

          {/* Pricing Section */}
          <div className="space-y-4">
            <h3 className="text-xl font-bold text-white">Pricing</h3>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Starting Price {!canEditPrice && <span className="text-red-400">(Locked - Has Bids)</span>}
                </label>
                <input
                  type="number"
                  value={formData.startingPrice}
                  onChange={(e) => setFormData({ ...formData, startingPrice: parseFloat(e.target.value) })}
                  disabled={!canEditPrice}
                  className="w-full px-4 py-2 rounded-lg bg-white/10 border border-white/20 text-white placeholder-gray-500 focus:outline-none focus:border-nepal-accent disabled:opacity-50"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Min Increment</label>
                <input
                  type="number"
                  value={formData.minIncrement}
                  onChange={(e) => setFormData({ ...formData, minIncrement: parseFloat(e.target.value) })}
                  className="w-full px-4 py-2 rounded-lg bg-white/10 border border-white/20 text-white placeholder-gray-500 focus:outline-none focus:border-nepal-accent"
                />
              </div>
            </div>
          </div>

          {/* Timer Section */}
          <div className="space-y-4">
            <h3 className="text-xl font-bold text-white">Auction Duration</h3>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">End Time</label>
              <input
                type="datetime-local"
                value={formData.endTime}
                onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                className="w-full px-4 py-2 rounded-lg bg-white/10 border border-white/20 text-white placeholder-gray-500 focus:outline-none focus:border-nepal-accent"
              />
            </div>
          </div>

          {/* Status Section */}
          <div className="space-y-4">
            <h3 className="text-xl font-bold text-white">Status</h3>

            <select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              className="w-full px-4 py-2 rounded-lg bg-white/10 border border-white/20 text-white focus:outline-none focus:border-nepal-accent"
            >
              <option value="ACTIVE" className="bg-gray-800">
                Active
              </option>
              <option value="SOLD" className="bg-gray-800">
                Sold
              </option>
            </select>
          </div>

          {/* Images Section */}
          <div className="space-y-4">
            <h3 className="text-xl font-bold text-white">Images</h3>

            {/* Upload Area */}
            <div className="border-2 border-dashed border-nepal-accent/30 rounded-lg p-8 text-center">
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
                id="image-input"
              />
              <label
                htmlFor="image-input"
                className="cursor-pointer flex flex-col items-center gap-2"
              >
                <Upload size={32} className="text-nepal-accent" />
                <p className="text-white font-medium">Click or drag images to upload</p>
                <p className="text-gray-400 text-sm">PNG, JPG, GIF up to 5MB</p>
              </label>
            </div>

            {/* Image List */}
            {images.length > 0 && (
              <div className="space-y-2">
                {images.map((img, idx) => (
                  <div
                    key={idx}
                    draggable
                    onDragStart={() => setDraggedItem(idx)}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={() => {
                      if (draggedItem !== null && draggedItem !== idx) {
                        reorderImages(draggedItem, idx);
                        setDraggedItem(null);
                      }
                    }}
                    className="flex items-center gap-3 p-3 bg-white/5 rounded-lg border border-white/10 hover:border-nepal-accent/50 transition-all"
                  >
                    <GripVertical size={18} className="text-gray-500 cursor-grab" />
                    <div className="relative w-16 h-16 rounded overflow-hidden flex-shrink-0">
                      <Image
                        src={img.url}
                        alt="Preview"
                        fill
                        className="object-cover"
                      />
                    </div>
                    <div className="flex-1">
                      <p className="text-white text-sm truncate">{img.file?.name || "Existing image"}</p>
                      <p className="text-gray-400 text-xs">Position: {img.order + 1}</p>
                    </div>
                    <button
                      onClick={() => removeImage(idx)}
                      className="glass-panel p-2 rounded hover:bg-red-500/20 transition-colors"
                    >
                      <Trash2 size={16} className="text-red-400" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-4 pt-6 border-t border-white/10">
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex-1 glass-button px-6 py-3 rounded-full font-bold disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? "Saving..." : "Save Changes"}
            </button>
            <Link href="/profile" className="flex-1">
              <button className="w-full glass-panel px-6 py-3 rounded-full font-bold hover:bg-white/20 transition-all">
                Cancel
              </button>
            </Link>
          </div>
        </motion.div>
      </div>
    </main>
  );
}
