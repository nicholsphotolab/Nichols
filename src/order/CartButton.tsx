// CartButton.tsx
// The cart control at the right end of the nav bar. Opens the cart drawer. The
// count is quantities summed, not lines — two of the same roll reads as 2.
//
// One chip in two colourways, picked by what is behind the bar: paper-white over
// a hero image (Figma node 2679:1664), black once the solid paper-white bar
// snaps in (node 2679:1712). Each colourway has its own hover — the first fills,
// the second thickens its rule and bolds its label.
//
// The swap runs off the html[data-nav-scrolled] attribute NavBar.tsx maintains,
// plus html[data-menu-open]. `solid` comes in as a prop as well: the pages that
// pin the solid bar from the top would otherwise paint a paper-white chip on a
// paper-white bar for the frame before NavBar's effect had run.


import { useOrder } from "./OrderProvider";
import styles from "./CartButton.module.css";

export default function CartButton({ solid = false }: { solid?: boolean }) {
  const { count, openCart } = useOrder();

  return (
    <button
      type="button"
      className={styles.cart}
      data-solid={solid ? "true" : undefined}
      onClick={openCart}
      aria-haspopup="dialog"
      aria-label={
        count === 0
          ? "Your order, empty"
          : `Your order, ${count} ${count === 1 ? "item" : "items"}`
      }
    >
      {/* The label carries no accessible text of its own — the button's
          aria-label already states the count, and announcing it twice is worse
          than not announcing it here. */}
      {/* The chip is a fixed width per digit count rather than one that hugs its
          label — see the CSS. Capped at 3 because that is where the space
          reserved in the bar runs out; a four-figure order would keep the
          three-digit box and let the label run a little tighter inside it. */}
      <span
        className={styles.chip}
        data-digits={Math.min(String(count).length, 3)}
        aria-hidden="true"
      >
        cart ({count})
      </span>
    </button>
  );
}
