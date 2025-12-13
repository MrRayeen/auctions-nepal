"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { Gavel, Search, MessageCircle, User, Menu, LogOut } from "lucide-react";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import ThemeToggle from "@/components/ThemeToggle";

export default function Navigation() {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem("authToken");
    setIsLoggedIn(!!token);
  }, []);

  // Fetch unread message count periodically
  useEffect(() => {
    if (!isLoggedIn) return;

    const fetchUnreadCount = async () => {
      try {
        const token = localStorage.getItem("authToken");
        const res = await fetch(`/api/chat/unread`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (res.ok) {
          const data = await res.json();
          setUnreadCount(data.unreadCount || 0);
        }
      } catch (err) {
        console.error("Error fetching unread count:", err);
      }
    };

    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 30000); // Check every 30 seconds

    return () => clearInterval(interval);
  }, [isLoggedIn]);

  const navItems = [
    { name: "Auctions", href: "/auctions", icon: Gavel },
    { name: "Chat", href: "/chat", icon: MessageCircle },
    { name: "Profile", href: "/profile", icon: User },
  ];

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/auctions?search=${encodeURIComponent(searchQuery)}`);
      setSearchQuery("");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("authToken");
    localStorage.removeItem("userData");
    setIsLoggedIn(false);
    router.push("/");
    setIsOpen(false);
  };

  return (
    <motion.nav
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      className="fixed top-0 w-full z-40 backdrop-blur-xl bg-black/30 border-b border-white/10"
    >
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-full bg-linear-to-br from-nepal-accent to-purple-500 flex items-center justify-center">
            <Gavel size={20} className="text-black" />
          </div>
          <span className="font-bold text-lg text-white hidden sm:inline">
            Nepal Auction
          </span>
        </Link>

        {/* Search Bar - Desktop */}
        <form
          onSubmit={handleSearch}
          className="hidden md:flex flex-1 mx-8 max-w-md"
        >
          <div className="relative w-full">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              size={18}
            />
            <input
              type="text"
              placeholder="Search auctions..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-full glass-panel bg-white/5 border-white/20 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-nepal-accent text-sm"
            />
          </div>
        </form>

        {/* Desktop Nav */}
        <div className="hidden md:flex items-center gap-2">
          {navItems.map(({ name, href, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className="relative glass-panel px-4 py-2 rounded-full flex items-center gap-2 hover:bg-white/20 transition-all text-sm font-medium"
            >
              <Icon size={18} />
              {name}
              {name === "Chat" && unreadCount > 0 && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center"
                >
                  {unreadCount > 99 ? "99+" : unreadCount}
                </motion.div>
              )}
            </Link>
          ))}
          <ThemeToggle />
          {isLoggedIn ? (
            <>
              <Link href="/auctions/create">
                <button className="glass-button px-6 py-2 rounded-full text-sm font-bold">
                  Sell
                </button>
              </Link>
              <button
                onClick={handleLogout}
                className="glass-panel px-4 py-2 rounded-full text-sm font-bold hover:bg-red-500/20 transition-all flex items-center gap-2"
              >
                <LogOut size={18} />
                Logout
              </button>
            </>
          ) : (
            <>
              <Link href="/auth/signup">
                <button className="glass-panel px-4 py-2 rounded-full text-sm font-bold hover:bg-white/20 transition-all">
                  Sign Up
                </button>
              </Link>
              <Link href="/auth/login">
                <button className="glass-button px-4 py-2 rounded-full text-sm font-bold">
                  Log In
                </button>
              </Link>
            </>
          )}
        </div>

        {/* Mobile Menu Button */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="md:hidden glass-panel p-2 rounded-full"
        >
          <Menu size={20} />
        </button>
      </div>

      {/* Mobile Menu */}
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="md:hidden border-t border-white/10 p-4 bg-black/50 backdrop-blur-xl"
        >
          <div className="mb-4">
            <form onSubmit={handleSearch} className="relative">
              <Search
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                size={18}
              />
              <input
                type="text"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 rounded-full glass-panel bg-white/5 border-white/20 text-white placeholder-gray-400 text-sm"
              />
            </form>
          </div>
          <div className="space-y-2">
            {navItems.map(({ name, href, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                onClick={() => setIsOpen(false)}
                className="glass-panel px-4 py-3 rounded-lg flex items-center gap-2 hover:bg-white/20 transition-all w-full"
              >
                <Icon size={18} />
                {name}
              </Link>
            ))}
            {isLoggedIn ? (
              <div className="flex flex-col gap-2">
                <span className="w-full border mt-2 border-white/60"></span>
                <Link href="/auctions/create" onClick={() => setIsOpen(false)}>
                  <button className="glass-button px-4 py-3 rounded-lg w-full font-bold">
                    Sell Item
                  </button>
                </Link>
                <button
                  onClick={handleLogout}
                  className="glass-panel px-4 py-3 rounded-lg w-full font-bold hover:bg-red-500/20 transition-all flex items-center justify-center gap-2"
                >
                  <LogOut size={18} />
                  Logout
                </button>
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                <span className="w-full border mt-2 border-white/60"></span>

                <Link href="/auctions/create" onClick={() => setIsOpen(false)}>
                  <button className="glass-button px-4 py-3 rounded-lg w-full font-bold">
                    Sell Item
                  </button>
                </Link>
                <Link href="/auth/signup" onClick={() => setIsOpen(false)}>
                  <button className="glass-panel px-4 py-3 rounded-lg w-full font-bold hover:bg-white/20 transition-all">
                    Sign Up
                  </button>
                </Link>
                <Link href="/auth/login" onClick={() => setIsOpen(false)}>
                  <button className="glass-button px-4 py-3 rounded-lg w-full font-bold">
                    Log In
                  </button>
                </Link>
              </div>
            )}
          </div>
        </motion.div>
      )}
    </motion.nav>
  );
}
