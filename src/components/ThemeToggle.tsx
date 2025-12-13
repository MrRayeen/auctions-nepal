"use client";

import { useTheme } from "@/context/ThemeContext";
import { Moon, Sun } from "lucide-react";
import { motion } from "framer-motion";

export default function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  return (
    <motion.button
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={toggleTheme}
      className="relative w-12 h-12 rounded-full glass-panel flex items-center justify-center hover:bg-white/20 transition-colors group"
      aria-label="Toggle theme"
    >
      <motion.div
        animate={{ rotate: theme === 'dark' ? 0 : 360 }}
        transition={{ duration: 0.3, type: "spring", stiffness: 200 }}
        className="flex items-center justify-center"
      >
        {theme === 'dark' ? (
          <Moon size={20} className="text-nepal-accent" />
        ) : (
          <Sun size={20} className="text-yellow-400" />
        )}
      </motion.div>
      
      {/* Tooltip */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        whileHover={{ opacity: 1, y: -40 }}
        transition={{ duration: 0.2 }}
        className="absolute top-0 left-1/2 -translate-x-1/2 px-3 py-1 bg-nepal-accent text-white text-xs rounded-full whitespace-nowrap pointer-events-none"
      >
        {theme === 'light' ? 'Light Mode' : 'Dark Mode'}
      </motion.div>
    </motion.button>
  );
}
