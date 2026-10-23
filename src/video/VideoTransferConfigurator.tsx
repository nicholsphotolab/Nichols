// VideoTransferConfigurator.tsx
// Interactive price estimator for video & audio transfers, rendered by
// VideoCategoryPage for /video/:category. Picking a format (or reel size) and
// an output medium recomputes an itemized estimate; "Add to order" snapshots
// the selection into the same cart the film configurator writes to.
//
// The page frame — gallery column, header, estimate, add button, toast,
// explainer modal, cross-sell — is ConfiguratorLayout, shared with film. The
// gallery leads with the format's PRODUCT SHOT slot (or a solid placeholder
// while that photography doesn't exist), then silent sample clips of digitized
// footage that autoplay muted like moving photographs; their poster frames
// double as the thumbnails. The output is billed once per order (one USB holds
// the whole transfer) — see videoPricing.ts.

import { useEffect, useState } from "react";
import { FormatThumbs, Pills } from "@/components/configurator/ConfiguratorControls";
import ConfiguratorGallery, {
  type GallerySlide,
} from "@/components/configurator/ConfiguratorGallery";
import ConfiguratorLayout, { OptionRow } from "@/components/configurator/ConfiguratorLayout";
import { withBasePath } from "@/lib/basePath";
import { buildQuery, matchOption, slugifyOption } from "@/lib/urlState";
import { videoEstimate, videoOptionTitle } from "./videoPricing";
import { CATEGORIES_BY_SLUG, OUTPUTS } from "./videoTransferData";

// USB is the recommended output, so it starts selected.
const RECOMMENDED_OUTPUT = OUTPUTS.find((o) => o.recommended) ?? OUTPUTS[0];

export default function VideoTransferConfigurator({ slug }: { slug: string }) {
  const category = CATEGORIES_BY_SLUG[slug];
  const optionNames = category.options.map((o) => o.name);

  // Raw selections; anything this category doesn't offer is corrected by
  // deriving an effective value at render time (below) rather than writing
  // state back — the same pure-render pattern the film configurator uses.
  const [optionSel, setOptionSel] = useState<string>(optionNames[0]);
  const [output, setOutput] = useState<string>(RECOMMENDED_OUTPUT.name);

  // Restore customization from the URL once on mount (?format=…&output=…).
  // The page is statically pre-rendered with defaults, so the query is applied
  // after hydration. Unknown values are ignored. Declared before the URL-sync
  // effect so the query is captured before the first rewrite.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const format = matchOption(params.get("format"), optionNames);
    if (format) setOptionSel(format);
    const out = matchOption(
      params.get("output"),
      OUTPUTS.map((o) => o.name)
    );
    if (out) setOutput(out);
    // Mount-only: the URL is an input here, not a subscription.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const option = optionNames.includes(optionSel) ? optionSel : optionNames[0];
  const selected = category.options.find((o) => o.name === option);

  // Mirror the visible selection into the URL: path = category, query = the
  // customization with defaults omitted. replaceState rewrites the current
  // history entry — Back always exits, it never un-clicks selections.
  useEffect(() => {
    const query = buildQuery({
      format: option !== optionNames[0] ? slugifyOption(option) : null,
      output: output !== RECOMMENDED_OUTPUT.name ? slugifyOption(output) : null,
    });
    window.history.replaceState(null, "", withBasePath(`/video/${slug}`) + query);
    // optionNames is derived from slug, which is listed.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug, option, output]);

  const slides: GallerySlide[] = [
    { kind: "image", src: selected?.image ?? null },
    ...(selected?.media ?? []).map(
      (m): GallerySlide => ({ kind: "clip", video: m.video, poster: m.poster })
    ),
  ];

  // "Size" for reels, "Format" for tapes & discs — drives the row label and
  // its explainer.
  const formatLabel = category.selectorLabel === "SIZE" ? "Size" : "Format";

  return (
    <ConfiguratorLayout
      gallery={
        // Remounted when the format changes, which restarts the strip from
        // the first slide without gliding across unrelated clips.
        <ConfiguratorGallery
          key={option}
          slides={slides}
          label="Sample clips"
          noun="Sample"
        />
      }
      // Just the selected format's name ("VHS", "Reel 3 in."), tracking the
      // selection live — the route already says which category you're in.
      title={videoOptionTitle(category, option)}
      blurb={category.description}
      rows={(explain) => (
        <>
          <OptionRow label={formatLabel} explain={explain}>
            <FormatThumbs
              values={optionNames}
              selected={option}
              onSelect={setOptionSel}
              image={(v) => category.options.find((o) => o.name === v)?.image}
              label={(v) => v}
            />
          </OptionRow>

          <OptionRow label="Output" explain={explain}>
            <Pills
              values={OUTPUTS.map((o) => o.name)}
              selected={output}
              onSelect={setOutput}
              format={(name) => {
                const out = OUTPUTS.find((o) => o.name === name)!;
                return `${out.name} · $${out.price}`;
              }}
            />
          </OptionRow>
        </>
      )}
      breakdown={videoEstimate(category, option, output)}
      notice="Final price is confirmed when your order is dropped off."
      family={slug}
      itemNoun="Item"
      onAdd={() => ({
        line: { kind: "video", slug, option, output, qty: 1 },
        image: selected?.image ?? null,
      })}
    />
  );
}
