// ConfiguratorControls.tsx
// The option controls shared by the configurator pages (film stocks and video
// transfers): the pill toggle group, the format thumbnail picker, the row label
// with its explainer link, the explainer modal itself, and the note field.
//
// Both configurators had grown their own RowLabel with a tooltip. Those are
// gone: the info icon is now a diagonal arrow that opens a modal, and one
// implementation serves both pages rather than two that drift.


import { useEffect, useRef } from "react";
import Image from "@/components/Image";
import { withBasePath } from "@/lib/basePath";
import styles from "./ConfiguratorControls.module.css";
import { useModalFocus } from "@/lib/useModalFocus";

// Renders a set of toggle buttons. The active pill fills solid black; the rest
// sit in bw-600 and darken to black on hover.
// `format` optionally maps a value to its display label (e.g. to append
// a price) without changing the selection value itself.
export function Pills<T extends string>({
  values,
  selected,
  onSelect,
  format,
}: {
  values: T[];
  selected: T | null;
  onSelect: (v: T) => void;
  format?: (v: T) => string;
}) {
  return (
    <div className={styles.pills}>
      {values.map((v) => {
        const isActive = v === selected;
        return (
          <button
            key={v}
            type="button"
            className={styles.pill}
            data-active={isActive || undefined}
            onClick={() => onSelect(v)}
          >
            {format ? format(v) : v}
          </button>
        );
      })}
    </div>
  );
}

/**
 * The FORMAT row: a strip of 80px thumbnails, one per format, selected one
 * ringed in black.
 *
 * `image` resolves a value to its product shot. Formats without one render an
 * empty bw-200 block — the design shows three of those, since not every stock
 * has been shot in every format yet.
 *
 * The visible caption is deliberate rather than decorative: at 80px a 110
 * cartridge and a 120 roll are close to indistinguishable, and a format with no
 * shot at all is an unlabelled grey square. Each button also carries the format
 * name as its accessible name, so the caption can be dropped without stranding
 * screen-reader users.
 */
export function FormatThumbs<T extends string>({
  values,
  selected,
  onSelect,
  image,
  label,
}: {
  values: T[];
  selected: T | null;
  onSelect: (v: T) => void;
  image: (v: T) => string | null | undefined;
  label: (v: T) => string;
}) {
  return (
    <div className={styles.thumbs}>
      {values.map((v) => {
        const src = image(v);
        const text = label(v);
        return (
          <button
            key={v}
            type="button"
            className={styles.thumb}
            data-active={v === selected || undefined}
            onClick={() => onSelect(v)}
            aria-pressed={v === selected}
            aria-label={text}
          >
            <span className={styles.thumbFrame}>
              {src ? (
                <Image
                  src={withBasePath(src)}
                  alt=""
                  fill
                  sizes="80px"
                  className={styles.thumbImg}
                />
              ) : null}
            </span>
            <span className={styles.thumbLabel} aria-hidden="true">
              {text}
            </span>
          </button>
        );
      })}
    </div>
  );
}

/**
 * A checkbox-fronted row heading: a small square that fills darkroom-red when
 * on, then the label.
 *
 * A real <input type="checkbox"> under a styled box rather than a <button
 * aria-pressed>: these gate whether a whole block of options exists, which is
 * what a checkbox means, and it gets the native label association, the space
 * key, and form-control semantics for free.
 */
export function CheckRow({
  label,
  checked,
  onChange,
  children,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  children?: React.ReactNode;
}) {
  return (
    <div className={styles.checkRow}>
      <label className={styles.checkLabel}>
        <input
          type="checkbox"
          className={styles.checkInput}
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
        />
        <span className={styles.checkBox} aria-hidden="true" />
        {label}
      </label>
      {/* Only mounted when on, so the controls inside can't be tabbed into
          while the row that explains them is switched off. */}
      {checked ? children : null}
    </div>
  );
}

/**
 * A − / value / + stepper over a closed integer range.
 *
 * The ends disable rather than wrap: this counts stops of push and pull, where
 * wrapping from +3 to −2 would silently invert the instruction.
 *
 * Reports a DELTA, not the new value, and leaves the caller to apply it
 * functionally. Computing `value + 1` here reads the value this render closed
 * over, so two clicks landing in one batch both resolve against the same
 * starting number and the second one is lost — an impatient double-tap on +
 * moves one stop, not two.
 */
export function Stepper({
  value,
  min,
  max,
  onStep,
  format,
  label,
}: {
  value: number;
  min: number;
  max: number;
  /** Called with −1 or +1; the caller clamps and applies it. */
  onStep: (delta: number) => void;
  /** Display form of the current value; defaults to the number itself. */
  format?: (v: number) => string;
  /** Accessible name, e.g. "Stops of push or pull". */
  label: string;
}) {
  return (
    <div className={styles.stepper} role="group" aria-label={label}>
      <button
        type="button"
        className={styles.stepperBtn}
        onClick={() => onStep(-1)}
        disabled={value <= min}
        aria-label="One stop less"
      >
        −
      </button>
      <span className={styles.stepperValue} aria-live="polite">
        {format ? format(value) : value}
      </span>
      <button
        type="button"
        className={styles.stepperBtn}
        onClick={() => onStep(1)}
        disabled={value >= max}
        aria-label="One stop more"
      >
        +
      </button>
    </div>
  );
}

/**
 * The frame glyph on the half-frame pills: one portrait box numbered 1, or two
 * side by side numbered 1 and 2.
 *
 * Worth drawing rather than labelling. A half frame is portrait and two of them
 * make up one landscape 35mm frame, so the glyph shows the actual difference
 * between the two choices — one image per half, or both halves in one scan —
 * faster than the caption under it can say it.
 */
function FrameGlyph({ count }: { count: number }) {
  return (
    <span className={styles.glyph} aria-hidden="true">
      {Array.from({ length: count }, (_, i) => (
        <span key={i} className={styles.glyphFrame}>
          {i + 1}
        </span>
      ))}
    </span>
  );
}

/**
 * Pills that carry a glyph and a caption — the half-frame scan choice.
 *
 * Separate from `Pills` rather than an option on it: every other pill row on
 * the site is a single word the customer already understands, and giving them
 * all an optional caption slot would invite explaining choices that don't need
 * it.
 */
export function CaptionPills<T extends string>({
  values,
  selected,
  onSelect,
  label,
  caption,
  glyphCount,
}: {
  values: T[];
  selected: T | null;
  onSelect: (v: T) => void;
  label: (v: T) => string;
  caption: (v: T) => string;
  glyphCount: (v: T) => number;
}) {
  return (
    <div className={styles.captionPills}>
      {values.map((v) => (
        <div key={v} className={styles.captionPillCol}>
          <button
            type="button"
            className={styles.captionPill}
            data-active={v === selected || undefined}
            onClick={() => onSelect(v)}
            aria-pressed={v === selected}
          >
            <FrameGlyph count={glyphCount(v)} />
            {label(v)}
          </button>
          <span className={styles.captionText}>{caption(v)}</span>
        </div>
      ))}
    </div>
  );
}

/**
 * A row's label plus the ↗ that opens its explainer.
 *
 * The arrow replaces the old hover tooltip. A tooltip could only ever hold a
 * sentence and was unreachable on touch; the modal it opens can hold as much as
 * the copy needs and works the same way on every device.
 */
export function RowLabel({
  label,
  onExplain,
}: {
  label: string;
  onExplain?: (label: string) => void;
}) {
  // Without an explainer there is nothing to click, so it stays plain text
  // rather than a button that does nothing.
  if (!onExplain) {
    return <span className={styles.rowLabel}>{label}</span>;
  }

  return (
    <button
      type="button"
      className={styles.rowLabel}
      data-explain="true"
      onClick={() => onExplain(label)}
      aria-label={`About ${label}`}
    >
      {label}{" "}
      <span className={styles.rowArrow} aria-hidden="true">
        ↗
      </span>
    </button>
  );
}

/**
 * The explainer modal. The shell, focus handling, and dismissal behaviour
 * live here; the body text is supplied per page via `copy` (keyed by the
 * same label passed to RowLabel) since "Output" means different things on
 * the film and video pages. A label with no entry in `copy` falls back to a
 * placeholder — video doesn't pass one yet.
 *
 * Rendered only when open so the escape listener and the body scroll lock come
 * and go with it.
 */
export function InfoModal({
  label,
  onClose,
  copy,
}: {
  label: string | null;
  onClose: () => void;
  copy?: Record<string, string>;
}) {
  const panelRef = useRef<HTMLDivElement | null>(null);

  // Escape, focus into the panel (so the close button is the next stop), the
  // page behind made unreachable, and focus back on the row's ↗ on close.
  useModalFocus({ active: !!label, containerRef: panelRef, onEscape: onClose });

  useEffect(() => {
    if (!label) return;
    const { overflow } = document.body.style;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = overflow;
    };
  }, [label]);

  if (!label) return null;

  return (
    <div
      className={styles.modalOverlay}
      onClick={onClose}
      role="presentation"
    >
      <div
        ref={panelRef}
        className={styles.modalPanel}
        role="dialog"
        aria-modal="true"
        aria-label={label}
        tabIndex={-1}
        // The overlay closes on click; the panel must not pass its own clicks up.
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          className={styles.modalClose}
          onClick={onClose}
          aria-label="Close"
        >
          <span aria-hidden="true">×</span>
        </button>
        <h2 className={styles.modalTitle}>{label}</h2>
        <p className={styles.modalBody}>
          {copy?.[label] ??
            `TODO — explain what ${label.toLowerCase()} means and how to choose.`}
        </p>
      </div>
    </div>
  );
}
