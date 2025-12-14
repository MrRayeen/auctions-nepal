"use client";

import { useState, useEffect, useRef } from "react";
import dynamic from "next/dynamic";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Share2,
  AlertCircle,
  Loader,
  ShieldCheck,
  Gavel,
  MessageCircle,
  Lock,
  MapPin,
  Eye,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import AuctionTimer from "@/components/auctions/AuctionTimer";
import BidStream from "@/components/auctions/BidStream";
import AutoBidSection from "@/components/auctions/AutoBidSection";
import FavoriteButton from "@/components/auctions/FavoriteButton";
import ReportButton from "@/components/auctions/ReportButton";
import ImageCarousel from "@/components/auctions/ImageCarousel";
import { useToast } from "@/components/ui/Toast";
import { useParams } from "next/navigation";

const LocationPickerMap = dynamic(
  () => import("@/components/auctions/LocationPickerMap"),
  { ssr: false }
);

// Updated Auction interface based on new requirements
interface Auction {
  id: number;
  slug: string;
  title: string;
  description: string;
  images: { url: string; order: number }[];
  tags: string; // Expecting a JSON string
  category: string;
  subCategory?: string;
  startingPrice: number;
  currentPrice: number;
  minIncrement: number;
  startTime: string;
  endTime: string;
  status: "ACTIVE" | "ENDED" | "SOLD" | "UPCOMING";
  locationLat?: number;
  locationLng?: number;
  locationArea?: string;
  locationCity?: string;
  delivery?: string;
  seller: {
    id: number;
    name: string;
    email: string;
    kycStatus: "PENDING" | "VERIFIED" | "REJECTED";
  };
  bids: Array<{
    id: number;
    amount: number;
    createdAt: string;
    bidder: {
      id: number;
      name: string;
    };
  }>;
}

interface ParsedTag {
  [key: string]: string;
}

export default function AuctionDetailPage() {
  const params = useParams();
  const slug = params.slug as string;
  const router = useRouter();
  const { addToast } = useToast();

  const [auction, setAuction] = useState<Auction | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [bidAmount, setBidAmount] = useState<string>("");
  const [isPlacingBid, setIsPlacingBid] = useState(false);
  const [displayBids, setDisplayBids] = useState<any[]>([]);
  const [parsedTags, setParsedTags] = useState<ParsedTag[]>([]);
  const [isFavorited, setIsFavorited] = useState(false);
  const [showPinModal, setShowPinModal] = useState(false);
  const [pinInput, setPinInput] = useState("");
  const [isPinLoading, setIsPinLoading] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);
  const [userHasPin, setUserHasPin] = useState(false);
  const [viewCount, setViewCount] = useState(0);
  const mountedRef = useRef(false);
  const toastRef = useRef(addToast);

  // Keep toast ref in sync but don't use it as dependency
  useEffect(() => {
    toastRef.current = addToast;
  }, [addToast]);

  useEffect(() => {
    if (mountedRef.current) return; // Prevent double-fetch in StrictMode
    mountedRef.current = true;

    const fetchAuctionData = async () => {
      if (!slug) return;
      try {
        setLoading(true);
        // Fetch auction details
        const auctionRes = await fetch(`/api/auctions/slug/${slug}`);
        if (!auctionRes.ok) throw new Error("Failed to fetch auction details");
        const auctionData: Auction = await auctionRes.json();
        setAuction(auctionData);

        // Track view
        if (auctionData.id) {
          const token = localStorage.getItem("authToken");
          let userId = null;
          if (token) {
            try {
              const payload = JSON.parse(atob(token.split(".")[1]));
              userId = payload.userId;
            } catch (e) {
              // Invalid token
            }
          }

          // Record view
          await fetch(`/api/auctions/${auctionData.id}/views`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              userId: userId || null,
              ipAddress: null,
            }),
          }).catch(() => {
            // Silently fail view tracking
          });

          // Fetch view count
          const viewRes = await fetch(`/api/auctions/${auctionData.id}/views`);
          if (viewRes.ok) {
            const { viewCount } = await viewRes.json();
            setViewCount(viewCount);
          }
        }

        // Get current user info
        const token = localStorage.getItem("authToken");
        if (token) {
          const payload = JSON.parse(atob(token.split(".")[1]));
          const userId = payload.userId;
          setCurrentUserId(userId);

          // Fetch user PIN status
          const userRes = await fetch(`/api/users/${userId}`);
          if (userRes.ok) {
            const userData = await userRes.json();
            setUserHasPin(userData.user.hasPinSet || false);
          }

          // Fetch favorite status
          const favStatusRes = await fetch(
            `/api/favorites/status?auctionId=${auctionData.id}`,
            {
              headers: { Authorization: `Bearer ${token}` },
            }
          );
          if (favStatusRes.ok) {
            const { isFavorited } = await favStatusRes.json();
            setIsFavorited(isFavorited);
          }
        }

        // Format bids
        const formattedBids = (auctionData.bids || []).map((bid: any) => ({
          id: bid.id,
          user: bid.bidder.name || "Anonymous",
          amount: bid.amount,
          timestamp: new Date(bid.createdAt).toLocaleTimeString(),
        }));
        setDisplayBids(formattedBids);

        // Parse tags
        if (auctionData.tags) {
          try {
            // First try parsing as a single JSON object
            const parsed = JSON.parse(auctionData.tags);
            // Convert object to array of {key: value} pairs if it's not already an array
            if (Array.isArray(parsed)) {
              setParsedTags(parsed);
            } else {
              const tagsArray = Object.entries(parsed).map(([key, value]) => ({
                [key]: String(value),
              }));
              setParsedTags(tagsArray);
            }
          } catch (e1) {
            console.error("Failed to parse tags string:", auctionData.tags);
            setParsedTags([]);
          }
        }
      } catch (err) {
        const errorMsg =
          err instanceof Error ? err.message : "An unexpected error occurred";
        setError(errorMsg);
        toastRef.current(errorMsg, "error");
      } finally {
        setLoading(false);
      }
    };

    fetchAuctionData();
  }, [slug]);

  const handleQuickBid = (multiplier: number) => {
    if (!auction) return;

    // Calculate minimum bid based on whether bids exist above starting price
    const hasBidsAboveStart = (auction.bids || []).some(
      (bid) => bid.amount > auction.startingPrice
    );
    let newBidAmount: number;

    if (hasBidsAboveStart) {
      // There are bids above starting price, so bid against current price
      newBidAmount = auction.currentPrice + auction.minIncrement * multiplier;
    } else {
      // No bids above starting price yet, so bid can be negotiated starting from startingPrice
      newBidAmount = auction.startingPrice + auction.minIncrement * multiplier;
    }

    setBidAmount(String(newBidAmount));
  };

  const handleShare = async () => {
    try {
      const shareUrl = `${window.location.origin}/auctions/${slug}`;
      await navigator.clipboard.writeText(shareUrl);
      toastRef.current("Product link copied to clipboard!", "success");
    } catch (err) {
      toastRef.current("Failed to copy link", "error");
    }
  };

  const handleChatWithSeller = () => {
    if (!currentUserId || !auction) return;

    if (currentUserId === auction.seller.id) {
      toastRef.current("You cannot chat with yourself", "error");
      return;
    }

    // Navigate to chat page with seller
    router.push(`/chat?userId=${auction.seller.id}&auctionId=${auction.id}`);
  };

  const handlePlaceBid = async () => {
    if (!auction || !bidAmount) {
      toastRef.current("Please enter a bid amount.", "error");
      return;
    }

    const token = localStorage.getItem("authToken");
    if (!token) {
      toastRef.current("Please log in to place a bid.", "error");
      return;
    }

    // Check if user has PIN set
    if (!userHasPin) {
      toastRef.current(
        "You must set up a Transaction PIN in your profile before bidding.",
        "error"
      );
      return;
    }

    // Show PIN modal for confirmation
    setShowPinModal(true);
  };

  const handlePinSubmit = async () => {
    if (!pinInput || !auction || !bidAmount) {
      toastRef.current("Please enter your PIN", "error");
      return;
    }

    const token = localStorage.getItem("authToken");
    if (!token) return;

    setIsPinLoading(true);
    try {
      const amount = parseFloat(bidAmount);
      const payload = JSON.parse(atob(token.split(".")[1]));
      const userId = payload.userId;

      // Verify PIN
      const verifyRes = await fetch(`/api/users/${userId}/pin`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, pin: pinInput }),
      });

      if (!verifyRes.ok) {
        toastRef.current("Invalid PIN", "error");
        setPinInput("");
        setIsPinLoading(false);
        return;
      }

      const verifyData = await verifyRes.json();
      if (!verifyData.valid) {
        toastRef.current("PIN is incorrect", "error");
        setPinInput("");
        setIsPinLoading(false);
        return;
      }

      // PIN verified, now place bid
      const bidRes = await fetch("/api/bids", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          auctionId: auction.id,
          bidderId: userId,
          amount,
        }),
      });

      if (!bidRes.ok) {
        const errorData = await bidRes.json();
        toastRef.current(errorData.error || "Failed to place bid", "error");
        setIsPinLoading(false);
        return;
      }

      // Bid placed successfully
      const newBid = {
        id: Date.now(),
        user: "You",
        amount,
        timestamp: new Date().toLocaleTimeString(),
      };

      setDisplayBids((prev) => [newBid, ...prev].slice(0, 10));
      setAuction((prev) => (prev ? { ...prev, currentPrice: amount } : null));
      setBidAmount("");
      setPinInput("");
      setShowPinModal(false);
      toastRef.current(
        `Bid of Rs. ${amount.toLocaleString("en-IN")} placed successfully!`,
        "success"
      );
    } catch (err) {
      toastRef.current("An error occurred while placing bid", "error");
    } finally {
      setIsPinLoading(false);
    }
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-gray-900 flex items-center justify-center">
        <Loader className="animate-spin text-nepal-accent" size={48} />
        <p className="ml-4 text-gray-300">Loading Auction...</p>
      </main>
    );
  }

  if (error || !auction) {
    return (
      <main className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center p-8 rounded-2xl glass-panel">
          <AlertCircle size={48} className="mx-auto mb-4 text-red-500" />
          <h2 className="text-2xl font-bold text-white mb-2">
            Auction Not Found
          </h2>
          <p className="text-gray-400 mb-6">
            {error ||
              "The auction you are looking for does not exist or has been moved."}
          </p>
          <Link
            href="/auctions"
            className="glass-button inline-flex items-center gap-2"
          >
            <ArrowLeft size={16} />
            Back to All Auctions
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen pb-24 relative overflow-x-hidden pt-8 md:pt-16">
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-purple-600/10 blur-[150px] rounded-full pointer-events-none -z-10" />

      <Link
        href="/auctions"
        className="hidden fixed top-6 left-6 z-50 w-12 h-12 sm:flex items-center justify-center rounded-full glass-panel hover:bg-white/20 transition-all duration-300"
      >
        <ArrowLeft size={24} />
      </Link>

      <div className="container mx-auto py-16 px-4 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
        <div className="lg:col-span-7 space-y-6">
          <ImageCarousel
            images={auction.images}
            title={auction.title}
            endTime={auction.endTime}
            status={auction.status}
          />

          {/* View Counter */}
          <div className="flex items-center gap-2 text-gray-400 text-sm">
            <Eye size={16} />
            <span>
              {viewCount} {viewCount === 1 ? "view" : "views"}
            </span>
          </div>

          <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start gap-4">
              <h1 className="text-4xl md:text-5xl font-bold bg-clip-text text-transparent bg-linear-to-r from-white to-gray-300 leading-tight">
                {auction.title}
              </h1>
              <div className="flex gap-2 shrink-0">
                <FavoriteButton
                  auctionId={auction.id}
                  isFavorited={isFavorited}
                  onFavoriteChange={setIsFavorited}
                />
                <ReportButton auctionId={auction.id} />
                <button
                  onClick={handleShare}
                  className="w-12 h-12 flex items-center justify-center rounded-full glass-panel hover:bg-white/20 transition-colors"
                  title="Share"
                >
                  <Share2 size={22} />
                </button>
                {currentUserId !== auction.seller.id && (
                  <button
                    onClick={handleChatWithSeller}
                    className="w-12 h-12 flex items-center justify-center rounded-full glass-panel hover:bg-white/20 transition-colors"
                    title="Chat with Seller"
                  >
                    <MessageCircle size={22} />
                  </button>
                )}
              </div>
            </div>

            {auction.seller?.kycStatus === "VERIFIED" && (
              <div className="flex items-center gap-2 text-sm text-nepal-accent font-semibold">
                <ShieldCheck size={18} />
                <span>
                  Verified Seller:{" "}
                  {auction.seller.name || auction.seller.email.split("@")[0]}
                </span>
              </div>
            )}
            <p className="text-gray-300 leading-relaxed text-lg">
              {auction.description}
            </p>

            {/* Location Section */}
            {(auction.locationLat || auction.locationLng) && (
              <div className="pt-6 border-t border-white/10">
                <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                  <MapPin size={20} className="text-nepal-accent" />
                  Item Location
                </h3>
                <div className="w-full gap-4">
                  <div className="glass-panel p-4 rounded-xl">
                    <p className="text-xs text-gray-400 uppercase mb-2">
                      Location Details
                    </p>
                    <p className="text-white font-semibold">
                      {auction.locationArea || "Unknown Area"}
                      {auction.locationCity && (
                        <span>, {auction.locationCity}</span>
                      )}
                    </p>
                    {auction.locationLat && auction.locationLng && (
                      <p className="text-xs text-gray-500 mt-2">
                        {auction.locationLat.toFixed(4)},{" "}
                        {auction.locationLng.toFixed(4)}
                      </p>
                    )}
                    {auction.locationLat && auction.locationLng && (
                      <div className="glass-panel p-4 rounded-xl h-64 overflow-hidden mt-5">
                        <LocationPickerMap
                          disabled={true}
                          initialLocation={{
                            lat: auction.locationLat,
                            lng: auction.locationLng,
                            area: auction.locationArea || "Location",
                            city: auction.locationCity || "",
                            display: `${auction.locationArea}, ${auction.locationCity}`,
                          }}
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Delivery Option Card */}
            {auction.delivery && (
              <div className="pt-4">
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="glass-panel p-6 rounded-xl border border-white/10"
                >
                  <p className="text-xs text-gray-400 uppercase font-bold tracking-wider mb-2">
                    Delivery Option
                  </p>
                  <p className="text-lg font-semibold text-white">
                    {auction.delivery}
                  </p>
                </motion.div>
              </div>
            )}

            {/* Tags with new styling */}
            {parsedTags.length > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 pt-4">
                {parsedTags.map((tag, idx) => {
                  const key = Object.keys(tag)[0];
                  const value = tag[key];
                  return (
                    <motion.div
                      key={idx}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.07 }}
                      className="glass-panel p-4 rounded-xl border border-white/10 text-center"
                    >
                      <p className="text-xs text-gray-400 uppercase font-bold tracking-wider">
                        {key}
                      </p>
                      <p className="text-lg font-semibold text-white mt-1">
                        {value}
                      </p>
                    </motion.div>
                  );
                })}
              </div>
            )}

            <div className="grid grid-cols-2 gap-4 mt-6 pt-6 border-t border-white/10">
              <div className="glass-panel p-4 rounded-xl">
                <p className="text-xs text-gray-400 uppercase">
                  Starting Price
                </p>
                <p className="text-2xl font-bold text-white">
                  Rs. {auction.startingPrice.toLocaleString("en-IN")}
                </p>
              </div>
              <div className="glass-panel p-4 rounded-xl">
                <p className="text-xs text-gray-400 uppercase">Total Bids</p>
                <p className="text-2xl font-bold text-white">
                  {auction.bids.length || 0}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-5 relative">
          <div className="sticky top-24 space-y-6">
            {auction.status === "ACTIVE" ? (
              <>
                <motion.div
                  key={auction.currentPrice}
                  initial={{ scale: 1 }}
                  animate={{ scale: [1, 1.03, 1] }}
                  transition={{ duration: 0.4 }}
                  className="glass-panel p-8 rounded-3xl text-center relative overflow-hidden"
                >
                  <p className="text-gray-400 text-sm uppercase tracking-widest mb-2">
                    Current Bid
                  </p>
                  <h2 className="text-5xl font-bold text-white font-mono">
                    Rs. {auction.currentPrice.toLocaleString("en-IN")}
                  </h2>
                </motion.div>

                <AutoBidSection
                  auctionId={auction.id}
                  currentPrice={auction.currentPrice}
                />

                <div className="glass-panel p-6 rounded-3xl space-y-4">
                  <label className="text-sm text-gray-400 uppercase tracking-wider">
                    Place Your Bid
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {[1, 2, 4].map((multiplier) => (
                      <button
                        key={multiplier}
                        onClick={() => handleQuickBid(multiplier)}
                        className="glass-button text-sm py-2"
                      >
                        +
                        {(auction.minIncrement * multiplier).toLocaleString(
                          "en-IN"
                        )}
                      </button>
                    ))}
                  </div>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                      Rs.
                    </span>
                    <input
                      type="number"
                      value={bidAmount}
                      onChange={(e) => setBidAmount(e.target.value)}
                      placeholder={`Min. Bid: Rs. ${(auction.bids?.some(
                        (bid) => bid.amount > auction.startingPrice
                      )
                        ? auction.currentPrice + auction.minIncrement
                        : auction.startingPrice
                      ).toLocaleString("en-IN")}`}
                      className="w-full pl-10 pr-4 py-3 rounded-lg bg-white/5 border border-white/20 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-nepal-accent"
                    />
                  </div>
                  <button
                    onClick={handlePlaceBid}
                    disabled={isPlacingBid || !bidAmount}
                    className="w-full glass-button py-4 text-lg font-bold flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed active:scale-95 transition-transform"
                  >
                    {isPlacingBid ? (
                      <Loader size={20} className="animate-spin" />
                    ) : (
                      <Gavel size={20} />
                    )}
                    {isPlacingBid ? "Placing Bid..." : "Place Bid"}
                  </button>
                </div>
              </>
            ) : (
              <div className="glass-panel p-8 rounded-3xl text-center">
                <h2 className="text-3xl font-bold text-white mb-2">
                  {auction.status === "SOLD" ? "Auction Ended" : "Auction Over"}
                </h2>
                <p className="text-gray-400">
                  {auction.status === "SOLD"
                    ? `This item was sold for Rs. ${auction.currentPrice.toLocaleString(
                        "en-IN"
                      )}`
                    : "This auction has finished."}
                </p>
              </div>
            )}

            <div className="glass-panel rounded-3xl overflow-hidden min-h-[300px] flex flex-col">
              <div className="p-4 border-b border-white/10 bg-white/5">
                <h3 className="font-bold flex items-center gap-2 text-white">
                  <span className="w-2.5 h-2.5 bg-green-500 rounded-full animate-pulse" />
                  Live Bidding
                </h3>
              </div>
              {displayBids.length > 0 ? (
                <BidStream bids={displayBids} />
              ) : (
                <div className="flex-1 flex items-center justify-center text-gray-400 p-8 text-center">
                  No bids yet. Be the first!
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* PIN Confirmation Modal */}
      {showPinModal && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={() => {
            if (!isPinLoading) setShowPinModal(false);
          }}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="glass-panel rounded-2xl p-8 max-w-sm w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-center w-12 h-12 rounded-full bg-nepal-accent/20 mb-4">
              <Lock size={24} className="text-nepal-accent" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">
              Confirm Transaction
            </h2>
            <p className="text-gray-400 mb-6">
              Enter your 4-digit Transaction PIN to confirm this bid of Rs.{" "}
              {parseFloat(bidAmount || "0").toLocaleString("en-IN")}
            </p>

            <input
              type="password"
              maxLength={4}
              value={pinInput}
              onChange={(e) => setPinInput(e.target.value.replace(/\D/g, ""))}
              placeholder="Enter PIN"
              className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/20 text-white placeholder-gray-500 text-center text-2xl tracking-widest focus:outline-none focus:ring-2 focus:ring-nepal-accent mb-6"
              disabled={isPinLoading}
            />

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowPinModal(false);
                  setPinInput("");
                }}
                disabled={isPinLoading}
                className="flex-1 px-4 py-3 rounded-lg bg-white/10 hover:bg-white/20 text-white font-semibold transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handlePinSubmit}
                disabled={isPinLoading || pinInput.length !== 4}
                className="flex-1 px-4 py-3 rounded-lg bg-nepal-accent hover:bg-nepal-accent/90 text-white font-semibold transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isPinLoading ? (
                  <>
                    <Loader size={16} className="animate-spin" />
                    Verifying...
                  </>
                ) : (
                  "Confirm"
                )}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </main>
  );
}
