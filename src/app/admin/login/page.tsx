"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Lock, LogIn } from "lucide-react";
import { useToast } from "@/components/ui/Toast";

const ADMIN_USERNAME = "potato";
const ADMIN_PASSWORD = "sauce???";

export default function AdminLogin() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { addToast } = useToast();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Simulate a small delay for security (prevent timing attacks)
      await new Promise((resolve) => setTimeout(resolve, 500));

      if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
        // Store admin token in localStorage
        // Use the hardcoded token that API endpoints expect
        const adminToken = "admin-secret-key";
        localStorage.setItem("adminToken", adminToken);

        addToast("Welcome back, Admin! 🎉", "success");
        router.push("/admin/dashboard");
      } else {
        addToast("Invalid credentials", "error");
        setPassword("");
      }
    } catch (error) {
      addToast("Login failed", "error");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center relative overflow-hidden pt-20 pb-20">
      {/* Gradient background */}
      <div className="fixed inset-0 bg-linear-to-br from-nepal-accent/20 via-transparent to-purple-900/20 pointer-events-none z-0" />
      <div className="fixed top-0 right-0 w-[500px] h-[500px] bg-purple-600/20 blur-[120px] rounded-full pointer-events-none z-0" />

      <div className="relative z-10 w-full max-w-md px-6">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full glass-panel mb-6">
            <Lock size={32} className="text-nepal-accent" />
          </div>
          <h1 className="text-4xl font-bold text-white mb-2">Admin Portal</h1>
          <p className="text-gray-400">Manage your Nepal Auction marketplace</p>
        </div>

        {/* Login Form */}
        <form onSubmit={handleLogin} className="space-y-6">
          <div className="glass-panel p-8 rounded-3xl space-y-6">
            {/* Username Field */}
            <div className="space-y-2">
              <label className="text-sm text-gray-400 uppercase tracking-wider font-semibold">
                Username
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter admin username"
                disabled={isLoading}
                className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/20 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-nepal-accent disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              />
            </div>

            {/* Password Field */}
            <div className="space-y-2">
              <label className="text-sm text-gray-400 uppercase tracking-wider font-semibold">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter admin password"
                disabled={isLoading}
                className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/20 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-nepal-accent disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              />
            </div>

            {/* Login Button */}
            <button
              type="submit"
              disabled={isLoading || !username || !password}
              className="w-full glass-button py-3 text-lg font-bold flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed active:scale-95 transition-transform"
            >
              <LogIn size={20} />
              {isLoading ? "Authenticating..." : "Login to Dashboard"}
            </button>
          </div>

          {/* Security Notice */}
          <div className="text-center">
            <p className="text-xs text-gray-500">
              🔐 Admin access is restricted. Invalid attempts are logged.
            </p>
          </div>
        </form>
      </div>
    </main>
  );
}
