// Single source of truth for site-wide links and contact info.
// Imported by Nav, Footer, and anywhere else that needs them so labels and
// numbers can't drift out of sync.

export const ORDER_URL =
  "https://www.roesweb.com/configs/NicholsRW/products/standard";

export type NavItem = {
  href: string;
  /** Short label used in the top nav. */
  label: string;
  /** Longer label used in the footer. Falls back to `label`. */
  footerLabel?: string;
};

export const NAV_ITEMS: NavItem[] = [
  { href: "/film", label: "Film" },
  { href: "/prints", label: "Prints" },
  { href: "/video", label: "Video", footerLabel: "Video & Reels" },
  { href: "/passport", label: "Passport" },
  { href: "/about", label: "About", footerLabel: "About Us" },
  { href: "/faq", label: "FAQ" },
];

export const CONTACT = {
  phoneDisplay: "801-486-3053",
  phoneTel: "+18014863053",
  addressLine1: "3265 South 1100 East",
  addressLine2: "Salt Lake City, UT 84106",
} as const;

export const MAPS_URL = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
  `${CONTACT.addressLine1}, ${CONTACT.addressLine2}`
)}`;
