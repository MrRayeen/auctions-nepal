"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Search, Filter, ArrowRight } from "lucide-react";
import AuctionCard from "@/components/auctions/AuctionCard";
import Link from "next/link";
import { AUCTION_CONSTANTS } from '@/lib/constants';

interface Auction {
  id: number;
  slug?: string;
  title: string;
  description: string;
  imageUrl?: string;
  currentPrice: number;
  startingPrice: number;
  endTime: string;
  seller: {
    id: number;
    name?: string;
    email: string;
  };
  bids: any[];
}

export default function AuctionsPage() {
  const [auctions, setAuctions] = useState<Auction[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedSubCategory, setSelectedSubCategory] = useState("");

  const categories = AUCTION_CONSTANTS.CATEGORY_OPTIONS;
  const selectedCategoryObj = categories.find((c) => c.id === selectedCategory) || null;

  useEffect(() => {
    const fetchAuctions = async () => {
      try {
        setLoading(true);
        const params = new URLSearchParams();
        if (search) params.append('search', search);
        if (selectedCategory && selectedCategory !== 'all') params.append('category', selectedCategory);
        if (selectedSubCategory) params.append('subCategory', selectedSubCategory);
        const res = await fetch(`/api/auctions?${params.toString()}`);
        const data = await res.json();
        setAuctions(data.auctions);
      } catch (error) {
        console.error("Failed to fetch auctions:", error);
      } finally {
        setLoading(false);
      }
    };

    const timer = setTimeout(() => {
      fetchAuctions();
    }, 300);

    return () => clearTimeout(timer);
  }, [search]);

  return (
    <main className="min-h-screen relative overflow-x-hidden pt-24 pb-16">
      {/* Background Blobs */}
      <div className="fixed top-0 left-0 w-96 h-96 bg-purple-500/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="fixed bottom-0 right-0 w-96 h-96 bg-blue-500/10 rounded-full blur-[120px] pointer-events-none" />

      <div className="container mx-auto px-4 relative z-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-12"
        >
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
            <div>
              <h1 className="text-4xl md:text-5xl font-bold text-white mb-2">
                Live Auctions
              </h1>
              <p className="text-gray-400">
                Discover thousands of items from sellers worldwide
              </p>
            </div>
            <Link
              href="/auctions/create"
              className="glass-button px-6 py-3 rounded-full flex items-center gap-2 w-fit"
            >
              Sell Item <ArrowRight size={18} />
            </Link>
          </div>

          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Search auctions..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-12 pr-4 py-3 rounded-full glass-panel bg-white/5 border-white/20 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-nepal-accent"
            />
          </div>
        </motion.div>

        {/* Category Filter */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-8 flex gap-2 flex-wrap items-center justify-center pb-2"
        >
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => { setSelectedCategory(cat.id); setSelectedSubCategory(''); }}
              className={`px-5 py-2.5 rounded-full whitespace-nowrap text-sm font-bold transition-all duration-300 ${
                selectedCategory === cat.id
                  ? "glass-button shadow-lg shadow-nepal-accent/50 scale-105"
                  : "glass-panel hover:bg-white/30 hover:shadow-lg hover:shadow-white/20"
              }`}
            >
              {cat.label}
            </button>
          ))}
        </motion.div>

        {/* Subcategory selector when a category (other than 'all') is chosen */}
        {selectedCategoryObj && selectedCategoryObj.sub.length > 0 && selectedCategory !== 'all' && (
          <div className="mb-8">
            <div className="flex items-center gap-3">
              <span className="text-sm text-gray-400">Subcategory:</span>
              <select
                value={selectedSubCategory}
                onChange={(e) => setSelectedSubCategory(e.target.value)}
                className="px-3 py-2 rounded-lg bg-white/5 border border-white/20 text-white"
              >
                <option value="">All</option>
                {selectedCategoryObj.sub.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
          </div>
        )}

        {/* Auctions Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <motion.div
                key={i}
                animate={{ opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="glass-panel rounded-2xl h-80"
              />
            ))}
          </div>
        ) : auctions.length > 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {auctions.map((auction, idx) => (
              <motion.div
                key={auction.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
              >
                <AuctionCard
                  id={auction.id}
                  slug={auction.slug}
                  title={auction.title}
                  description={auction.description}
                  imageUrl={auction.imageUrl}
                  currentPrice={auction.currentPrice}
                  startingPrice={auction.startingPrice}
                  endTime={auction.endTime}
                  seller={auction.seller}
                  bidsCount={auction.bids.length}
                />
              </motion.div>
            ))}
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-16"
          >
            <p className="text-gray-400 text-lg mb-4">No auctions found</p>
            <p className="text-gray-500">Try adjusting your search criteria</p>
          </motion.div>
        )}

        {/* Load More Button */}
        {auctions.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="flex justify-center mt-12"
          >
            <button className="glass-button px-8 py-3 rounded-full">
              Load More Auctions
            </button>
          </motion.div>
        )}
      </div>
    </main>
  );
}
