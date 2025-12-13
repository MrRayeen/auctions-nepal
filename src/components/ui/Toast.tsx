"use client";

import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, X, AlertCircle, Info } from "lucide-react";

type ToastType = "success" | "error" | "warning" | "info";

interface Toast {
  id: string;
  message: string;
  type: ToastType;
  duration?: number;
}

interface ToastContextType {
  toasts: Toast[];
  addToast: (message: string, type: ToastType, duration?: number) => void;
  removeToast: (id: string) => void;
}

export const ToastContext = React.createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = (message: string, type: ToastType = "info", duration = 4000) => {
    const id = Date.now().toString();
    const newToast: Toast = { id, message, type, duration };
    setToasts((prev) => [...prev, newToast]);

    if (duration > 0) {
      setTimeout(() => removeToast(id), duration);
    }
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  };

  // Listen for global show-toast events so other modules can call `showToast(...)`
  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail as { message: string; type?: ToastType; duration?: number };
      if (detail?.message) {
        addToast(detail.message, detail.type || "info", detail.duration ?? 4000);
      }
    };

    if (typeof window !== "undefined") {
      window.addEventListener("nepal:show-toast", handler as EventListener);
    }

    return () => {
      if (typeof window !== "undefined") {
        window.removeEventListener("nepal:show-toast", handler as EventListener);
      }
    };
  }, []);

  return (
    <ToastContext.Provider value={{ toasts, addToast, removeToast }}>
      {children}
      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = React.useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within ToastProvider");
  }
  return context;
}

// Simple global helper: dispatch an event that `ToastProvider` listens for.
export function showToast(message: string, type: ToastType = "info", duration = 4000) {
  if (typeof window === "undefined") return;
  const evt = new CustomEvent("nepal:show-toast", { detail: { message, type, duration } });
  window.dispatchEvent(evt);
}

function ToastContainer({
  toasts,
  removeToast,
}: {
  toasts: Toast[];
  removeToast: (id: string) => void;
}) {
  return (
    <div className="fixed top-20 right-4 z-9999 pointer-events-none">
      <AnimatePresence>
        {toasts.map((toast) => (
          <ToastNotification
            key={toast.id}
            toast={toast}
            onClose={() => removeToast(toast.id)}
          />
        ))}
      </AnimatePresence>
    </div>
  );
}

function ToastNotification({
  toast,
  onClose,
}: {
  toast: Toast;
  onClose: () => void;
}) {
  const colors = {
    success: { bg: "bg-green-500/20", border: "border-green-500/50", icon: "text-green-400" },
    error: { bg: "bg-red-500/20", border: "border-red-500/50", icon: "text-red-400" },
    warning: { bg: "bg-yellow-500/20", border: "border-yellow-500/50", icon: "text-yellow-400" },
    info: { bg: "bg-blue-500/20", border: "border-blue-500/50", icon: "text-blue-400" },
  };

  const icons = {
    success: Check,
    error: X,
    warning: AlertCircle,
    info: Info,
  };

  const Icon = icons[toast.type];
  const color = colors[toast.type];

  return (
    <motion.div
      initial={{ opacity: 0, x: 400, y: -20 }}
      animate={{ opacity: 1, x: 0, y: 0 }}
      exit={{ opacity: 0, x: 400 }}
      transition={{ type: "spring", stiffness: 300, damping: 25 }}
      className={`${color.bg} border ${color.border} rounded-xl p-4 mb-3 pointer-events-auto max-w-sm flex items-start gap-3 backdrop-blur-md`}
    >
      <Icon className={`${color.icon} shrink-0 mt-1`} size={20} />
      <div className="flex-1">
        <p className="text-white text-sm font-medium">{toast.message}</p>
      </div>
      <button
        onClick={onClose}
        className="text-gray-400 hover:text-white transition-colors shrink-0"
      >
        <X size={16} />
      </button>
    </motion.div>
  );
}
