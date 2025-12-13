"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { Gavel, Clock, Users } from "lucide-react";
import Image from "next/image";
import { useState, useEffect } from "react";
import VerifiedBadge from "@/components/VerifiedBadge";
import FavoriteButton from "@/components/auctions/FavoriteButton";
import ReportButton from "@/components/auctions/ReportButton";
import { formatSellerName } from "@/lib/formatSellerName";

interface AuctionCardProps {
  id: number;
  slug?: string;
  title: string;
  description: string;
  imageUrl?: string;
  currentPrice: number;
  startingPrice: number;
  endTime: Date | string;
  seller: {
    id?: number;
    name?: string;
    email?: string;
    kycStatus?: string;
  };
  bidsCount?: number;
}

export default function AuctionCard({ 
  id, 
  slug,
  title, 
  description,
  imageUrl,
  currentPrice, 
  startingPrice,
  endTime,
  seller,
  bidsCount = 0
}: AuctionCardProps) {
  const [sellerKyc, setSellerKyc] = useState<string | null>(null);

  useEffect(() => {
    if (seller.kycStatus) {
      setSellerKyc(seller.kycStatus);
    } else if (seller.id) {
      // Fetch seller KYC status from API if not provided
      fetch(`/api/users/${seller.id}`)
        .then((res) => res.json())
        .then((data) => {
          setSellerKyc(data.user?.kycStatus || null);
        })
        .catch(() => {
          // Silent fail
        });
    }
  }, [seller]);

  const endDate = new Date(endTime);
  const now = new Date();
  const timeRemaining = endDate.getTime() - now.getTime();
  const isExpired = timeRemaining <= 0;
  const hoursLeft = Math.floor(timeRemaining / (1000 * 60 * 60));
  const minutesLeft = Math.floor((timeRemaining % (1000 * 60 * 60)) / (1000 * 60));
  const isEnding = hoursLeft < 1;

  // Use slug for URL if available, fallback to id
  const auctionUrl = slug ? `/auctions/${slug}` : `/auctions/${id}`;

  return (
    <Link href={auctionUrl}>
      <motion.div
        whileHover={{ y: -8, scale: 1.02 }}
        className="glass-panel rounded-2xl overflow-hidden group cursor-pointer h-full flex flex-col"
      >
        {/* Image Container */}
        <div className="relative h-48 w-full overflow-hidden bg-gradient-to-br from-gray-800 to-gray-900">
          {imageUrl ? (
            <Image
              src={imageUrl}
              alt={title}
              fill
              className="object-cover group-hover:scale-110 transition-transform duration-300"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-purple-900/20 to-blue-900/20">
              <Gavel className="w-12 h-12 text-white/30" />
            </div>
          )}

          {/* Status Badge */}
          <div className={`absolute top-3 right-3 px-3 py-1 rounded-full text-xs font-bold backdrop-blur-md border ${
            isExpired
              ? 'bg-gray-500/80 border-gray-400 text-white'
              : isEnding 
              ? 'bg-red-500/80 border-red-400 text-white' 
              : 'bg-black/50 border-white/10 text-white'
          }`}>
            {isExpired ? 'Expired' : `${hoursLeft}h ${minutesLeft}m`}
          </div>

          {/* Overlay with Action Buttons */}
          <motion.div 
            initial={{ opacity: 0 }}
            whileHover={{ opacity: 1 }}
            transition={{ duration: 0.2 }}
            className="absolute inset-0 bg-black/60 flex items-center justify-center gap-3"
            onClick={(e) => e.preventDefault()}
          >
            <FavoriteButton auctionId={id} />
            <ReportButton auctionId={id} />
          </motion.div>

          {/* Overlay on hover */}
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors" />
        </div>

        {/* Content */}
        <div className="p-4 flex-1 flex flex-col justify-between">
          <div>
            <h3 className="font-bold text-white line-clamp-2 group-hover:text-nepal-accent transition-colors">
              {title}
            </h3>
            <p className="text-xs text-gray-400 line-clamp-2 mt-1">
              {description}
            </p>
          </div>

          {/* Stats Row */}
          <div className="flex gap-2 mt-3 text-xs text-gray-400">
            <div className="flex items-center gap-1">
              <Users size={14} />
              <span>{bidsCount} bids</span>
            </div>
            <div className="flex-1 text-right flex items-center justify-end gap-2">
              <span className="text-nepal-accent font-bold flex items-center gap-3">
                <span>{formatSellerName(seller.name, seller.email)}</span>
                {/* show compact pill on listing for verified sellers */}
                <VerifiedBadge isVerified={sellerKyc === 'VERIFIED'} size="sm" variant="pill" />
              </span>
            </div>
          </div>

          {/* Price Section */}
          <div className="mt-3 pt-3 border-t border-white/10">
            <p className="text-xs text-gray-400 uppercase tracking-wider">Current Bid</p>
            <div className="flex justify-between items-baseline">
              <p className="text-xl font-bold text-white">
                Rs. {currentPrice.toLocaleString('en-IN')}
              </p>
              {currentPrice > startingPrice && (
                <p className="text-xs text-green-400">
                  +{((currentPrice - startingPrice) / startingPrice * 100).toFixed(0)}%
                </p>
              )}
            </div>
          </div>
        </div>
      </motion.div>
    </Link>
  );
}
