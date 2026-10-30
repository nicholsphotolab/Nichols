// FilmStockConfigurator.tsx
// Interactive pricing panel for a single film stock (C-41, B&W, or E-6),
// rendered by FilmStockPage for /film/:stock. Selecting format, output, scan
// type, exposure and sheet size recomputes an itemized estimate; push/pull and
// half frame sit behind a "More Options" disclosure. "Add to order" snapshots
// the selection into the shared cart.
//
// The page frame — gallery column, header, estimate, add button, toast,
// explainer modal, cross-sell — is ConfiguratorLayout, shared with the video
// estimator. Pricing maths and display labels live in filmPricing.ts, shared
// with the cart and the printable order form.

import { useEffect, useState } from "react";
import {
  CaptionPills,
  CheckRow,
  FormatThumbs,
  Pills,
  Stepper,
} from "@/components/configurator/ConfiguratorControls";
import ConfiguratorGallery from "@/components/configurator/ConfiguratorGallery";
import ConfiguratorLayout, { OptionRow } from "@/components/configurator/ConfiguratorLayout";
import { withBasePath } from "@/lib/basePath";
import { buildQuery, matchOption, slugifyOption } from "@/lib/urlState";
import {
  billedFrames,
  buildBreakdown,
  clampPushPull,
  defaultExp,
  defaultSheetSize,
  defaultSize,
  defaultsFor,
  FILM_INFO_COPY,
  HALF_FRAME_CAPTIONS,
  HALF_FRAME_LABELS,
  HALF_FRAME_ORDER,
  halfFrameAvailable,
  OUTPUT_LABELS,
  OUTPUT_ORDER,
  outputHasScans,
  PUSH_PULL_MAX,
  PUSH_PULL_MIN,
  pushPullShort,
  SCAN_TYPE_LABELS,
  SCAN_TYPE_ORDER,
  SIZE_LABELS,
} from "./filmPricing";
import { STOCKS, type StockGallery } from "./filmStocksData";
import styles from "./FilmStockConfigurator.module.css";

export default function FilmStockConfigurator({
  slug,
  galleries,
}: {
  slug: string;
  /** Per-stock galleries, keyed by slug (see StockGallery). */
  galleries: Record<string, StockGallery>;
}) {
  const stock = STOCKS[slug];

  // State holds the *raw* selections as the user made them; anything the
  // current format doesn't offer is corrected by deriving an effective value
  // at render time (below) rather than by writing state back. That keeps every
  // render a pure function of the selections — no corrective re-renders — and
  // means a remembered choice (e.g. 24 EXP) reapplies by itself when the user
  // switches back to a format that has it.
  const init = defaultsFor(stock);
  const [sizeSel, setSizeSel] = useState<string>(init.size);
  const [output, setOutput] = useState<string | null>(init.output);
  const [expSel, setExpSel] = useState<string | null>(init.exp);
  const [sheetSizeSel, setSheetSizeSel] = useState<string | null>(null);
  const [scanTypeSel, setScanTypeSel] = useState<string>("STANDARD");

  // ---------- Optional extras ----------
  // Behind the "Show More Options" disclosure, which starts closed: most rolls
  // want neither, and two more rows on every film page taxes every customer to
  // serve the few who push.
  const [moreOpen, setMoreOpen] = useState(false);

  // Stops of push (+) or pull (−), and whether the row is switched on at all.
  // Kept apart so unchecking the box means "develop normally" without discarding
  // the number — re-checking it returns the customer's own +2 rather than
  // silently resetting, the same way a remembered 24 EXP comes back.
  const [pushPullOn, setPushPullOn] = useState(false);
  const [pushPullSel, setPushPullSel] = useState(0);

  // Null means an ordinary full-frame roll, so this doubles as the checkbox
  // state — there is no such thing as a half-frame roll with no scan preference.
  const [halfFrameSel, setHalfFrameSel] = useState<string | null>(null);

  // Restore customization from the URL once on mount (?format=…&output=…&
  // exp=…&sheet=…). The page is statically pre-rendered with defaults, so the
  // query must be applied after hydration, not during the first render.
  // Values are matched against this stock's real option lists — anything
  // unknown is ignored, and the derivations below absorb any impossible
  // combination. Declared before the URL-sync effect below so the query is
  // captured before the first rewrite.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const format = matchOption(params.get("format"), stock.sizes);
    if (format) setSizeSel(format);
    const out = matchOption(params.get("output"), stock.outputs);
    if (out) setOutput(out);
    const exp = params.get("exp");
    if (exp && /^\d+$/.test(exp)) setExpSel(exp);
    const sheet = matchOption(params.get("sheet"), stock.sheetSizes ?? []);
    if (sheet) setSheetSizeSel(sheet);
    // Mount-only: the URL is an input here, not a subscription.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ---------- Effective selections ----------
  // Format falls back only if this stock doesn't offer it (E-6 has no 110).
  const size = stock.sizes.includes(sizeSel) ? sizeSel : defaultSize(stock);

  // Exposure counts for this format + output; empty means no EXPOSURE row
  // (sheet film, disposables, develop-only).
  const expOptions = output ? stock.exposures[size]?.[output] ?? [] : [];
  const exp = expSel && expOptions.includes(expSel) ? expSel : defaultExp(expOptions);

  // SHEET shows a Sheet Size row (4x5/5x7/8x10) in place of EXPOSURE.
  const sheetSizeOptions = size === "SHEET" ? stock.sheetSizes ?? [] : [];
  const sheetSize =
    sheetSizeSel && sheetSizeOptions.includes(sheetSizeSel)
      ? sheetSizeSel
      : defaultSheetSize(sheetSizeOptions);

  // Extras resolve the same way: moving a roll to 120 stops it being
  // half-frame without destroying the choice, and moving it back returns it.
  // Push/pull is offered everywhere, so only the checkbox can zero it.
  const halfFrameOffered = halfFrameAvailable(size, output);
  const halfFrame = halfFrameOffered ? halfFrameSel : null;
  const pushPull = pushPullOn ? clampPushPull(pushPullSel) : 0;

  // Scan resolution only applies where something is being scanned — so a
  // develop-only roll doesn't carry a resolution it was never charged for.
  const scansSelected = outputHasScans(output);
  const scanType = scansSelected ? scanTypeSel : null;

  // Mirror the visible selection into the URL: path = stock, query = the
  // customization with defaults omitted, so uncustomized URLs stay clean and
  // a refresh (or shared link) restores exactly what's on screen. replaceState
  // rewrites the current history entry — Back always exits to the page the
  // user came from rather than stepping back through pill clicks.
  useEffect(() => {
    const d = defaultsFor(stock);
    const query = buildQuery({
      format: size !== d.size ? slugifyOption(size) : null,
      output: output && output !== d.output ? slugifyOption(output) : null,
      exp: exp && exp !== defaultExp(expOptions) ? exp : null,
      sheet:
        sheetSize && sheetSize !== defaultSheetSize(sheetSizeOptions)
          ? slugifyOption(sheetSize)
          : null,
    });
    // Keeps the entry's existing state: React Router's key for this page
    // lives there, and scroll restoration (useScrollRestoration) uses it.
    window.history.replaceState(window.history.state, "", withBasePath(`/film/${slug}`) + query);
    // The option lists are derived from size + output, which are listed.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug, stock, size, output, exp, sheetSize]);

  // ---------- Gallery ----------
  // Leads with the format's PRODUCT SHOT — or the solid placeholder while a
  // format has no product photography, deliberately shown even when it has
  // gallery photos so the product slot is always reserved. SHEET prefers the
  // selected sheet size's own shot ("SHEET/4X5") before the generic one.
  // Then the stock's shared photos, the format's folder, and for SHEET the
  // sheet size's folder — so C-41 · 35MM never shows 120 photos.
  const productShot =
    (size === "SHEET" && sheetSize
      ? stock.sizeImages?.[`${size}/${sheetSize}`]
      : undefined) ??
    stock.sizeImages?.[size] ??
    null;
  const stockGallery = galleries[slug];
  const photos = [
    ...(stockGallery?.product ?? []),
    ...(stockGallery?.bySize[size] ?? []),
    ...(size === "SHEET" && sheetSize
      ? stockGallery?.bySize[`${size}/${sheetSize}`] ?? []
      : []),
  ];
  const slides = [productShot, ...photos].map((src) => ({
    kind: "image" as const,
    src,
  }));

  const breakdown = buildBreakdown(
    stock,
    size,
    output,
    exp,
    sheetSize,
    scanType,
    halfFrame
  );

  // Outputs in Figma display order, filtered to what this stock offers.
  const outputValues = OUTPUT_ORDER.filter((o) => stock.outputs.includes(o));

  return (
    <ConfiguratorLayout
      gallery={
        // Remounted when the strip's contents swap, which restarts it from
        // the first photo without gliding across unrelated ones.
        <ConfiguratorGallery
          key={`${size}/${sheetSize}`}
          slides={slides}
          label="Product photos"
          noun="Photo"
        />
      }
      // Type + format, dash-separated. Format uses its display label
      // (DISPOSABLE, not the full data value); SHEET appends its sheet size
      // directly — "SHEET 4X5", no extra separator.
      title={`${stock.name} - ${
        size === "SHEET" && sheetSize ? `${size} ${sheetSize}` : SIZE_LABELS[size] ?? size
      }`}
      blurb={stock.blurb}
      rows={(explain) => (
        <>
          <OptionRow label="Format" explain={explain}>
            <FormatThumbs
              values={stock.sizes}
              selected={size}
              onSelect={setSizeSel}
              image={(v) => stock.sizeImages?.[v]}
              label={(v) => SIZE_LABELS[v] ?? v}
            />
          </OptionRow>

          <OptionRow label="Output" explain={explain}>
            <Pills
              values={outputValues}
              selected={output}
              onSelect={setOutput}
              format={(v) => OUTPUT_LABELS[v] ?? v}
            />
          </OptionRow>

          {scansSelected && (
            <OptionRow label="Scan Type" explain={explain}>
              <Pills
                values={SCAN_TYPE_ORDER}
                selected={scanTypeSel}
                onSelect={setScanTypeSel}
                format={(v) => SCAN_TYPE_LABELS[v] ?? v}
              />
            </OptionRow>
          )}

          {expOptions.length > 0 && (
            <OptionRow label="Exposure" explain={explain}>
              <Pills values={expOptions} selected={exp} onSelect={setExpSel} />
            </OptionRow>
          )}

          {sheetSizeOptions.length > 0 && (
            <OptionRow label="Sheet Size" explain={explain}>
              <Pills
                values={sheetSizeOptions}
                selected={sheetSize}
                onSelect={setSheetSizeSel}
              />
            </OptionRow>
          )}
        </>
      )}
      // Push/pull is offered on every format and output — it's a choice about
      // the chemistry, so a develop-only sheet of 4x5 can still ask for it.
      // Half frame is 35mm only, and only where something is being scanned,
      // since the choice it offers is between two ways of scanning.
      extras={
        <div className={styles.more}>
          <button
            type="button"
            className={styles.moreToggle}
            onClick={() => setMoreOpen((v) => !v)}
            aria-expanded={moreOpen}
            aria-controls="more-options"
          >
            {moreOpen ? "Show Less Options ↑" : "Show More Options ↓"}
          </button>

          {moreOpen && (
            <div className={styles.moreRows} id="more-options">
              {halfFrameOffered && (
                <CheckRow
                  label="Half Frame Camera"
                  checked={halfFrameSel !== null}
                  // Individual scans on switch-on: it's what a half-frame
                  // shooter is usually after, and the state drawn as selected
                  // in the design.
                  onChange={(on) => setHalfFrameSel(on ? "INDIVIDUAL" : null)}
                >
                  <CaptionPills
                    values={HALF_FRAME_ORDER}
                    selected={halfFrameSel}
                    onSelect={setHalfFrameSel}
                    label={(v) => HALF_FRAME_LABELS[v] ?? v}
                    // Captions quote the real number for the roll in front of
                    // them — 72 on a 36, 48 on a 24 — rather than a fixed "up
                    // to 72" that would be wrong on half the rolls sold.
                    caption={(v) =>
                      HALF_FRAME_CAPTIONS[v]?.(
                        billedFrames(parseInt(exp ?? "36", 10), size, output, v)
                      ) ?? ""
                    }
                    glyphCount={(v) => (v === "PAIRED" ? 2 : 1)}
                  />
                </CheckRow>
              )}

              <CheckRow label="Pull / Push" checked={pushPullOn} onChange={setPushPullOn}>
                <Stepper
                  value={pushPullSel}
                  min={PUSH_PULL_MIN}
                  max={PUSH_PULL_MAX}
                  // Functional update against the delta, so a fast double-tap
                  // moves two stops rather than resolving both clicks against
                  // the same starting value.
                  onStep={(d) => setPushPullSel((v) => clampPushPull(v + d))}
                  label="Stops of push or pull"
                  // Signed, so +1 and −1 can't be misread as the same
                  // instruction at a glance. Shared with the cart's stepper.
                  format={pushPullShort}
                />
              </CheckRow>
            </div>
          )}
        </div>
      }
      breakdown={breakdown}
      notice="Final price will be calculated when film is finished developing and scanning."
      infoCopy={FILM_INFO_COPY}
      family={slug}
      itemNoun="Roll"
      // Always one roll: a second identical roll is another click, and the
      // cart's stepper is where a quantity gets raised after the fact. Every
      // field is already resolved against what this combination offers, so a
      // roll can't be stored asking for a half-frame scan of a sheet of 4x5.
      onAdd={() => ({
        line: {
          kind: "film",
          slug,
          size,
          output,
          exp,
          sheetSize,
          scanType,
          pushPull,
          halfFrame,
          qty: 1,
        },
        image: productShot,
      })}
    />
  );
}
