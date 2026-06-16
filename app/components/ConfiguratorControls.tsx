// ConfiguratorControls.tsx
// Shared building blocks for the configurator pages (film stocks and video
// transfers): labeled option rows, pill toggle groups, and the quantity
// stepper. Extracted from FilmStockConfigurator so both configurators share
// one implementation and visual treatment.

"use client";

import styles from "./ConfiguratorControls.module.css";

// A labeled option row with a horizontal rule beneath it.
export function Row({
  label,
  explanation,
  children,
}: {
  label: string;
  explanation?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={styles.row}>
      <div className={styles.rowLine}>
        <span className={styles.rowLabel}>{label}</span>
        <div className={styles.rowOptions}>{children}</div>
      </div>
      {explanation && <p className={styles.rowExplain}>{explanation}</p>}
      <hr className={styles.rowDivider} />
    </div>
  );
}

// Renders a set of toggle buttons. Active pill gets the red background.
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

// Quantity stepper — minimum 1, no maximum.
export function QtyStepper({
  qty,
  onChange,
}: {
  qty: number;
  onChange: (qty: number) => void;
}) {
  return (
    <div className={styles.qtyRow}>
      <button
        className={styles.qtyBtn}
        aria-label="Decrease quantity"
        onClick={() => onChange(Math.max(1, qty - 1))}
        disabled={qty <= 1}
      >
        −
      </button>
      <span className={styles.qtyValue} aria-live="polite">
        {qty}
      </span>
      <button
        className={styles.qtyBtn}
        aria-label="Increase quantity"
        onClick={() => onChange(qty + 1)}
      >
        +
      </button>
    </div>
  );
}
