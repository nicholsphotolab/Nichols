// VideoTransferConfigurator.tsx
// Interactive price estimator for video & audio transfers, built to mirror the
// film stock configurator (app/film/FilmStockConfigurator.tsx): a two-column
// layout with a media gallery on the left and, on the right, a title + blurb,
// hairline-separated option rows, an itemized ESTIMATED TOTAL, and the
// headline price.
//
// The gallery works exactly like the film configurator's photo strip: the
// lineup always leads with the format's PRODUCT SHOT slot (its `image` in
// videoTransferData, or a solid bw-600 block while that photography doesn't
// exist yet), followed by silent sample clips of digitized footage
// (videoTransferData `media`). The active slide's clip autoplays muted and
// loops like a moving photograph — no controls, no chrome — and the poster
// frames double as the thumbnails below. Users with prefers-reduced-motion
// get poster frames only.
//
// The CATEGORY row switches between Tapes & Discs and Film Reels in place —
// swapping the format/size options and pricing — exactly like the film TYPE row
// switches stock. The output is added once per order (one USB/disc holds the
// whole transfer).

"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { Pills } from "../components/ConfiguratorControls";
import {
  CATEGORIES,
  CATEGORIES_BY_SLUG,
  OUTPUTS,
  type VideoCategory,
  type VideoMediaItem,
} from "./videoTransferData";
import { withBasePath } from "../lib/basePath";
import { buildQuery, matchOption, slugifyOption } from "../lib/urlState";
import { useOrder } from "../components/OrderProvider";
import AddedToOrder from "../components/AddedToOrder";
import MoreProducts from "../components/MoreProducts";
import type { NewOrderLine } from "../lib/orderDraft";
import { formatUSD, summarizeLine } from "../lib/orderPricing";
import styles from "./VideoTransferConfigurator.module.css";

// CATEGORY pills, in display order. Values are slugs; labels come from the data.
const CATEGORY_ORDER = CATEGORIES.map((c) => c.slug);

// USB is the recommended output, so it starts selected.
const RECOMMENDED_OUTPUT = OUTPUTS.find((o) => o.recommended) ?? OUTPUTS[0];

// Short plain-language explanation shown in the tooltip beside each row label.
const ROW_INFO: Record<string, string> = {
  Type: "Tapes & Discs covers VHS, camcorder tapes, audio cassettes, and discs. Film Reels covers 8mm, Super 8, and 16mm movie film.",
  Format: "The kind of tape or disc you're transferring.",
  Size: "The diameter of your film reel, measured across the reel.",
  Output:
    "How you get your files back — a new USB drive, your own USB, or a DVD/CD. Added once per order.",
};

// Row label with an info icon that reveals a tooltip on hover or keyboard focus.
// Mirrors the film configurator's RowLabel.
function RowLabel({ label }: { label: string }) {
  const info = ROW_INFO[label];
  return (
    <span className={styles.rowLabel}>
      {label}
      {info && (
        <span className={styles.info}>
          <button
            type="button"
            className={styles.infoBtn}
            aria-label={`About ${label}`}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={withBasePath("/info.svg")}
              alt=""
              width={18}
              height={18}
              aria-hidden="true"
            />
          </button>
          <span role="tooltip" className={styles.tooltip}>
            {info}
          </span>
        </span>
      )}
    </span>
  );
}

type LineItem = { name: string; sub?: string; amount: number };

// Builds the itemized estimate: the per-item transfer price for the selected
// format/size, plus the output surcharge added once per order.
function buildBreakdown(
  category: VideoCategory,
  option: string,
  output: string
): LineItem[] {
  const opt = category.options.find((o) => o.name === option);
  const out = OUTPUTS.find((o) => o.name === output);

  const items: LineItem[] = [
    { name: `${option} Transfer`, amount: opt?.price ?? 0 },
  ];

  if (out) {
    items.push({
      name: `${out.name} Output`,
      sub: "added once per order",
      amount: out.price,
    });
  }

  return items;
}

export default function VideoTransferConfigurator({
  initialSlug,
}: {
  initialSlug: string;
}) {
  const [slug, setSlug] = useState<string>(initialSlug);
  const category = CATEGORIES_BY_SLUG[slug] ?? CATEGORIES_BY_SLUG[initialSlug];

  // Raw selections; anything the current category doesn't offer is corrected by
  // deriving an effective value at render time (below) rather than writing state
  // back — the same pure-render pattern the film configurator uses.
  const [optionSel, setOptionSel] = useState<string>(category.options[0].name);
  const [output, setOutput] = useState<string>(RECOMMENDED_OUTPUT.name);

  // ---------- Running order ----------
  // Same cart the film configurator writes to: it lives in OrderProvider,
  // mounted in the root layout, so one order can hold rolls and transfers
  // together. This component only appends; the drawer does the rest.
  const { addLine, count, openCart } = useOrder();

  // Transient confirmation after an add — the cart is up in the nav, so the
  // button needs to say something happened where the customer is looking.
  const [addedNote, setAddedNote] = useState<string | null>(null);

  // Product shot of whatever the note is about, held separately so the
  // confirmation band keeps showing what was added even after the customer
  // starts configuring the next item.
  const [addedShot, setAddedShot] = useState<string | null>(null);

  // No timer here: AddedToOrder owns the toast's whole visible lifecycle, since
  // dismissal has to answer to the pointer (it holds while hovered) and only
  // the toast knows where the pointer is. The note is left set, and a new one —
  // always a new string, since it carries the running item count — is what
  // raises the next toast.

  // Restore customization from the URL once on mount (?format=…&output=…).
  // The page is statically pre-rendered with defaults, so the query is applied
  // after hydration. Unknown values are ignored; the derivation below absorbs
  // anything this category doesn't offer. Declared before the URL-sync effect
  // so the query is captured before the first rewrite.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const format = matchOption(
      params.get("format"),
      category.options.map((o) => o.name)
    );
    if (format) setOptionSel(format);
    const out = matchOption(
      params.get("output"),
      OUTPUTS.map((o) => o.name)
    );
    if (out) setOutput(out);
    // Mount-only: the URL is an input here, not a subscription.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Effective format/size: keep the raw selection but fall back to the first
  // option when the current category doesn't offer it (VHS has no reel size).
  const option = category.options.some((o) => o.name === optionSel)
    ? optionSel
    : category.options[0].name;

  // The lineup always leads with the format's PRODUCT SHOT (its `image`, or
  // the temporary solid bw-600 block while a format has no product
  // photography yet — deliberately shown even when the format has sample
  // clips, so the product slot is always reserved; the film configurator's
  // convention), then the sample clips. Memoized so the play/pause effect
  // below only re-runs when the visible set actually swaps.
  type GallerySlide =
    | { kind: "product"; src: string | null }
    | { kind: "clip"; media: VideoMediaItem };
  const slides = useMemo<GallerySlide[]>(() => {
    const opt = category.options.find((o) => o.name === option);
    return [
      { kind: "product", src: opt?.image ?? null },
      ...(opt?.media ?? []).map(
        (media): GallerySlide => ({ kind: "clip", media })
      ),
    ];
  }, [category, option]);

  // Gallery position, film-configurator style: the raw index is clamped so a
  // switch to a shorter strip can't overshoot. Thumbnail clicks glide the
  // track; switching type/format resets to the first slide instantly (the
  // whole set swaps, so a glide across unrelated clips looks wrong).
  const [galleryIdxSel, setGalleryIdxSel] = useState(0);
  const galleryIdx = Math.min(galleryIdxSel, slides.length - 1);
  const [animateSlide, setAnimateSlide] = useState(true);
  const videoRefs = useRef<Record<string, HTMLVideoElement | null>>({});

  // Only the visible slide's clip plays; the rest sit paused on their poster.
  // Reduced-motion users get posters only — nothing autoplays.
  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    slides.forEach((s, i) => {
      if (s.kind !== "clip") return;
      const video = videoRefs.current[s.media.video];
      if (!video) return;
      if (i === galleryIdx && !reduce) {
        video.play().catch(() => {
          // Autoplay can be blocked (e.g. low-power mode); the poster shows instead.
        });
      } else {
        video.pause();
      }
    });
  }, [slides, galleryIdx]);

  // Mirror the visible selection into the URL: path = category, query = the
  // customization with defaults omitted. replaceState rewrites the current
  // history entry — Back always exits, it never un-clicks selections.
  useEffect(() => {
    const query = buildQuery({
      format:
        option !== category.options[0].name ? slugifyOption(option) : null,
      output:
        output !== RECOMMENDED_OUTPUT.name ? slugifyOption(output) : null,
    });
    window.history.replaceState(
      null,
      "",
      withBasePath(`/video/${slug}`) + query
    );
  }, [slug, category, option, output]);

  // Switching TYPE swaps the category but keeps the raw selection — the
  // derivation above absorbs anything the new category doesn't offer. The URL
  // follows automatically via the sync effect above. Any change to the visible
  // strip restarts it from the first slide, without gliding.
  function selectCategory(next: string) {
    if (CATEGORIES_BY_SLUG[next]) {
      setSlug(next);
      setGalleryIdxSel(0);
      setAnimateSlide(false);
    }
  }

  function selectOption(next: string) {
    setOptionSel(next);
    setGalleryIdxSel(0);
    setAnimateSlide(false);
  }

  // Snapshot the current selection into the order, leaving the configurator
  // as it is — the commonest next action is another tape of the same kind, so
  // holding the selection makes that one more click. Mirrors the film
  // configurator down to not popping the drawer open: a counter workflow is
  // several items in a row, and a panel over the page after each would be in
  // the way.
  function addToOrder() {
    const line: NewOrderLine = {
      kind: "video",
      slug,
      option,
      output,
      qty: 1,
    };
    const stored = addLine(line);

    const summary = summarizeLine(stored);
    const next = count + 1;
    setAddedNote(
      `${summary?.text ?? "Item"} added — ${next} ${
        next === 1 ? "item" : "items"
      } in your order.`
    );
    setAddedShot(
      category.options.find((o) => o.name === option)?.image ?? null
    );
  }

  // "SIZE" for reels, "Format" for tapes & discs — drives the row label + tooltip.
  const formatLabel = category.selectorLabel === "SIZE" ? "Size" : "Format";

  const breakdown = buildBreakdown(category, option, output);
  const total = breakdown.reduce((sum, item) => sum + item.amount, 0);

  return (
    <main className={styles.page}>
      <div className={styles.layout}>
        {/* Left column: main frame + thumbnail strip, identical construction
            to the film configurator's. The column stretches to the right
            column's height so the thumbs bottom-align with the price block;
            the media fits (contain) in the remaining space. */}
        <div className={styles.imageCol}>
          <div className={styles.image} aria-hidden="true">
            {/* Horizontal track: all slides sit side by side and the track
                slides by one frame width per gallery index. */}
            <div
              className={styles.track}
              data-instant={!animateSlide || undefined}
              style={{ transform: `translateX(-${galleryIdx * 100}%)` }}
            >
              {slides.map((s) =>
                s.kind === "clip" ? (
                  <div key={s.media.video} className={styles.slide}>
                    <video
                      ref={(el) => {
                        videoRefs.current[s.media.video] = el;
                      }}
                      src={withBasePath(s.media.video)}
                      poster={withBasePath(s.media.poster)}
                      muted
                      loop
                      playsInline
                      preload="metadata"
                      tabIndex={-1}
                    />
                  </div>
                ) : s.src ? (
                  <div key={s.src} className={styles.slide}>
                    <Image
                      src={withBasePath(s.src)}
                      alt=""
                      fill
                      sizes="(max-width: 900px) 100vw, 46vw"
                    />
                  </div>
                ) : (
                  <div key="product-placeholder" className={styles.slide}>
                    <div className={styles.productFill} />
                  </div>
                )
              )}
            </div>
          </div>

          {/* Uniform square thumbs, each poster frame filling its tile
              edge-to-edge (cover crop); the selection border traces the
              square. */}
          {slides.length > 1 && (
            <div
              className={styles.thumbs}
              role="group"
              aria-label="Sample clips"
            >
              {slides.map((s, i) => {
                // Product slot thumbs show the product shot; clips their poster.
                const thumbSrc =
                  s.kind === "clip" ? s.media.poster : s.src;
                return (
                  <button
                    key={s.kind === "clip" ? s.media.video : s.src ?? "product-placeholder"}
                    type="button"
                    className={styles.thumb}
                    data-active={i === galleryIdx || undefined}
                    aria-pressed={i === galleryIdx}
                    aria-label={`Sample ${i + 1} of ${slides.length}`}
                    onClick={() => {
                      setAnimateSlide(true);
                      setGalleryIdxSel(i);
                    }}
                  >
                    {thumbSrc ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={withBasePath(thumbSrc)}
                        alt=""
                        loading="lazy"
                        decoding="async"
                      />
                    ) : (
                      <span className={styles.productFill} aria-hidden="true" />
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Right column: title + blurb, option rows, estimate, price */}
        <div className={styles.body}>
          <header className={styles.header}>
            {/* Just the selected format's name ("VHS", "Hi8"), tracking the
                selection live — the TYPE pills already say which category
                you're in. Reel sizes read as "Reel 3 in." like the cards. */}
            <h1 className={styles.title}>
              {category.slug === "reels"
                ? `Reel ${option.replace(/IN$/i, "")} in.`
                : option}
            </h1>
            <p className={styles.blurb}>{category.description}</p>
          </header>

          <hr className={styles.divider} />

          <div className={styles.rows}>
            <div className={styles.row}>
              <RowLabel label="Type" />
              <Pills
                values={CATEGORY_ORDER}
                selected={slug}
                onSelect={selectCategory}
                format={(s) => CATEGORIES_BY_SLUG[s]?.name ?? s}
              />
            </div>

            <div className={styles.row}>
              <RowLabel label={formatLabel} />
              <Pills
                values={category.options.map((o) => o.name)}
                selected={option}
                onSelect={selectOption}
              />
            </div>

            <div className={styles.row}>
              <RowLabel label="Output" />
              <Pills
                values={OUTPUTS.map((o) => o.name)}
                selected={output}
                onSelect={setOutput}
                format={(name) => {
                  const out = OUTPUTS.find((o) => o.name === name)!;
                  return `${out.name} · $${out.price}`;
                }}
              />
            </div>
          </div>

          <hr className={styles.divider} />

          {/* Itemized estimate */}
          <div className={styles.total}>
            <div className={styles.totalHead}>
              <span className={styles.totalLabel}>Estimated total</span>
              <p className={styles.noticeText}>
                Final price is confirmed when your order is dropped off.
              </p>
            </div>
            <div className={styles.breakdown}>
              {breakdown.map((item) => (
                <div className={styles.lineItem} key={item.name}>
                  <span className={styles.lineLabel}>
                    <span className={styles.lineName}>{item.name}</span>
                    {item.sub && (
                      <span className={styles.lineSub}>{item.sub}</span>
                    )}
                  </span>
                  <span className={styles.lineAmount}>
                    {formatUSD(item.amount)}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <hr className={styles.divider} />

          <p className={styles.price} aria-live="polite">
            {formatUSD(total)}
          </p>

          <div className={styles.addBlock}>
            <button type="button" className={styles.addBtn} onClick={addToOrder}>
              Add to order
            </button>
            {/* The note is now spoken-only — AddedToOrder keeps it in an
                always-mounted live region and raises the toast. */}
            <AddedToOrder
              note={addedNote}
              image={addedShot}
              onViewCart={openCart}
            />
          </div>
        </div>
      </div>

      {/* Cross-sell: leads with a service they aren't already looking at. */}
      <MoreProducts family={slug} />
    </main>
  );
}
