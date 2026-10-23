// ConfiguratorLayout.tsx
// The page frame both configurators (film stocks, video transfers) share, so
// each product file only has to say what's different about it: its gallery
// slides, its option rows, and how it prices and stores a line.
//
// Layout mirrors the Figma "Desktop - 54" design: gallery on the left; on the
// right a title + blurb, hairline-separated option rows, optional extras, an
// itemized ESTIMATED TOTAL, and the add button carrying the running total.
// Below the panel, the cross-sell row.
//
// Adding snapshots the current selection into the order (OrderProvider) and
// leaves the configurator exactly as it is. The commonest next action is
// another of what was just added, so holding the selection makes that a single
// click — and an automatic reset reads as the page having lost the customer's
// work. The cart drawer deliberately does NOT pop open: a counter workflow is
// several items in a row, and a panel over the page after each one would be in
// the way. The nav badge and the AddedToOrder toast carry the feedback instead.

import { useState, type ReactNode } from "react";
import AddedToOrder from "@/order/AddedToOrder";
import { useOrder } from "@/order/OrderProvider";
import type { NewOrderLine } from "@/order/orderDraft";
import { formatUSD, summarizeLine, type LineItem } from "@/order/orderPricing";
import { InfoModal, RowLabel } from "./ConfiguratorControls";
import MoreProducts from "./MoreProducts";
import styles from "./Configurator.module.css";

/** One option row: its label (with the ↗ explainer) over its control. */
export function OptionRow({
  label,
  explain,
  children,
}: {
  label: string;
  /** The `explain` ConfiguratorLayout hands to `rows`. */
  explain: (label: string) => void;
  children: ReactNode;
}) {
  return (
    <div className={styles.row}>
      <RowLabel label={label} onExplain={explain} />
      {children}
    </div>
  );
}

export default function ConfiguratorLayout({
  gallery,
  title,
  blurb,
  rows,
  extras,
  breakdown,
  notice,
  infoCopy,
  family,
  itemNoun,
  onAdd,
}: {
  /** A ConfiguratorGallery. */
  gallery: ReactNode;
  title: string;
  blurb: string;
  /**
   * The option rows. Called with `explain`, which each RowLabel's ↗ uses to
   * open the explainer modal for its row.
   */
  rows: (explain: (label: string) => void) => ReactNode;
  /** Optional block between the option rows and the estimate (film's extras). */
  extras?: ReactNode;
  breakdown: LineItem[];
  /** Red caveat under the ESTIMATED TOTAL heading. */
  notice: string;
  /** Explainer copy keyed by row label. */
  infoCopy?: Record<string, string>;
  /** Film stock or video category slug — seeds the cross-sell row. */
  family: string;
  /** Fallback name for the added item in the confirmation — "Roll", "Item". */
  itemNoun: string;
  /** The line to add, already resolved, and the product shot to show for it. */
  onAdd: () => { line: NewOrderLine; image: string | null };
}) {
  // Which row's explainer is open, by row label. Null closes the modal.
  const [infoRow, setInfoRow] = useState<string | null>(null);

  const { addLine, count, openCart } = useOrder();

  // Confirmation after an add. No timer here: AddedToOrder owns the toast's
  // whole visible lifecycle, since dismissal has to answer to the pointer (it
  // holds while hovered) and only the toast knows where the pointer is. A new
  // note — always a new string, since it carries the running item count — is
  // what raises the next toast. The shot is held separately so the toast keeps
  // showing what was added after the customer starts configuring the next one.
  const [addedNote, setAddedNote] = useState<string | null>(null);
  const [addedShot, setAddedShot] = useState<string | null>(null);

  function add() {
    const { line, image } = onAdd();
    const summary = summarizeLine(addLine(line));
    const next = count + 1;
    setAddedNote(
      `${summary?.text ?? itemNoun} added — ${next} ${
        next === 1 ? "item" : "items"
      } in your order.`
    );
    setAddedShot(image);
  }

  const total = breakdown.reduce((sum, item) => sum + item.amount, 0);

  return (
    <main id="main" tabIndex={-1} className={styles.page}>
      <div className={styles.layout}>
        {gallery}

        <div className={styles.body}>
          <header className={styles.header}>
            <h1 className={styles.title}>{title}</h1>
            <p className={styles.blurb}>{blurb}</p>
          </header>

          <hr className={styles.divider} />

          <div className={styles.rows}>{rows(setInfoRow)}</div>

          <hr className={styles.divider} />

          {extras && (
            <>
              {extras}
              <hr className={styles.divider} />
            </>
          )}

          {/* Itemized estimate */}
          <div className={styles.total}>
            <div className={styles.totalHead}>
              <span className={styles.totalLabel}>Estimated total</span>
              <p className={styles.noticeText}>{notice}</p>
            </div>
            <div className={styles.breakdown}>
              {breakdown.map((item) => (
                <div className={styles.lineItem} key={item.name}>
                  <span className={styles.lineLabel}>
                    <span className={styles.lineName}>{item.name}</span>
                    {item.sub && <span className={styles.lineSub}>{item.sub}</span>}
                  </span>
                  <span className={styles.lineAmount}>{formatUSD(item.amount)}</span>
                </div>
              ))}
            </div>
          </div>

          <hr className={styles.divider} />

          {/* The total lives in the button — one place to read the number
              rather than two that have to agree. */}
          <div className={styles.addBlock}>
            <button type="button" className={styles.addBtn} onClick={add}>
              Add to order -{" "}
              <span className={styles.addPrice} aria-live="polite">
                {formatUSD(total)}
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Outside .addBlock, which is sticky on phones. Sticky positioning
          always opens a stacking context, and the toast is a fixed element at
          z-index 15 chosen to clear the nav (9) and duck under the cart drawer
          (20/21) — sealed inside .addBlock those numbers would only be compared
          against each other, and the toast would slide under the nav. */}
      <AddedToOrder note={addedNote} image={addedShot} onViewCart={openCart} />

      <InfoModal label={infoRow} onClose={() => setInfoRow(null)} copy={infoCopy} />

      {/* Cross-sell: leads with a service they aren't already looking at, and
          is the way to reach the other stocks/categories. */}
      <MoreProducts family={family} />
    </main>
  );
}
