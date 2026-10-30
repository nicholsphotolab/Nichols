// RootLayout.tsx
// Wraps every route (mounted once by App.tsx). Mounts global components that
// persist across all pages:
//   - OrderProvider: holds the in-progress film order (the nav cart reads it,
//     the film configurator writes to it) and its localStorage draft
//   - BrandLogoSwitch: renders the hero logo on / and the nav logo everywhere else
//   - CartDrawer: the slide-out order panel opened from the nav cart button
//   - Footer: site-wide footer with logo scroll-reveal animation
//
// The ABC Areal Variable font face, favicons, and default <title>/description
// live in index.html (this is a plain static HTML shell now, not a Next
// document) — see globals.css for the --font-areal token and
// src/routeMeta.ts for per-route title/description.

import type { ReactNode } from "react";
import "./globals.css";
import BrandLogoSwitch from "@/components/layout/BrandLogoSwitch";
import CartDrawer from "@/order/CartDrawer";
import FontFace from "@/components/layout/FontFace";
import Footer from "@/components/layout/Footer";
import GridOverlay from "@/components/layout/GridOverlay";
import OrderProvider from "@/order/OrderProvider";

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <OrderProvider>
      <FontFace />
      {/* First Tab stop on every page — jumps past the nav to the content. */}
      <a className="skip-link" href="#main">
        Skip to content
      </a>
      {/* Switches between the hero logo (home) and nav logo (all other pages) */}
      <BrandLogoSwitch />
      {children}
      <Footer />
      <CartDrawer />
      {/* Press G to toggle the column-grid debug overlay — dev builds only */}
      {!import.meta.env.PROD && <GridOverlay />}
    </OrderProvider>
  );
}
