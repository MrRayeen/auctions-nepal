import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import ClientWrapper from "@/components/shared/ClientWrapper";
import { ThemeProvider } from "@/context/ThemeContext";

// src/app/layout.tsx

export const metadata: Metadata = {
  title: {
    default: "NepalAuction | Premium Online Marketplace",
    template: "%s | NepalAuction",
  },
  description:
    "The #1 marketplace in Nepal for auctions. Buy and sell electronics, vehicles, and antiques securely.",
  keywords: [
    "Nepal auction",
    "online shopping nepal",
    "second hand nepal",
    "bidding site",
  ],
  openGraph: {
    title: "NepalAuction",
    description: "Bid on exclusive items in Nepal.",
    url: "https://nepalauction.com",
    siteName: "NepalAuction",
    locale: "en_NP",
    type: "website",
  },
};

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ThemeProvider>
          <ClientWrapper>{children}</ClientWrapper>
        </ThemeProvider>
      </body>
    </html>
  );
}
