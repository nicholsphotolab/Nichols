// app/layout.tsx
// Root layout — wraps every page on the site.
// Loads the Inter Variable font (full glyph set, no subset restrictions) via
// next/font/local, which bakes the correct basePath into the font URL at
// build time — unlike a plain CSS @font-face url(), which always resolves
// against the domain root and breaks on the GitHub Pages /Nichols/ subpath.
// Mounts global components that persist across all routes:
//   - BrandLogoSwitch: renders the hero logo on / and the nav logo everywhere else
//   - Footer: site-wide footer with logo scroll-reveal animation

import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import "./globals.css";
import BrandLogoSwitch from "./components/BrandLogoSwitch";
import Footer from "./components/Footer";
import GridOverlay from "./components/GridOverlay";
import { withBasePath } from "./lib/basePath";

const interVariable = localFont({
  src: "../public/fonts/InterVariable.woff2",
  weight: "100 900",
  style: "normal",
  display: "swap",
  variable: "--font-inter",
});

// Tints browser chrome (Safari's tab bar / overscroll areas) to the site's
// paper-white so the elastic-bounce zone doesn't read as a foreign grey strip.
export const viewport: Viewport = {
  themeColor: "#f9f8f4",
};

export const metadata: Metadata = {
  // Production domain — used to resolve absolute URLs in the sitemap and any
  // future OpenGraph tags. The GitHub Pages preview deploy ignores this.
  metadataBase: new URL("https://nicholsphotolab.com"),
  // Pages set their own leaf title (e.g. "Film Developing"); the template
  // appends the brand. The home page uses the default.
  title: {
    default: "Nichols Photo Lab",
    template: "%s — Nichols Photo Lab",
  },
  description:
    "Salt Lake City film lab. Develop, scan, and print. Prints, video transfer, and passport photos.",
  icons: {
    icon: [
      { url: withBasePath("/Favicon%20Light%20Mode.png"), type: "image/png", media: "(prefers-color-scheme: light)" },
      { url: withBasePath("/Favicon%20Dark%20Mode.png"), type: "image/png", media: "(prefers-color-scheme: dark)" },
      { url: withBasePath("/Favicon.svg"), type: "image/svg+xml" },
    ],
    apple: [{ url: withBasePath("/Apple%20Touch%20Icon.png"), sizes: "180x180" }],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={interVariable.variable}>
      <body>
        {/* Switches between the hero logo (home) and nav logo (all other pages) */}
        <BrandLogoSwitch />
        {children}
        <Footer />
        {/* Press G to toggle the column-grid debug overlay — dev builds only */}
        {process.env.NODE_ENV !== "production" && <GridOverlay />}
      </body>
    </html>
  );
}
