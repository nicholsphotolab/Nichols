"use client";

import { usePathname } from "next/navigation";
import HeroLogo from "./HeroLogo";
import NavBrand from "./NavBrand";

/**
 * Picks the brand mark based on route.
 * - Home (/) → <HeroLogo /> which starts giant in the hero and morphs into
 *   the top-left nav position as the user scrolls.
 * - Everywhere else → <NavBrand /> which is just the static top-left mark.
 */
export default function Brand() {
  const pathname = usePathname();
  return pathname === "/" ? <HeroLogo /> : <NavBrand />;
}
