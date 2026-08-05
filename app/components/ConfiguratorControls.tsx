// ConfiguratorControls.tsx
// The pill toggle group shared by the configurator pages (film stocks and
// video transfers). Extracted from FilmStockConfigurator so both configurators
// share one implementation and visual treatment.
//
// This once also held a Row wrapper and a QtyStepper. Both were left behind by
// later work — the configurators each grew their own RowLabel with a tooltip
// (and their own .rowLabel styles), and the cart drawer has its own stepper —
// so they were removed rather than kept as a second, unused implementation.

"use client";

import styles from "./ConfiguratorControls.module.css";

// Renders a set of toggle buttons. The active pill fills solid black.
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
