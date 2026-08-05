// CartButton.tsx
// The cart control at the right end of the nav bar. Shows an item count badge
// once the order has anything in it and opens the cart drawer. The count is
// quantities summed, not lines — two of the same roll reads as 2.
//
// Colour follows the nav's existing convention: paper-white over a dark hero,
// switching to black once the solid bar snaps in (driven by the
// html[data-nav-scrolled] attribute NavBar.tsx maintains).

"use client";

import { useOrder } from "./OrderProvider";
import styles from "./CartButton.module.css";

export default function CartButton() {
  const { count, openCart } = useOrder();

  return (
    <button
      type="button"
      className={styles.cart}
      onClick={openCart}
      aria-haspopup="dialog"
      aria-label={
        count === 0
          ? "Your order, empty"
          : `Your order, ${count} ${count === 1 ? "item" : "items"}`
      }
    >
      {/* Inline rather than a file in /public: it inherits currentColor for the
          scrolled/unscrolled swap, and skips a basePath round-trip. */}
      <svg
        className={styles.icon}
        viewBox="0 0 24 24"
        width="22"
        height="22"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="square"
        aria-hidden="true"
      >
        <path d="M3 5h2.2l2.3 10.5h10L20 8H6.2" />
        <circle cx="9.5" cy="19" r="1.4" fill="currentColor" stroke="none" />
        <circle cx="16.5" cy="19" r="1.4" fill="currentColor" stroke="none" />
      </svg>

      {/* The badge carries no accessible text of its own — the button's
          aria-label already states the count, and announcing it twice is worse
          than not announcing it here. */}
      {count > 0 && (
        <span className={styles.badge} aria-hidden="true">
          {count}
        </span>
      )}
    </button>
  );
}
