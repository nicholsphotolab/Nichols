// videoFormatsData.ts
// Source of truth for video & audio transfer formats.
// Each entry maps a URL slug to a VideoFormat consumed by the services carousel,
// the process steps, and the [format] detail page. To add a format: add an entry
// here — a route is pre-rendered automatically via generateStaticParams in
// app/video/[format]/page.tsx and a card appears in the carousel.

export type VideoFormat = {
  slug: string;
  name: string;
  /** Starting price copy shown on the carousel and detail page. */
  startingAt: string;
  /** Short description of what's included. */
  description: string;
  /** Optional card/hero image; empty renders a placeholder. */
  image?: string;
};

// Ordered list — the carousel and process steps render these in this sequence.
export const FORMATS: VideoFormat[] = [
  {
    slug: "vhs",
    name: "VHS",
    startingAt: "Transfer from $25.00",
    description: "Standard VHS tapes captured to clean, shareable digital files.",
  },
  {
    slug: "vhs-c",
    name: "VHS-C",
    startingAt: "Transfer from $25.00",
    description: "Compact VHS-C camcorder tapes transferred to digital.",
  },
  {
    slug: "hi8",
    name: "Hi8",
    startingAt: "Transfer from $25.00",
    description: "Hi8 and Video8 camcorder tapes digitized to modern files.",
  },
  {
    slug: "mini dv",
    name: "Mini DV",
    startingAt: "Transfer from $25.00",
    description: "MiniDV camcorder tapes captured frame-accurate to digital.",
  },
  {
    slug: "cassette",
    name: "Cassette",
    startingAt: "Transfer from $15.00",
    description: "Audio cassette tapes converted to clean digital audio.",
  },
  {
    slug: "reels",
    name: "Reels",
    startingAt: "Transfer from $20.00",
    description: "8mm, Super 8, and 16mm film reels transferred frame by frame.",
  },
  {
    slug: "dvd",
    name: "DVD",
    startingAt: "Convert from $15.00",
    description: "DVDs and discs converted into modern, shareable digital files.",
  },
];

// Lookup map for the [format] detail route.
export const FORMATS_BY_SLUG: Record<string, VideoFormat> = Object.fromEntries(
  FORMATS.map((f) => [f.slug, f])
);
