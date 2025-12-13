"use client";

import React from "react";
import { ToastProvider } from "@/components/ui/Toast";
import Navigation from "@/components/shared/Navigation";

export default function ClientWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ToastProvider>
      <Navigation />
      {children}
    </ToastProvider>
  );
}
