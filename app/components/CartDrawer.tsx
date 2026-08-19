// CartDrawer.tsx
// The slide-out cart opened by the nav's CartButton. Mounted once in the root
// layout, so the order is reachable from any page rather than only from the
// film configurator that built it.
//
// Layout follows the Figma "Your order" frames (2480:1096 / 2486:1341 /
// 2486:1440): a heading row, then one block per item — product shot on the
// left, and on the right a title + price, rule-separated OUTPUT and EXPOSURE
// rows, and a quantity stepper beside Remove. Pinned to the bottom of the
// panel is the running estimate and the red CREATE ORDER FORM button.
//
// The three frames are the same cart in three states: resting, exposure being
// edited, and output being edited. "Edit" opens a swatch list in place and
// becomes "Close"; picking an option writes straight through to the order, so
// there is nothing to save or cancel. Only one list is open at a time — the
// panel is four columns wide, and two open lists push the stepper out of sight.
//
// Kept mounted at all times (hidden via transform + visibility rather than
// unmounted) so closing animates as well as opening, and so the panel's scroll
// position survives a close/reopen while the customer is still adding items.
//
// The printable order form opens from here; the drawer closes first so there's
// only ever one overlay, one scroll lock, and one Escape target on screen.

"use client";

import { Fragment, useEffect, useRef, useState } from "react";
import Image from "next/image";
import {
  formatUSD,
  orderTotal,
  summarizeLine,
  type LineRow,
} from "../lib/orderPricing";
import { withBasePath } from "../lib/basePath";
import OrderForm from "../film/OrderForm";
import { useOrder } from "./OrderProvider";
import styles from "./CartDrawer.module.css";

/** "August 3" — enough to jog a memory without a full timestamp. */
function formatDraftDate(savedAt: number): string {
  return new Date(savedAt).toLocaleDateString(undefined, {
    month: "long",
    day: "numeric",
  });
}

/** Which line's which row is expanded — at most one across the whole cart. */
type OpenEditor = { lineId: string; field: string };

/**
 * A row's choices as a − / value / + stepper instead of a list.
 *
 * Walks `row.choices` by index rather than doing arithmetic on the values: the
 * array is already the scale in order, so this stays a plain ordered-choice
 * control and can serve any row whose options are a range. The ends disable
 * rather than wrap — on push/pull, rolling from +3 round to −2 would invert the
 * instruction rather than clamp it.
 *
 * Deliberately smaller than the quantity stepper below it. Both are − / + pairs
 * on the same line item, and the quantity one is the primary control; matching
 * their weight would make the panel read as having two equal steppers that mean
 * completely different things.
 */
function RowStepper({
  row,
  onSelect,
}: {
  row: LineRow;
  onSelect: (value: string) => void;
}) {
  const found = row.choices.findIndex((c) => c.value === row.selected);
  const at = found < 0 ? 0 : found;
  const step = (delta: number) => {
    const next = row.choices[at + delta];
    if (next) onSelect(next.value);
  };

  return (
    <div className={styles.rowStepper} role="group" aria-label={row.label}>
      <button
        type="button"
        className={styles.rowStepBtn}
        onClick={() => step(-1)}
        disabled={at <= 0}
        aria-label={`Down one, ${row.label.toLowerCase()}`}
      >
        −
      </button>
      {/* The compact form where a row supplies one: the caption above already
          says PULL / PUSH, so the word between the buttons would only repeat
          it — the sign and the number are the parts that move. */}
      <span className={styles.rowStepValue} aria-live="polite">
        {row.choices[at]?.short ?? row.choices[at]?.label}
      </span>
      <button
        type="button"
        className={styles.rowStepBtn}
        onClick={() => step(1)}
        disabled={at >= row.choices.length - 1}
        aria-label={`Up one, ${row.label.toLowerCase()}`}
      >
        +
      </button>
    </div>
  );
}

/**
 * One labelled row inside a line: caption, current value, and an Edit link
 * that swaps for a swatch list of the alternatives.
 *
 * Rows come from the line's summary rather than from anything this file knows
 * — a roll's OUTPUT / EXPOSURE / SHEET SIZE and a transfer's OUTPUT all arrive
 * in the same shape. Fewer than two choices means the value isn't a decision
 * the customer gets to make (a disposable's 27 exposures are applied by the
 * pricing data), so the row renders its value with no link.
 */
function EditableRow({
  row,
  open,
  onToggle,
  onSelect,
}: {
  row: LineRow;
  open: boolean;
  onToggle: () => void;
  onSelect: (value: string) => void;
}) {
  const editable = row.choices.length > 1;

  return (
    <div className={styles.field}>
      <div className={styles.fieldHead}>
        <span className={styles.fieldLabel}>{row.label}</span>
        <div className={styles.fieldLine}>
          <span className={styles.fieldValue}>{row.value}</span>
          {editable && (
            <button
              type="button"
              className={styles.fieldToggle}
              onClick={onToggle}
              aria-expanded={open}
            >
              {open ? "Close" : "Edit"}
              <span className={styles.srOnly}> {row.label.toLowerCase()}</span>
            </button>
          )}
        </div>
      </div>

      {editable && open && row.control === "stepper" && (
        <RowStepper row={row} onSelect={onSelect} />
      )}

      {editable && open && row.control !== "stepper" && (
        <div className={styles.choices} role="radiogroup" aria-label={row.label}>
          {row.choices.map((choice) => (
            <button
              key={choice.value}
              type="button"
              role="radio"
              aria-checked={choice.value === row.selected}
              className={styles.choice}
              onClick={() => onSelect(choice.value)}
            >
              {/* The swatch is the whole selected/unselected signal in the
                  design — hence aria-checked above carrying it for anyone
                  who can't see the colour. */}
              <span className={styles.swatch} aria-hidden="true" />
              {choice.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default function CartDrawer() {
  const {
    lines,
    count,
    staleDraft,
    updateLine,
    removeLine,
    resumeDraft,
    discardDraft,
    forgetStoredDraft,
    cartOpen,
    closeCart,
  } = useOrder();

  const [formOpen, setFormOpen] = useState(false);
  const [openEditor, setOpenEditor] = useState<OpenEditor | null>(null);
  // Which line has its Details panel open, by line id. Deliberately NOT routed
  // through openEditor: that holds one open thing across the whole cart, so
  // opening a row's choice list from inside Details would take Details — and
  // the row you were aiming at — off the screen. They nest, so they need two
  // pieces of state. One line at a time, matching the row rule.
  const [openDetails, setOpenDetails] = useState<string | null>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  // Lock page scroll while the drawer is up. Set on both roots, matching
  // MobileMenu: html for modern browsers, body for older iOS Safari, which
  // historically ignored overflow on the root element for touch scrolling.
  useEffect(() => {
    if (!cartOpen) return;
    const prevHtml = document.documentElement.style.overflow;
    const prevBody = document.body.style.overflow;
    document.documentElement.style.overflow = "hidden";
    document.body.style.overflow = "hidden";
    return () => {
      document.documentElement.style.overflow = prevHtml;
      document.body.style.overflow = prevBody;
    };
  }, [cartOpen]);

  // Escape closes, matching the mobile menu and the order form. Skipped while
  // the order form is up so Escape dismisses the topmost surface, not both.
  useEffect(() => {
    if (!cartOpen || formOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeCart();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [cartOpen, formOpen, closeCart]);

  // Move focus into the panel on open so keyboard and screen-reader users land
  // in the drawer rather than being left behind it in the page.
  useEffect(() => {
    if (cartOpen) panelRef.current?.focus();
  }, [cartOpen]);

  // An open row shouldn't still be open the next time the cart is pulled up —
  // that state belongs to one editing session, not to the order.
  useEffect(() => {
    if (!cartOpen) {
      setOpenEditor(null);
      setOpenDetails(null);
    }
  }, [cartOpen]);

  // Closing Details takes any row editor inside it with it — otherwise the
  // editor stays "open" against a hidden row and reopening Details shows a
  // choice list the customer didn't ask for.
  function toggleDetails(lineId: string) {
    setOpenDetails((current) => {
      if (current === lineId) {
        setOpenEditor(null);
        return null;
      }
      return lineId;
    });
  }

  function toggleEditor(lineId: string, field: OpenEditor["field"]) {
    setOpenEditor((current) =>
      current && current.lineId === lineId && current.field === field
        ? null
        : { lineId, field }
    );
  }

  function isOpen(lineId: string, field: OpenEditor["field"]) {
    return openEditor?.lineId === lineId && openEditor.field === field;
  }

  return (
    <>
      {/* Inert until opened — see the visibility handling in the stylesheet. */}
      <div
        className={styles.scrim}
        data-open={cartOpen || undefined}
        onClick={closeCart}
        aria-hidden="true"
      />

      <div
        className={styles.panel}
        data-open={cartOpen || undefined}
        ref={panelRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-label="Your order"
        // Hidden from assistive tech while closed: the panel stays in the DOM
        // for the close animation, and a permanently reachable off-screen
        // dialog would otherwise be announced and tabbable on every page.
        aria-hidden={!cartOpen || undefined}
      >
        {/* Heading + list travel together as one block against the pinned
            footer below, which is what the design's space-between produces. */}
        <div className={styles.top}>
          <div className={styles.head}>
            <h2 className={styles.heading}>Your order ({count})</h2>
            <button type="button" className={styles.close} onClick={closeCart}>
              Close
            </button>
          </div>

          <div className={styles.body}>
            {staleDraft && (
              <div className={styles.resume}>
                <p className={styles.resumeText}>
                  Resume your order from {formatDraftDate(staleDraft.savedAt)}?{" "}
                  {staleDraft.lines.length}{" "}
                  {staleDraft.lines.length === 1 ? "item" : "items"} saved on
                  this device.
                </p>
                <div className={styles.resumeActions}>
                  <button
                    type="button"
                    className={styles.resumeBtn}
                    onClick={resumeDraft}
                  >
                    Resume
                  </button>
                  <button
                    type="button"
                    className={styles.resumeBtnGhost}
                    onClick={discardDraft}
                  >
                    Start fresh
                  </button>
                </div>
              </div>
            )}

            {lines.length === 0 && !staleDraft && (
              <div className={styles.empty}>
                <span className={styles.emptyTitle}>Nothing here yet.</span>
                <p className={styles.emptyText}>
                  Configure a roll on any film page, or a transfer on any video
                  page, and choose “Add to order” — it’ll show up here.
                </p>
              </div>
            )}

            {lines.length > 0 && (
              <ul className={styles.list}>
                {lines.map((line) => {
                  const summary = summarizeLine(line);
                  // An item whose stock, format, or transfer category is no
                  // longer offered (the pricing data changed since the draft
                  // was saved) is dropped rather than shown at a price we
                  // can't stand behind.
                  if (!summary) return null;

                  // A line with nothing to change gets no toggle rather than a
                  // Details link opening an empty panel.
                  // Unset extras are carried on `rows` but not shown — except
                  // the one whose editor is open, which is a row the customer
                  // just cleared and may want to put back.
                  const visibleRows = summary.rows.filter(
                    (row) => !row.unset || isOpen(line.id, row.field)
                  );
                  const hasDetails = visibleRows.length > 0;
                  const detailsOpen = openDetails === line.id;

                  return (
                    <li className={styles.item} key={line.id}>
                      {/* Decorative: the title beside it already names the
                          item, so an alt here would just repeat it. Empty
                          tile when the format has no product shot yet —
                          see LineSummary. */}
                      <span className={styles.shot} aria-hidden="true">
                        {summary.imageSrc && (
                          <Image
                            src={withBasePath(summary.imageSrc)}
                            alt=""
                            fill
                            sizes="160px"
                          />
                        )}
                      </span>

                      <div className={styles.itemBody}>
                        {/* Title and price on one line in matching weight, rule
                            beneath — the ORDER OVERVIEW header, so the drawer
                            and that page read as the same object seen twice. */}
                        {/* Details rides the title row, opposite the name, with
                            the price tucked under it. Sat directly above the
                            summary it read as a caption FOR that summary rather
                            than a control for something else — up here it has
                            nothing to be mistaken for. */}
                        <div className={styles.itemHead}>
                          <div className={styles.itemHeading}>
                            <h3 className={styles.itemTitle}>{summary.title}</h3>
                            <p className={styles.itemPrice}>
                              {formatUSD(summary.lineTotal)}
                            </p>
                          </div>
                          {hasDetails && (
                            <button
                              type="button"
                              className={styles.detailsToggle}
                              onClick={() => toggleDetails(line.id)}
                              aria-expanded={detailsOpen}
                              aria-label={`Details for ${summary.text}`}
                            >
                              Details {detailsOpen ? "↑" : "↓"}
                            </button>
                          )}
                        </div>

                        {/* Summary and rows are the same slot in two states,
                            never both at once. They say the same four things —
                            stacked, the summary just restated the rows it sat
                            above, and the eye had to work out which of the two
                            it was meant to read. Collapsed answers "what did I
                            order"; expanded answers "change it". */}
                        {!detailsOpen && (
                          <div className={styles.summary}>
                            <p>
                              {summary.details}
                              {/* A flag, not a control — it rides the end of the
                                  options line rather than taking one of its own,
                                  and what it stands for is spelled out among the
                                  rows under Details. Naming the extras here
                                  instead would run to three lines on a roll that
                                  asked for both, which is what this replaced. */}
                              {summary.custom.length > 0 && (
                                <span className={styles.summaryFlag}>
                                  {" · Custom"}
                                </span>
                              )}
                            </p>
                          </div>
                        )}

                        {/* One flat list. Push/pull and half frame arrive on
                            `rows` alongside output and exposure, already
                            filtered by summarizeFilmLine to the ones this roll
                            actually set — so a roll with a push and no half
                            frame gets exactly one extra row, not a control
                            offering choices it never made. */}
                        {detailsOpen &&
                          visibleRows.map((row, i) => (
                            <Fragment key={row.field}>
                              {i > 0 && <hr className={styles.rule} />}
                              <EditableRow
                                row={row}
                                open={isOpen(line.id, row.field)}
                                onToggle={() =>
                                  toggleEditor(line.id, row.field)
                                }
                                onSelect={(value) =>
                                  updateLine(line.id, row.patch(value))
                                }
                              />
                            </Fragment>
                          ))}

                        <hr className={styles.rule} />

                        {/* At quantity 1 the down-control becomes the delete:
                            there is exactly one destructive control on a line at
                            any time, and no dead disabled button in the state
                            most lines sit in. The glyph swaps to × so the change
                            in meaning is visible — someone tapping 3 → 1 in a
                            rhythm sees the button change under their finger
                            rather than discovering it by deleting the line. */}
                        <div className={styles.qtyRow}>
                          <div className={styles.stepper}>
                            <button
                              type="button"
                              className={styles.stepBtn}
                              data-destructive={summary.qty <= 1 || undefined}
                              onClick={() =>
                                summary.qty <= 1
                                  ? removeLine(line.id)
                                  : updateLine(line.id, { qty: summary.qty - 1 })
                              }
                              aria-label={
                                summary.qty <= 1
                                  ? `Remove ${summary.text} from your order`
                                  : `Fewer of ${summary.text}`
                              }
                            >
                              {summary.qty <= 1 ? "×" : "−"}
                            </button>
                            <span className={styles.stepValue} aria-live="polite">
                              {summary.qty}
                            </span>
                            <button
                              type="button"
                              className={styles.stepBtn}
                              onClick={() =>
                                updateLine(line.id, { qty: summary.qty + 1 })
                              }
                              aria-label={`More of ${summary.text}`}
                            >
                              +
                            </button>
                          </div>
                          {/* Redundant at quantity 1 — × already is the remove,
                              and two ways to delete the same line invites the
                              mis-tap this arrangement exists to avoid. */}
                          {summary.qty > 1 && (
                            <button
                              type="button"
                              className={styles.remove}
                              onClick={() => removeLine(line.id)}
                              aria-label={`Remove ${summary.text} from your order`}
                            >
                              Remove
                            </button>
                          )}
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>

        {lines.length > 0 && (
          <div className={styles.foot}>
            <div className={styles.estimateText}>
              <p className={styles.estimate} aria-live="polite">
                Estimate: {formatUSD(orderTotal(lines))}
              </p>
              <p className={styles.estimateNote}>
                Final price is calculated once your order is complete.
              </p>
            </div>
            <button
              type="button"
              className={styles.checkout}
              onClick={() => {
                // One overlay at a time: the sheet replaces the drawer.
                closeCart();
                setFormOpen(true);
              }}
            >
              Create order form
            </button>
          </div>
        )}
      </div>

      {formOpen && lines.length > 0 && (
        <OrderForm
          lines={lines}
          onClose={() => setFormOpen(false)}
          // The order has gone to paper, so it shouldn't be waiting as a draft
          // on the next visit. The in-memory order stays put in case they need
          // a second copy before leaving.
          onPrinted={forgetStoredDraft}
        />
      )}
    </>
  );
}
