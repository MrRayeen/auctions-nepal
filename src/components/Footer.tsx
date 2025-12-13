"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { Gavel, Mail, MapPin, Phone } from "lucide-react";

export default function Footer() {
  const currentYear = new Date().getFullYear();

  const links = [
    { label: "About", href: "#about" },
    { label: "Privacy Policy", href: "/privacy-policy" },
    { label: "Terms of Service", href: "/terms-of-service" },
    { label: "Contact", href: "#contact" },
    { label: "Listing Rules", href: "/listing-rules" },
  ];

  return (
    <footer className="bg-nepal-900/80 backdrop-blur border-t w-full mx-auto border-white/10 pt-16 pb-8 rounded-t-4xl">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
          {/* Logo & Branding */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="space-y-4"
          >
            <div className="flex items-center gap-2 mb-2">
              <div className="w-10 h-10 rounded-lg bg-linear-to-br from-nepal-accent to-purple-500 flex items-center justify-center">
                <Gavel size={24} className="text-white" />
              </div>
              <h2 className="text-2xl font-bold text-white">AuctionHub</h2>
            </div>
            <p className="text-gray-400 text-sm">
              Nepal's premier online auction marketplace. Buy, sell, and bid with confidence.
            </p>
            <div className="space-y-2 text-sm text-gray-400">
              <div className="flex items-center gap-2">
                <MapPin size={16} className="text-nepal-accent" />
                <span>Kathmandu, Nepal</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone size={16} className="text-nepal-accent" />
                <span>+977-1-4000000</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail size={16} className="text-nepal-accent" />
                <span>support@auctionhub.np</span>
              </div>
            </div>
          </motion.div>

          {/* Quick Links */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="space-y-4"
          >
            <h3 className="text-lg font-bold text-white">Quick Links</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/auctions" className="text-gray-400 hover:text-nepal-accent transition-colors">
                  Browse Auctions
                </Link>
              </li>
              <li>
                <Link href="/auctions/create" className="text-gray-400 hover:text-nepal-accent transition-colors">
                  Sell Item
                </Link>
              </li>
              <li>
                <Link href="/profile" className="text-gray-400 hover:text-nepal-accent transition-colors">
                  My Profile
                </Link>
              </li>
              <li>
                <Link href="/chat" className="text-gray-400 hover:text-nepal-accent transition-colors">
                  Messages
                </Link>
              </li>
            </ul>
          </motion.div>

          {/* Resources */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="space-y-4"
          >
            <h3 className="text-lg font-bold text-white">Resources</h3>
            <ul className="space-y-2">
              {links.map((link) => (
                <li key={link.label}>
                  <Link href={link.href} className="text-gray-400 hover:text-nepal-accent transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </motion.div>

          {/* Social & Newsletter */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3 }}
            className="space-y-4"
          >
            <h3 className="text-lg font-bold text-white">Stay Updated</h3>
            <p className="text-gray-400 text-sm">
              Subscribe to get notified about new auctions and updates.
            </p>
            <div className="flex gap-2">
              <input
                type="email"
                placeholder="Enter your email"
                className="flex-1 px-4 py-2 rounded-lg glass-panel bg-white/5 border-white/20 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-nepal-accent text-sm"
              />
              <button className="glass-button px-4 py-2 rounded-lg font-bold">Subscribe</button>
            </div>
            <div className="flex gap-4 pt-4">
              <a href="#" className="w-10 h-10 rounded-full glass-panel flex items-center justify-center hover:bg-white/20 transition-colors text-nepal-accent">
                f
              </a>
              <a href="#" className="w-10 h-10 rounded-full glass-panel flex items-center justify-center hover:bg-white/20 transition-colors text-nepal-accent">
                𝕏
              </a>
              <a href="#" className="w-10 h-10 rounded-full glass-panel flex items-center justify-center hover:bg-white/20 transition-colors text-nepal-accent">
                in
              </a>
            </div>
          </motion.div>
        </div>

        {/* Divider */}
        <div className="border-t border-white/10 py-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-gray-400">
            <p>© {currentYear} AuctionHub Nepal. All rights reserved.</p>
            <div className="flex gap-6">
              <Link href="/privacy-policy" className="hover:text-nepal-accent transition-colors">
                Privacy Policy
              </Link>
              <Link href="/terms-of-service" className="hover:text-nepal-accent transition-colors">
                Terms of Service
              </Link>
              <Link href="#contact" className="hover:text-nepal-accent transition-colors">
                Contact Us
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
