import { useState, useCallback, useEffect } from 'react';

export interface UserProfile {
  id: number;
  email: string;
  fullName?: string;
  phone?: string;
  name?: string;
  createdAt?: Date;
}

export interface Auction {
  id: number;
  title: string;
  currentPrice: number;
  endTime: string;
  seller: { name?: string };
  bids: Array<{ amount: number }>;
  createdAt: string;
}

export interface Bid {
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

export function useUserProfile() {
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [listings, setListings] = useState<Auction[]>([]);
  const [bids, setBids] = useState<Bid[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchUserProfile = useCallback(async (token: string) => {
    try {
      setIsLoading(true);
      const payload = JSON.parse(atob(token.split('.')[1]));
      const userId = payload.userId;

      const [userRes, auctionsRes, bidsRes] = await Promise.all([
        fetch(`/api/users/${userId}`),
        fetch(`/api/auctions?sellerId=${userId}`),
        fetch(`/api/bids?bidderId=${userId}`),
      ]);

      if (userRes.ok) {
        const userData = await userRes.json();
        setUserProfile(userData.user);
      }

      if (auctionsRes.ok) {
        const auctionsData = await auctionsRes.json();
        setListings(auctionsData.auctions || []);
      }

      if (bidsRes.ok) {
        const bidsData = await bidsRes.json();
        setBids(bidsData.bids || []);
      }
    } catch (error) {
      console.error('Error fetching user profile:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const refreshProfile = useCallback(async () => {
    const token = localStorage.getItem('authToken');
    if (token) {
      await fetchUserProfile(token);
    }
  }, [fetchUserProfile]);

  return {
    userProfile,
    listings,
    bids,
    isLoading,
    fetchUserProfile,
    refreshProfile,
  };
}
