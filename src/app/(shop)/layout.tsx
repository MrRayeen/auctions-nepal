import type { ReactNode } from "react";
import Navigation from "@/components/shared/Navigation";

export default function ShopLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <Navigation />
      {children}
    </>
  );
}
