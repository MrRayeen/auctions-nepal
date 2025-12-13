"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { User, ShoppingBag, Heart, Settings, LogOut, Edit2, Lock, Mail, Phone, Star, Key, X, Check, Shield } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ui/Toast";
import KYCForm from "@/components/KYCForm";
import AuctionCard from "@/components/auctions/AuctionCard";

interface UserProfile {
  id: number;
  email: string;
  fullName?: string;
  phone?: string;
  name?: string;
  createdAt?: Date;
}

interface Auction {
  id: number;
  slug?: string;
  title: string;
  currentPrice: number;
  startingPrice: number;
  endTime: string;
  status?: string;
  imageUrl?: string;
  seller: { 
    id?: number;
    name?: string;
    email?: string;
  };
  bids: Array<{ amount: number }>;
  createdAt: string;
}

interface Bid {
  id: number;
  amount: number;
  createdAt: string;
  auction: {
    id: number;
    title: string;
    currentPrice: number;
    endTime: string;
  };
  isWinning: boolean;
}

export default function ProfilePage() {
  const router = useRouter();
  const { addToast } = useToast();
  const [activeTab, setActiveTab] = useState("listings");
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [listings, setListings] = useState<Auction[]>([]);
  const [bids, setBids] = useState<Bid[]>([]);
  const [favorites, setFavorites] = useState<Auction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [showPinModal, setShowPinModal] = useState(false);
  const [oldPinInput, setOldPinInput] = useState("");
  const [newPinInput, setNewPinInput] = useState("");
  const [pinStep, setPinStep] = useState<"old" | "new">("old"); // Track which step we're on
  const [hasPinSet, setHasPinSet] = useState(false);
  const [pinMessage, setPinMessage] = useState("");
  const [pinLoading, setPinLoading] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("authToken");
    if (token) {
      setIsLoggedIn(true);
      fetchUserProfile(token);
    } else {
      setIsLoading(false);
    }

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        const token = localStorage.getItem("authToken");
        if (token) {
          fetchUserProfile(token);
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  const fetchUserProfile = async (token: string) => {
    try {
      const payload = JSON.parse(atob(token.split(".")[1]));
      const userId = payload.userId;

      const [userRes, auctionsRes, bidsRes, favoritesRes] = await Promise.all([
        fetch(`/api/users/${userId}`),
        fetch(`/api/auctions?sellerId=${userId}`),
        fetch(`/api/bids?bidderId=${userId}`),
        fetch(`/api/favorites`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }),
      ]);

      if (userRes.ok) {
        const userData = await userRes.json();
        setUserProfile(userData.user);
        setHasPinSet(userData.user.hasPinSet);
      }

      if (auctionsRes.ok) {
        const auctionsData = await auctionsRes.json();
        setListings(auctionsData.auctions || []);
      }

      if (bidsRes.ok) {
        const bidsData = await bidsRes.json();
        setBids(bidsData.bids || []);
      }

      if (favoritesRes.ok) {
        const favoritesData = await favoritesRes.json();
        setFavorites(favoritesData.favorites || []);
      }
    } catch (error) {
      console.error("Error fetching user profile:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("authToken");
    localStorage.removeItem("userData");
    router.push("/");
  };

  const handlePinSubmit = async () => {
    try {
      const token = localStorage.getItem("authToken");
      if (!token) return;

      const payload = JSON.parse(atob(token.split(".")[1]));
      const userId = payload.userId;

      // If PIN is already set, first we need to verify the old PIN
      if (hasPinSet && pinStep === "old") {
        if (!/^\d{4}$/.test(oldPinInput)) {
          setPinMessage("PIN must be exactly 4 digits");
          return;
        }

        setPinLoading(true);

        // Verify old PIN
        const verifyRes = await fetch(`/api/users/${userId}/pin`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId, pin: oldPinInput }),
        });

        if (!verifyRes.ok) {
          setPinMessage("Failed to verify PIN");
          setPinLoading(false);
          return;
        }

        const verifyData = await verifyRes.json();
        if (!verifyData.valid) {
          setPinMessage("Current PIN is incorrect");
          setOldPinInput("");
          setPinLoading(false);
          return;
        }

        setPinMessage("");
        setPinStep("new");
        setPinLoading(false);
        return;
      }

      // Now handle setting the new PIN
      if (!/^\d{4}$/.test(newPinInput)) {
        setPinMessage("PIN must be exactly 4 digits");
        return;
      }

      setPinLoading(true);

      const res = await fetch(`/api/users/${userId}/pin`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          pin: newPinInput,
          oldPin: hasPinSet ? oldPinInput : undefined,
        }),
      });

      if (res.ok) {
        setPinMessage("PIN updated successfully!");
        setHasPinSet(true);
        setOldPinInput("");
        setNewPinInput("");
        setPinStep("old");
        setTimeout(() => {
          setShowPinModal(false);
          setPinMessage("");
        }, 2000);
      } else {
        const error = await res.json();
        setPinMessage(error.error || "Failed to set PIN");
      }
    } catch (error) {
      setPinMessage("Error setting PIN");
    } finally {
      setPinLoading(false);
    }
  };

  const resetPinModal = () => {
    setShowPinModal(false);
    setOldPinInput("");
    setNewPinInput("");
    setPinStep("old");
    setPinMessage("");
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

  if (!isLoggedIn) {
    return (
      <main className="min-h-screen pb-16 pt-24 relative overflow-x-hidden">
        <div className="fixed top-0 left-0 w-96 h-96 bg-purple-500/10 rounded-full blur-[120px] pointer-events-none" />
        <div className="fixed bottom-0 right-0 w-96 h-96 bg-blue-500/10 rounded-full blur-[120px] pointer-events-none" />

        <div className="container mx-auto px-4 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-2xl mx-auto text-center"
          >
            <div className="w-32 h-32 rounded-full bg-gradient-to-br from-gray-700 to-gray-900 flex items-center justify-center mx-auto mb-8 border-2 border-white/10">
              <User size={64} className="text-gray-500" />
            </div>

            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">Join Nepal Auction</h1>
            <p className="text-gray-400 text-lg mb-8 max-w-md mx-auto">
              Sign in to your account to view your profile, manage your listings, and track your bids.
            </p>

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

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-16">
              {[
                { icon: ShoppingBag, title: "Manage Listings", desc: "Create and manage your auction listings" },
                { icon: Heart, title: "Track Bids", desc: "Keep track of all your bids and favorite items" },
                { icon: Star, title: "Build Reputation", desc: "Earn ratings and build trust with users" },
              ].map((feature, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className="glass-panel p-6 rounded-2xl"
                >
                  <div className="w-12 h-12 rounded-full bg-nepal-accent/20 flex items-center justify-center mx-auto mb-4">
                    <feature.icon size={24} className="text-nepal-accent" />
                  </div>
                  <h3 className="text-xl font-bold text-white mb-2">{feature.title}</h3>
                  <p className="text-gray-400 text-sm">{feature.desc}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </main>
    );
  }

  // Logged in profile page
  return (
    <main className="min-h-screen pb-16 pt-24 relative overflow-x-hidden">
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
            <div className="flex sm:flex-row flex-col items-center gap-6">
              <div className="w-24 h-24 rounded-full bg-linear-to-br from-nepal-accent to-purple-500 flex items-center justify-center text-3xl font-bold">
                {userProfile?.fullName?.charAt(0) || userProfile?.name?.charAt(0) || "U"}
              </div>
              <div className="flex flex-col items-center">
                <h1 className="text-3xl font-bold text-white mb-1 text-center">
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
                  <span className="text-yellow-400">★ New Member</span>
                  <span className="text-gray-400">
                    Joined{" "}
                    {userProfile?.createdAt
                      ? new Date(userProfile.createdAt).toLocaleDateString()
                      : "Recently"}
                  </span>
                </div>
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <button
                onClick={() => setShowPinModal(!showPinModal)}
                className="glass-button px-6 py-2 rounded-full flex justify-center items-center gap-2"
              >
                <Key size={18} />
                {hasPinSet ? "Change PIN" : "Set PIN"}
              </button>
              <button
                onClick={handleLogout}
                className="glass-panel px-6 py-2 rounded-full flex items-center justify-center gap-2 hover:bg-red-500/20 transition-all"
              >
                <LogOut size={18} />
                Log Out
              </button>
            </div>
          </div>

          {/* PIN Modal */}
          {showPinModal && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-6 glass-panel p-6 rounded-2xl border border-nepal-accent/30"
            >
              <h3 className="text-xl font-bold text-white mb-4">
                {hasPinSet ? "Change Transaction PIN" : "Set Transaction PIN"}
              </h3>
              <p className="text-gray-400 mb-6">
                {hasPinSet && pinStep === "old"
                  ? "Enter your current PIN to proceed"
                  : "Your PIN will be required to confirm bids and transactions"}
              </p>

              <div className="space-y-4">
                {/* Old PIN field - only show if PIN exists and we're on first step */}
                {hasPinSet && pinStep === "old" && (
                  <div>
                    <label className="text-sm text-gray-400 mb-2 block">Current PIN</label>
                    <input
                      type="password"
                      maxLength={4}
                      placeholder="Enter 4-digit PIN"
                      value={oldPinInput}
                      onChange={(e) => setOldPinInput(e.target.value.replace(/\D/g, "").slice(0, 4))}
                      className="w-full px-4 py-2 rounded-lg bg-white/10 border border-white/20 text-white placeholder-gray-500 focus:outline-none focus:border-nepal-accent"
                    />
                  </div>
                )}

                {/* New PIN field - show on second step or if no PIN set yet */}
                {!hasPinSet || pinStep === "new" ? (
                  <div>
                    <label className="text-sm text-gray-400 mb-2 block">
                      {hasPinSet ? "New PIN" : "4-Digit PIN"}
                    </label>
                    <input
                      type="password"
                      maxLength={4}
                      placeholder="Enter 4-digit PIN"
                      value={newPinInput}
                      onChange={(e) => setNewPinInput(e.target.value.replace(/\D/g, "").slice(0, 4))}
                      className="w-full px-4 py-2 rounded-lg bg-white/10 border border-white/20 text-white placeholder-gray-500 focus:outline-none focus:border-nepal-accent"
                    />
                  </div>
                ) : null}

                <div className="flex gap-2 mt-4">
                  <button
                    onClick={handlePinSubmit}
                    disabled={pinLoading}
                    className="glass-button px-6 py-2 rounded-lg flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {pinLoading ? (
                      <>
                        <div className="w-4 h-4 border-2 border-nepal-accent border-t-transparent rounded-full animate-spin" />
                        Processing
                      </>
                    ) : (
                      <>
                        <Check size={18} />
                        {hasPinSet && pinStep === "old" ? "Verify" : "Set"}
                      </>
                    )}
                  </button>
                  <button
                    onClick={resetPinModal}
                    disabled={pinLoading}
                    className="glass-panel px-6 py-2 rounded-lg hover:bg-white/20 disabled:opacity-50"
                  >
                    <X size={18} />
                  </button>
                </div>
              </div>

              {pinMessage && (
                <p
                  className={`mt-4 text-sm ${
                    pinMessage.includes("successfully") ? "text-green-400" : "text-red-400"
                  }`}
                >
                  {pinMessage}
                </p>
              )}
            </motion.div>
          )}

          {/* Stats */}
          <div className="grid grid-cols-4 gap-4 mt-8 pt-8 border-t border-white/10">
            <div className="text-center">
              <p className="text-2xl font-bold text-nepal-accent">{listings.length}</p>
              <p className="text-xs text-gray-400 uppercase">Active Listings</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-nepal-accent">
                {bids.filter((b) => b.isWinning).length}
              </p>
              <p className="text-xs text-gray-400 uppercase">Winning Bids</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-nepal-accent">
                {bids.length}
              </p>
              <p className="text-xs text-gray-400 uppercase">Total Bids</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-nepal-accent">100%</p>
              <p className="text-xs text-gray-400 uppercase">Positive</p>
            </div>
          </div>
        </motion.div>

        {/* Tabs */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="flex gap-2 mb-8 border-b border-white/10 overflow-x-auto"
        >
          {["listings", "bids", "favorites", "kyc"].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-7.5 sm:px-6 py-3 font-bold capitalize transition-all whitespace-nowrap ${
                activeTab === tab
                  ? "text-nepal-accent border-b-2 border-nepal-accent"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              {tab === "listings" ? "📦 My Listings" : tab === "bids" ? "🎯 My Bids" : tab === "favorites" ? "❤️ Favorites" : "🛡️ KYC"}
            </button>
          ))}
        </motion.div>

        {/* Tab Content */}
        {activeTab === "listings" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
            {listings.length === 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-12"
              >
                <ShoppingBag className="mx-auto mb-4 text-gray-400" size={40} />
                <p className="text-gray-400 mb-4">No listings yet</p>
                <Link href="/auctions/create">
                  <button className="glass-button px-6 py-2 rounded-full">Create Listing</button>
                </Link>
              </motion.div>
            ) : (
              listings.map((item, idx) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  className="glass-panel p-6 rounded-2xl flex sm:flex-row flex-col gap-2 items-center justify-between group"
                >
                  <div
                    className="flex-1 flex sm:block flex-col cursor-pointer items-center justify-center hover:opacity-80 transition-opacity"
                    onClick={() => router.push(`/auctions/${item.id}`)}
                  >
                    <h3 className="text-lg font-bold text-white mb-1">{item.title}</h3>
                    <p className="text-sm text-gray-400">{item.bids.length} bids received</p>
                  </div>
                  <div
                    className="text-right cursor-pointer hover:opacity-80 transition-opacity mx-6"
                    onClick={() => router.push(`/auctions/${item.id}`)}
                  >
                    <p className="text-2xl font-bold text-nepal-accent">
                      Rs. {item.currentPrice.toLocaleString("en-IN")}
                    </p>
                    {item.startingPrice > 0 && (
                      <p className="text-sm text-green-400 font-semibold mt-1">
                        {`+${(((item.currentPrice - item.startingPrice) / item.startingPrice) * 100).toFixed(2)}% gain`}
                      </p>
                    )}
                  </div>

                  {/* Status and Actions */}
                  <div className="flex items-center gap-2">
                    {/* Status Badge */}
                    {item.status === "SOLD" ? (
                      <span className="px-3 py-1 rounded-full bg-red-500/20 text-red-400 text-xs font-bold uppercase">
                        Sold
                      </span>
                    ) : (
                      <span className="px-3 py-1 rounded-full bg-green-500/20 text-green-400 text-xs font-bold uppercase">
                        Active
                      </span>
                    )}

                    {/* Status Dropdown */}
                    <select
                      value={item.status || "ACTIVE"}
                      onChange={async (e) => {
                        try {
                          const res = await fetch(`/api/auctions/${item.id}`, {
                            method: "PUT",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ status: e.target.value }),
                          });

                          if (!res.ok) {
                            const error = await res.json();
                            addToast(error.error || "Failed to update status", "error");
                            return;
                          }

                          // Update local state immediately
                          setListings((prev) =>
                            prev.map((listing) =>
                              listing.id === item.id
                                ? { ...listing, status: e.target.value }
                                : listing
                            )
                          );
                          addToast(
                            `Listing marked as ${e.target.value === "SOLD" ? "sold" : "active"}`,
                            "success"
                          );
                        } catch (err) {
                          console.error("Status update error:", err);
                          addToast("Failed to update status", "error");
                        }
                      }}
                      onClick={(e) => e.stopPropagation()}
                      className="px-3 py-1 rounded-lg bg-white/10 border border-white/20 text-white text-xs focus:outline-none focus:border-nepal-accent cursor-pointer"
                    >
                      <option value="ACTIVE" className="bg-gray-800">
                        Mark Active
                      </option>
                      <option value="SOLD" className="bg-gray-800">
                        Mark Sold
                      </option>
                    </select>

                    {/* Edit Button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        router.push(`/profile/${item.id}/edit`);
                      }}
                      className="glass-button px-4 py-1 rounded-lg text-sm font-bold"
                    >
                      Edit
                    </button>
                  </div>
                </motion.div>
              ))
            )}
          </motion.div>
        )}

        {activeTab === "bids" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
            {bids.length === 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-12"
              >
                <Heart className="mx-auto mb-4 text-gray-400" size={40} />
                <p className="text-gray-400">No bids placed yet</p>
              </motion.div>
            ) : (
              bids.map((item, idx) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  className="glass-panel p-6 rounded-2xl flex items-center justify-between cursor-pointer hover:bg-white/10 transition-all"
                  onClick={() => router.push(`/auctions/${item.auction.id}`)}
                >
                  <div>
                    <h3 className="text-lg font-bold text-white mb-1">{item.auction.title}</h3>
                    <p className="text-sm text-gray-400">
                      Your bid: Rs. {item.amount.toLocaleString("en-IN")}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-white">
                      Rs. {item.auction.currentPrice.toLocaleString("en-IN")}
                    </p>
                    <span
                      className={`text-xs uppercase font-bold px-3 py-1 rounded-full ${
                        item.isWinning
                          ? "bg-green-500/20 text-green-400"
                          : "bg-red-500/20 text-red-400"
                      }`}
                    >
                      {item.isWinning ? "Winning" : "Outbid"}
                    </span>
                  </div>
                </motion.div>
              ))
            )}
          </motion.div>
        )}

        {activeTab === "favorites" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
            {favorites.length === 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-12"
              >
                <Heart className="mx-auto mb-4 text-gray-400" size={40} />
                <p className="text-gray-400 mb-4">No favorites yet</p>
                <Link href="/auctions">
                  <button className="glass-button px-6 py-2 rounded-full">Browse Auctions</button>
                </Link>
              </motion.div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {favorites.map((auction, idx) => (
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
                      description={auction.title}
                      imageUrl={auction.imageUrl}
                      currentPrice={auction.currentPrice}
                      startingPrice={auction.startingPrice}
                      endTime={auction.endTime}
                      seller={{
                        id: auction.seller.id,
                        name: auction.seller.name,
                        email: auction.seller.email || ''
                      }}
                      bidsCount={auction.bids.length}
                    />
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        )}

        {activeTab === "kyc" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <KYCForm userId={userProfile?.id.toString() || ""} />
          </motion.div>
        )}
      </div>
    </main>
  );
}
