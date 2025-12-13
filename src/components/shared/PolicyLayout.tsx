// components/shared/PolicyLayout.tsx
import GlassCard from "@/components/ui/GlassCard";
import React from "react";

export default function PolicyLayout({
  title,
  updated,
  intro,
  children,
}: {
  title: string;
  updated?: string;
  intro?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-transparent py-12 mt-16">
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="space-y-6">
          <div className="text-center">
            <h1 className="text-4xl font-extrabold tracking-tight">{title}</h1>
            {updated && (
              <p className="mt-2 text-sm text-gray-400">
                Last updated: {updated}
              </p>
            )}
          </div>

          {/* Intro Card */}
          {intro && (
            <GlassCard className="p-6">
              <div className="prose prose-invert lg:prose-lg mx-auto">
                {intro}
              </div>
            </GlassCard>
          )}

          {/* Main content wrapper */}
          <div className="space-y-6">
            <GlassCard className="p-8">
              <div className="prose prose-invert lg:prose-xl mx-auto">
                {children}
              </div>
            </GlassCard>
          </div>
        </div>
      </main>
    </div>
  );
}

// Small reusable section component exported from the same file so pages can import it
export function PolicySection({
  id,
  title,
  subtitle,
  children,
}: {
  id?: string;
  title: string;
  subtitle?: React.ReactNode;
  children?: React.ReactNode;
}) {
  return (
    <section id={id} className="space-y-4">
      <div className="flex items-center gap-3 mt-3">
        {/* glassy pill header */}
        <div className="glass-panel inline-flex items-center px-4 py-1 rounded-full text-sm font-semibold text-nepal-accent">
          {title}
        </div>
        {subtitle && <div className="text-gray-400">{subtitle}</div>}
      </div>

      <div className="space-y-3">{children}</div>
    </section>
  );
}
