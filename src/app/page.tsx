import GlassCard from "@/components/ui/GlassCard";
import { ArrowRight, Gavel } from "lucide-react";
import AuctionTimer from "@/components/auctions/AuctionTimer";
import Image from "next/image";
import Link from "next/link";
import { formatSellerName } from "@/lib/formatSellerName";
import Footer from "@/components/Footer";

interface Auction {
  id: number;
  slug?: string;
  title: string;
  currentPrice: number;
  imageUrl?: string;
  seller: { name?: string; email: string };
  endTime: string;
}

async function getFeaturedAuctions() {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";
    const res = await fetch(`${baseUrl}/api/auctions?limit=3`, {
      next: { revalidate: 60 },
    });
    if (!res.ok) throw new Error("Failed to fetch");
    const data = await res.json();
    return data.auctions || [];
  } catch (error) {
    console.error("Failed to fetch featured auctions:", error);
    return [];
  }
}

export default async function Home() {
  const featuredAuctions: Auction[] = await getFeaturedAuctions();
  const formatTimeLeft = (endTime: string) => {
    const now = new Date();
    const end = new Date(endTime);
    const diffMs = end.getTime() - now.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    if (diffHours > 0) return `${diffHours}h ${diffMins}m`;
    return `${diffMins}m`;
  };

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Floating Background Blobs */}
      <div className="absolute top-20 left-10 w-72 h-72 bg-purple-500/30 rounded-full blur-[100px] animate-pulse" />
      <div className="absolute bottom-20 right-10 w-96 h-96 bg-blue-500/20 rounded-full blur-[120px]" />

      <div className="z-10 text-center space-y-8 max-w-4xl mt-20">
        <h1 className="text-6xl md:text-8xl font-bold tracking-tighter bg-clip-text text-transparent bg-linear-to-b from-white to-white/60">
          Bid. Win. <br /> Own the Rare.
        </h1>

        <p className="text-xl text-gray-400 max-w-2xl mx-auto">
          Nepal's premium marketplace. From classic Dhaka to modern tech,
          experience the thrill of the auction in a interface designed for you.
        </p>

        <div className="flex gap-4 justify-center flex-wrap">
          <Link href="/auctions">
            <button className="glass-button px-8 py-4 rounded-full flex items-center gap-2">
              Start Bidding <Gavel size={18} />
            </button>
          </Link>
          <Link href="/auctions/create">
            <button className="px-8 py-4 rounded-full border border-white/20 hover:bg-white/10 transition-colors">
              List Item
            </button>
          </Link>
        </div>
      </div>

      {/* Featured Auctions Section */}
      <div className="w-full mt-20 relative z-10">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-3xl md:text-4xl font-bold text-white">
              Featured Auctions
            </h2>
            <Link
              href="/auctions"
              className="text-nepal-accent hover:underline flex items-center gap-2"
            >
              View All <ArrowRight size={18} />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {featuredAuctions.map((auction) => (
              <Link
                key={auction.id}
                href={`/auctions/${auction.slug || auction.id}`}
              >
                <GlassCard className="transform hover:-translate-y-2 cursor-pointer">
                  <div className="relative h-48 w-full mb-4 rounded-2xl overflow-hidden">
                    {auction.imageUrl ? (
                      <Image
                        src={auction.imageUrl}
                        alt={auction.title}
                        fill
                        className="object-cover hover:scale-110 transition-transform duration-300"
                      />
                    ) : (
                      <div className="absolute inset-0 bg-linear-to-br from-gray-800 to-gray-900 flex items-center justify-center">
                        <Gavel className="w-12 h-12 text-white/30" />
                      </div>
                    )}
                    <div className="absolute top-3 right-3">
                      <AuctionTimer endDate={auction.endTime} compact />
                    </div>
                  </div>
                  <div className="flex justify-between items-end">
                    <div>
                      <h3 className="text-xl font-bold">{auction.title}</h3>
                      <p className="text-sm text-gray-400">
                        Seller:{" "}
                        {formatSellerName(
                          auction.seller?.name,
                          auction.seller?.email
                        )}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-nepal-accent uppercase tracking-wider">
                        Current Bid
                      </p>
                      <p className="text-2xl font-bold">
                        Rs. {auction.currentPrice.toLocaleString("en-IN")}
                      </p>
                    </div>
                  </div>
                </GlassCard>
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="w-full mt-20 relative z-10 pb-20">
        <div className="container mx-auto px-4">
          <div className="glass-panel rounded-3xl p-12 text-center max-w-2xl mx-auto">
            <h2 className="text-3xl font-bold text-white mb-4">
              Ready to Start Selling?
            </h2>
            <p className="text-gray-400 mb-6">
              List your items today and reach thousands of active buyers. Get
              started in minutes.
            </p>
            <Link href="auctions/create">
              <button className="glass-button px-8 py-3 rounded-full font-bold inline-flex items-center gap-2">
                Create Your First Auction <ArrowRight size={18} />
              </button>
            </Link>
          </div>
        </div>
      </div>

      {/* Footer */}
      <Footer />
    </main>
  );
}
