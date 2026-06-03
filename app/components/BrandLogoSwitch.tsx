// BrandLogoSwitch.tsx
// Decides which brand mark to render based on the current route.
// Mounted once in the root layout so it persists across all pages.
//
//   / (home)        → HeroLogo: starts as a large centred logo in the hero
//                     section, then morphs into the top-left nav position on scroll.
//   All other pages → NavBrand: a static, always-visible top-left mark.

"use client";

import { usePathname } from "next/navigation";
import HeroLogo from "./HeroLogo";
import NavBrand from "./NavBrand";

export default function BrandLogoSwitch() {
  const pathname = usePathname();
  return pathname === "/" ? <HeroLogo /> : <NavBrand />;
}
