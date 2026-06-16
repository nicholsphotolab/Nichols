// app/layout.tsx
// Root layout — wraps every page on the site.
// Loads the Inter Variable font from /public/fonts/InterVariable.woff2 via
// globals.css @font-face (full glyph set, no subset restrictions).
// Mounts three global components that persist across all routes:
//   - LenisScrollProvider: initialises smooth scrolling via the Lenis library
//   - BrandLogoSwitch: renders the hero logo on / and the nav logo everywhere else
//   - Footer: site-wide footer with logo scroll-reveal animation

import type { Metadata } from "next";
import "./globals.css";
import "lenis/dist/lenis.css";
import LenisScrollProvider from "./components/LenisScrollProvider";
import BrandLogoSwitch from "./components/BrandLogoSwitch";
import Footer from "./components/Footer";
import GridOverlay from "./components/GridOverlay";

export const metadata: Metadata = {
  title: "Nichols Photo Lab",
  description:
    "Salt Lake City film lab. Develop, scan, and print. Prints, video transfer, and passport photos.",
  icons: {
    icon: [
      { url: "/Favicon%20Light%20Mode.png", type: "image/png", media: "(prefers-color-scheme: light)" },
      { url: "/Favicon%20Dark%20Mode.png", type: "image/png", media: "(prefers-color-scheme: dark)" },
      { url: "/Favicon.svg", type: "image/svg+xml" },
    ],
    apple: [{ url: "/Apple%20Touch%20Icon.png", sizes: "180x180" }],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        {/* Smooth scroll — must be first so scroll events are intercepted early */}
        <LenisScrollProvider />
        {/* Switches between the hero logo (home) and nav logo (all other pages) */}
        <BrandLogoSwitch />
        {children}
        <Footer />
        {/* Press G to toggle the column-grid debug overlay */}
        <GridOverlay />
      </body>
    </html>
  );
}
