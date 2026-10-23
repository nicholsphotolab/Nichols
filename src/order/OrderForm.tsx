// OrderForm.tsx
// The printable order sheet generated from the running order — film rolls,
// video transfers, or both. On screen it is a dialog over the page; on paper
// it is the only thing that prints.
//
// Reads every line through order/orderPricing and knows nothing
// product-specific.
//
// How the print isolation works: the sheet renders through a portal so it sits
// as a direct child of <body>, marked [data-print-root], and while it is open
// it stamps `data-order-sheet="open"` on <body>. The @media print rules in
// globals.css use that pair to hide every other top-level element — the nav,
// the hero logo, the configurator, the footer, all of which come from the root
// layout and are therefore out of this component's reach. window.print() then
// produces the sheet alone. No PDF pipeline: the browser's own print dialog
// does the work, and the customer can "Save as PDF" from there if they want a
// file.
//
// Form fields are plain inputs on purpose. Filled in, they print what was
// typed; left blank, they print as ruled lines the customer can complete by
// hand at the counter — which is how an in-store drop-off usually goes.
//
// No payment is taken anywhere on this page; the sheet says so, and says where
// payment actually happens, so nobody arrives expecting a paid receipt.


import { Fragment, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Pills } from "@/components/configurator/ConfiguratorControls";
import { CONTACT } from "@/lib/site";
import type { OrderLine } from "./orderDraft";
import {
  formatUSD,
  orderExtraCharges,
  orderItemCount,
  orderTotal,
  summarizeLine,
} from "./orderPricing";
import styles from "./OrderForm.module.css";
import { useModalFocus } from "@/lib/useModalFocus";

/** Drop-off needs no shipping details; mail-in needs a return address. */
type Variant = "DROP-OFF" | "MAIL-IN";

const VARIANTS: Variant[] = ["DROP-OFF", "MAIL-IN"];
const VARIANT_LABELS: Record<Variant, string> = {
  "DROP-OFF": "IN-STORE DROP-OFF",
  "MAIL-IN": "MAIL-IN",
};

// Plain-language note about money, per variant. Nothing on this page charges
// anyone, so both variants say when payment is actually collected.
const PAYMENT_NOTE: Record<Variant, string> = {
  "DROP-OFF":
    "No payment is collected on this page. Bring this sheet with your film — we'll confirm the final price when your order is ready and take payment at the counter.",
  "MAIL-IN":
    "No payment is collected on this page. Include this sheet in the package with your film. Once your order is processed we'll email an itemized invoice and take payment before your originals and files are returned.",
};

/**
 * Human-readable reference: NPL-YYMMDD-NNNN, where the trailing digits come
 * from the timestamp. Not a guarantee of uniqueness — it's a handle for a
 * phone call ("order NPL-260803-4821"), not a database key.
 */
function makeReference(now: Date): string {
  const yy = String(now.getFullYear()).slice(2);
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const dd = String(now.getDate()).padStart(2, "0");
  const seq = String(now.getTime() % 10000).padStart(4, "0");
  return `NPL-${yy}${mm}${dd}-${seq}`;
}

export default function OrderForm({
  lines,
  onClose,
  onPrinted,
}: {
  lines: OrderLine[];
  onClose: () => void;
  /** Fired once the print dialog has been opened, so the caller can drop the
   *  saved draft — the order has left the "still deciding" state. */
  onPrinted: () => void;
}) {
  const [variant, setVariant] = useState<Variant>("DROP-OFF");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");

  // Stamped once when the sheet opens, not per render, so the reference and
  // date on screen are the ones that print. This component only ever mounts
  // from a click, so there is no server render to disagree with.
  const [issued] = useState(() => new Date());
  const [reference] = useState(() => makeReference(issued));

  const sheetRef = useRef<HTMLDivElement>(null);

  // Mark <body> for the duration: globals.css keys both the scroll lock and
  // the print isolation off this attribute. Cleaned up on close so a later
  // Cmd-P prints the page normally.
  useEffect(() => {
    document.body.dataset.orderSheet = "open";
    return () => {
      delete document.body.dataset.orderSheet;
    };
  }, []);

  // Escape, focus into the sheet, the page behind made unreachable, and focus
  // back on the cart's print button when it closes.
  useModalFocus({ active: true, containerRef: sheetRef, onEscape: onClose });

  const total = orderTotal(lines);
  // Items, not rows: two identical 35mm C-41s are one line at qty 2, and the
  // counter needs to know how many things to expect in the bag.
  const items = orderItemCount(lines);
  // Charges that belong to the order rather than any one line — currently the
  // video output medium, billed once however many tapes are in the order.
  const extras = orderExtraCharges(lines);
  // Name the sheet after what's actually on it — the counter sorts film and
  // transfers differently, and a mixed order should say so rather than pick.
  const kinds = new Set(lines.map((l) => l.kind));
  const docTitle =
    kinds.size !== 1
      ? "Order"
      : kinds.has("film")
        ? "Film order"
        : "Transfer order";
  const issuedDate = issued.toLocaleDateString(undefined, {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  function handlePrint() {
    // Clear the saved draft first: the customer has committed to this order,
    // so it shouldn't be waiting for them on their next visit. The list stays
    // on screen in this session in case they need a second copy.
    onPrinted();
    window.print();
  }

  return createPortal(
    <div className={styles.overlay} data-print-root>
      <div
        className={styles.sheet}
        ref={sheetRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-label="Printable order form"
      >
        {/* Controls that shape the sheet but shouldn't appear on paper. */}
        <div className={styles.controls} data-no-print>
          <span className={styles.controlsLabel}>Order type</span>
          <Pills
            values={VARIANTS}
            selected={variant}
            onSelect={setVariant}
            format={(v) => VARIANT_LABELS[v]}
          />
        </div>

        <header className={styles.sheetHead}>
          <div>
            <p className={styles.lab}>Nichols Photo Lab</p>
            <p className={styles.labMeta}>
              {CONTACT.addressLine1} · {CONTACT.addressLine2} ·{" "}
              {CONTACT.phoneDisplay}
            </p>
          </div>
          <div className={styles.refBlock}>
            <p className={styles.docType}>
              {docTitle} — {VARIANT_LABELS[variant]}
            </p>
            <p className={styles.ref}>{reference}</p>
            <p className={styles.issued}>{issuedDate}</p>
          </div>
        </header>

        <hr className={styles.rule} />

        <div className={styles.fields}>
          <label className={styles.field}>
            <span className={styles.fieldLabel}>Name</span>
            <input
              className={styles.input}
              type="text"
              autoComplete="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </label>

          <label className={styles.field}>
            <span className={styles.fieldLabel}>Phone</span>
            <input
              className={styles.input}
              type="tel"
              autoComplete="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          </label>

          <label className={styles.field}>
            <span className={styles.fieldLabel}>Email</span>
            <input
              className={styles.input}
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </label>

          {/* Mail-in only: we need somewhere to send the originals back. */}
          {variant === "MAIL-IN" && (
            <label className={`${styles.field} ${styles.fieldWide}`}>
              <span className={styles.fieldLabel}>Return address</span>
              <textarea
                className={`${styles.input} ${styles.textarea}`}
                rows={3}
                autoComplete="street-address"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
              />
            </label>
          )}
        </div>

        <hr className={styles.rule} />

        <table className={styles.table}>
          <caption className={styles.caption}>
            {items} {items === 1 ? "item" : "items"}
          </caption>
          <thead>
            <tr>
              <th scope="col" className={styles.thNum}>
                #
              </th>
              <th scope="col">Item</th>
              <th scope="col">Details</th>
              <th scope="col" className={styles.thNum}>
                Qty
              </th>
              <th scope="col" className={styles.thPrice}>
                Est. price
              </th>
            </tr>
          </thead>
          <tbody>
            {lines.map((line, i) => {
              const summary = summarizeLine(line);
              if (!summary) return null;
              return (
                <tr key={line.id}>
                  <td className={styles.tdNum}>{i + 1}</td>
                  <td>{summary.title}</td>
                  {/* The extras ride under the options rather than in their own
                      column: most rows have none, and a fifth column sized for
                      them would squeeze the four that are on every row.

                      One per line, each bolded — these change what the lab does
                      to the roll ("Push +1"), so the counter has to be able to
                      pick them out of the row at a glance rather than parse a
                      run-on list. */}
                  <td>
                    {summary.details || "—"}
                    {summary.custom.map((entry) => (
                      <Fragment key={entry}>
                        <br />
                        <strong>{entry}</strong>
                      </Fragment>
                    ))}
                  </td>
                  <td className={styles.tdNum}>{summary.qty}</td>
                  <td className={styles.tdPrice}>
                    {formatUSD(summary.lineTotal)}
                  </td>
                </tr>
              );
            })}
            {/* Order-level charges sit in the body so the column of prices
                above the total still adds up on paper. */}
            {extras.map((extra) => (
              <tr key={extra.name}>
                <td className={styles.tdNum} />
                <td>{extra.name}</td>
                <td>{extra.sub ?? "—"}</td>
                <td className={styles.tdNum}>1</td>
                <td className={styles.tdPrice}>{formatUSD(extra.amount)}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr>
              <td className={styles.totalCell} colSpan={4}>
                Estimated total
              </td>
              <td className={`${styles.tdPrice} ${styles.totalCell}`}>
                {formatUSD(total)}
              </td>
            </tr>
          </tfoot>
        </table>

        <p className={styles.estimateNote}>
          Prices are estimates. The final price is confirmed once your film is
          developed and scanned.
        </p>

        <hr className={styles.rule} />

        <p className={styles.paymentNote}>{PAYMENT_NOTE[variant]}</p>

        <div className={styles.staffBlock}>
          <span className={styles.staffLabel}>Lab use only</span>
          <div className={styles.staffLines}>
            <span className={styles.staffLine}>Received by</span>
            <span className={styles.staffLine}>Date in</span>
            <span className={styles.staffLine}>Promised</span>
          </div>
        </div>

        <div className={styles.actions} data-no-print>
          <button type="button" className={styles.primary} onClick={handlePrint}>
            Print order form
          </button>
          <button type="button" className={styles.ghost} onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
