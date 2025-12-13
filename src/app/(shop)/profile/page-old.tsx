"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { User, ShoppingBag, Heart, Settings, LogOut, Edit2, Lock, Mail, Phone, Star, AlertCircle } from "lucide-react";
import Link from "next/link";

interface UserProfile {
  id: number;
  email: string;
  fullName?: string;
  phone?: string;
  name?: string;
  listings?: number;
  sold?: number;
  followers?: number;
}

export default function ProfilePage() {
  const [activeTab, setActiveTab] = useState("listings");
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    // Check if user is logged in by checking localStorage for token
    const token = localStorage.getItem("authToken");
    if (token) {
      setIsLoggedIn(true);
      fetchUserProfile(token);
    } else {
      setIsLoading(false);
    }
  }, []);

  const fetchUserProfile = async (token: string) => {
    try {
      // Decode token to get user ID
      const payload = JSON.parse(atob(token.split(".")[1]));
      const userId = payload.userId;

      // Fetch user data and their auctions/bids
      const [userRes, auctionsRes, bidsRes] = await Promise.all([
        fetch(`/api/users/${userId}`),
        fetch(`/api/auctions?sellerId=${userId}`),
        fetch(`/api/bids?bidderId=${userId}`),
      ]);

      if (userRes.ok) {
        const userData = await userRes.json();
        setUserProfile({
          ...userData.user,
          listings: 0,
          sold: 0,
          followers: 0,
        });
      } else {
        // Fallback if user endpoint doesn't exist - use stored data
        const userData = localStorage.getItem("userData");
        if (userData) {
          setUserProfile(JSON.parse(userData));
        }
      }

      // Count listings
      if (auctionsRes.ok) {
        const auctionsData = await auctionsRes.json();
        setUserProfile((prev) =>
          prev ? { ...prev, listings: auctionsData.auctions?.length || 0 } : null
        );
      }

      // Count bids
      if (bidsRes.ok) {
        const bidsData = await bidsRes.json();
        // Calculate winning bids
        const winningBids = bidsData.bids?.filter((bid: any) => bid.isWinning)?.length || 0;
        setUserProfile((prev) =>
          prev ? { ...prev, sold: winningBids } : null
        );
      }
    } catch (error) {
      console.error("Error fetching user profile:", error);
      // Fallback to localStorage
      const userData = localStorage.getItem("userData");
      if (userData) {
        const parsedData = JSON.parse(userData);
        setUserProfile({
          ...parsedData,
          listings: 0,
          sold: 0,
          followers: 0,
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <main className="min-h-screen pb-16 pt-24 relative overflow-x-hidden flex items-center justify-center">
        <div className="animate-spin text-nepal-accent">
          <Heart size={40} />
        </div>
      </main>
    );
  }

  // Logged out profile page - beautiful empty state
  if (!isLoggedIn) {
    return (
      <main className="min-h-screen pb-16 pt-24 relative overflow-x-hidden">
        {/* Background Blobs */}
        <div className="fixed top-0 left-0 w-96 h-96 bg-purple-500/10 rounded-full blur-[120px] pointer-events-none" />
        <div className="fixed bottom-0 right-0 w-96 h-96 bg-blue-500/10 rounded-full blur-[120px] pointer-events-none" />

        <div className="container mx-auto px-4 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-2xl mx-auto text-center"
          >
            {/* Empty Profile Avatar */}
            <div className="w-32 h-32 rounded-full bg-gradient-to-br from-gray-700 to-gray-900 flex items-center justify-center mx-auto mb-8 border-2 border-white/10">
              <User size={64} className="text-gray-500" />
            </div>

            {/* Main Message */}
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">Join Nepal Auction</h1>
            <p className="text-gray-400 text-lg mb-8 max-w-md mx-auto">
              Sign in to your account to view your profile, manage your listings, and track your bids.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
              <Link href="/auth/login">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="glass-button px-8 py-3 rounded-full font-bold flex items-center justify-center gap-2 w-full sm:w-auto"
                >
                  <Lock size={20} />
                  Log In
                </motion.button>
              </Link>
              <Link href="/auth/signup">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="glass-panel px-8 py-3 rounded-full font-bold hover:bg-white/20 transition-all flex items-center justify-center gap-2 w-full sm:w-auto"
                >
                  <User size={20} />
                  Create Account
                </motion.button>
              </Link>
            </div>

            {/* Features Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-16">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="glass-panel p-6 rounded-2xl"
              >
                <div className="w-12 h-12 rounded-full bg-nepal-accent/20 flex items-center justify-center mx-auto mb-4">
                  <ShoppingBag size={24} className="text-nepal-accent" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">Manage Listings</h3>
                <p className="text-gray-400 text-sm">Create and manage your auction listings with ease</p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="glass-panel p-6 rounded-2xl"
              >
                <div className="w-12 h-12 rounded-full bg-nepal-accent/20 flex items-center justify-center mx-auto mb-4">
                  <Heart size={24} className="text-nepal-accent" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">Track Bids</h3>
                <p className="text-gray-400 text-sm">Keep track of all your bids and favorite items</p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="glass-panel p-6 rounded-2xl"
              >
                <div className="w-12 h-12 rounded-full bg-nepal-accent/20 flex items-center justify-center mx-auto mb-4">
                  <Star size={24} className="text-nepal-accent" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">Build Reputation</h3>
                <p className="text-gray-400 text-sm">Earn ratings and build trust with other users</p>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </main>
    );
  }

  // Logged in profile page
  const myListings = [
    {
      id: 1,
      title: "Royal Enfield Classic 350",
      currentBid: 345000,
      status: "active",
      bids: 12,
    },
    {
      id: 2,
      title: "iPhone 13 Pro",
      currentBid: 120000,
      status: "active",
      bids: 28,
    },
    {
      id: 3,
      title: "Vintage Watch",
      currentBid: 85000,
      status: "sold",
      bids: 15,
    },
  ];

  const myBids = [
    {
      id: 1,
      title: "MacBook Pro M1",
      myBid: 280000,
      currentBid: 290000,
      status: "outbid",
    },
    {
      id: 2,
      title: "Gaming Console",
      myBid: 45000,
      currentBid: 45000,
      status: "winning",
    },
  ];

  return (
    <main className="min-h-screen pb-16 pt-24 relative overflow-x-hidden">
      {/* Background Blobs */}
      <div className="fixed top-0 left-0 w-96 h-96 bg-purple-500/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="fixed bottom-0 right-0 w-96 h-96 bg-blue-500/10 rounded-full blur-[120px] pointer-events-none" />

      <div className="container mx-auto px-4 relative z-10">
        {/* Profile Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-panel rounded-3xl p-8 mb-8"
        >
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div className="flex items-center gap-6">
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-nepal-accent to-purple-500 flex items-center justify-center text-3xl font-bold">
                {userProfile?.fullName?.charAt(0) || userProfile?.name?.charAt(0) || "U"}
              </div>
              <div>
                <h1 className="text-3xl font-bold text-white mb-1">
                  {userProfile?.fullName || userProfile?.name || "User"}
                </h1>
                <p className="text-gray-400 mb-3 flex items-center gap-2">
                  <Mail size={16} /> {userProfile?.email}
                </p>
                {userProfile?.phone && (
                  <p className="text-gray-400 flex items-center gap-2">
                    <Phone size={16} /> {userProfile.phone}
                  </p>
                )}
                <div className="flex gap-4 text-sm mt-3">
                  <span className="text-yellow-400">★ 4.8 (245 reviews)</span>
                  <span className="text-gray-400">Joined Jan 2024</span>
                </div>
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <button className="glass-button px-6 py-2 rounded-full flex items-center gap-2">
                <Edit2 size={18} />
                Edit Profile
              </button>
              <button className="glass-panel px-6 py-2 rounded-full flex items-center gap-2 hover:bg-white/20">
                <LogOut size={18} />
                Log Out
              </button>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-4 gap-4 mt-8 pt-8 border-t border-white/10">
            <div className="text-center">
              <p className="text-2xl font-bold text-nepal-accent">{userProfile?.listings || 0}</p>
              <p className="text-xs text-gray-400 uppercase">Active Listings</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-nepal-accent">{userProfile?.sold || 0}</p>
              <p className="text-xs text-gray-400 uppercase">Sold</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-nepal-accent">{userProfile?.followers || 0}</p>
              <p className="text-xs text-gray-400 uppercase">Followers</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-nepal-accent">98%</p>
              <p className="text-xs text-gray-400 uppercase">Positive</p>
            </div>
          </div>
        </motion.div>

        {/* Tabs */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="flex gap-2 mb-8 border-b border-white/10"
        >
          {["listings", "bids", "favorites"].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-6 py-3 font-bold capitalize transition-all ${
                activeTab === tab
                  ? "text-nepal-accent border-b-2 border-nepal-accent"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              {tab === "listings" ? "📦 My Listings" : tab === "bids" ? "🎯 My Bids" : "❤️ Favorites"}
            </button>
          ))}
        </motion.div>

        {/* Tab Content */}
        {activeTab === "listings" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-4"
          >
            {myListings.map((item, idx) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                className="glass-panel p-6 rounded-2xl flex items-center justify-between"
              >
                <div>
                  <h3 className="text-lg font-bold text-white mb-1">{item.title}</h3>
                  <p className="text-sm text-gray-400">{item.bids} bids received</p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-nepal-accent">Rs. {item.currentBid.toLocaleString("en-IN")}</p>
                  <span className={`text-xs uppercase font-bold px-3 py-1 rounded-full ${
                    item.status === "active"
                      ? "bg-green-500/20 text-green-400"
                      : "bg-gray-500/20 text-gray-400"
                  }`}>
                    {item.status}
                  </span>
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}

        {activeTab === "bids" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-4"
          >
            {myBids.map((item, idx) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                className="glass-panel p-6 rounded-2xl flex items-center justify-between"
              >
                <div>
                  <h3 className="text-lg font-bold text-white mb-1">{item.title}</h3>
                  <p className="text-sm text-gray-400">Your bid: Rs. {item.myBid.toLocaleString("en-IN")}</p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-white">Rs. {item.currentBid.toLocaleString("en-IN")}</p>
                  <span className={`text-xs uppercase font-bold px-3 py-1 rounded-full ${
                    item.status === "winning"
                      ? "bg-green-500/20 text-green-400"
                      : "bg-red-500/20 text-red-400"
                  }`}>
                    {item.status}
                  </span>
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}

        {activeTab === "favorites" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-12"
          >
            <Heart className="mx-auto mb-4 text-gray-400" size={40} />
            <p className="text-gray-400">No favorites yet</p>
          </motion.div>
        )}
      </div>
    </main>
  );
}
