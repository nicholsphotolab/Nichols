// OrderProvider.tsx
// Holds the customer's in-progress order for the whole site — film rolls and
// video transfers alike, in one list.
//
// The order used to live in FilmStockConfigurator's local state, which was fine
// while the only thing that read it sat on the same page. The cart button lives
// in the nav now, and the nav renders on every route, so the state has to sit
// above both — hence a context mounted once in the root layout. Nothing here
// knows what kind of thing a line describes; lib/orderPricing dispatches that.
//
// This is also the only place that reads or writes the saved draft. Storage is
// touched from effects and event handlers exclusively, never during render: the
// site is a static export, so every page is pre-rendered with no browser
// present, and `lines` therefore starts empty on the server and on the client's
// first render alike. The draft merges in afterwards, so hydration stays clean.

"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  clearDraft,
  configKey,
  newLineId,
  readDraft,
  writeDraft,
  type LinePatch,
  type NewOrderLine,
  type OrderLine,
} from "../lib/orderDraft";
import {
  orderItemCount,
  reviseLine,
  summarizeLine,
} from "../lib/orderPricing";

type StaleDraft = { lines: OrderLine[]; savedAt: number };

type OrderContextValue = {
  lines: OrderLine[];
  /** Total item count — quantities included — which is what the nav badge
   *  shows and how the cart heading counts. Not the number of lines. */
  count: number;
  /** A saved draft past the age cutoff, waiting on the customer's decision. */
  staleDraft: StaleDraft | null;
  /**
   * Add a configured item. An item matching one already in the order (same
   * everything but quantity) raises that line's quantity instead of adding a
   * second row. Returns the line that ended up holding it, new or existing.
   */
  addLine: (line: NewOrderLine) => OrderLine;
  /**
   * Change an already-added line in place — the cart edits output, exposure,
   * sheet size, and quantity this way. The patch is reconciled against what
   * the new combination actually offers (see reviseLine), so the caller can
   * set one field without worrying about the others.
   */
  updateLine: (id: string, patch: LinePatch) => void;
  removeLine: (id: string) => void;
  clearOrder: () => void;
  resumeDraft: () => void;
  discardDraft: () => void;
  /** Drop the saved draft but keep the on-screen order — used after printing,
   *  so the order doesn't reappear next visit but a second copy is still one
   *  click away in this session. */
  forgetStoredDraft: () => void;
  cartOpen: boolean;
  openCart: () => void;
  closeCart: () => void;
};

const OrderContext = createContext<OrderContextValue | null>(null);

export function useOrder(): OrderContextValue {
  const ctx = useContext(OrderContext);
  if (!ctx) {
    throw new Error("useOrder must be used inside <OrderProvider>");
  }
  return ctx;
}

export default function OrderProvider({ children }: { children: ReactNode }) {
  const [lines, setLines] = useState<OrderLine[]>([]);
  const [staleDraft, setStaleDraft] = useState<StaleDraft | null>(null);
  const [cartOpen, setCartOpen] = useState(false);

  // Mirror of `lines` kept in step with every commit, synchronously. The
  // handlers below read the order from here rather than from their render
  // closure: React batches state updates, so two clicks landing in the same
  // tick would otherwise both start from the pre-click order and the second
  // would silently undo the first. Easy to do on the cart's − / + stepper,
  // and possible on a double-tapped "Add to order".
  const linesRef = useRef<OrderLine[]>(lines);

  // Restore the saved draft once on mount. Every line is re-validated against
  // the live pricing data (summarizeLine returns null for a stock, format, or
  // transfer category that no longer exists), so a draft that outlived a data
  // change loads without the items we can no longer price rather than crashing.
  useEffect(() => {
    const draft = readDraft();
    if (!draft) return;

    const usable = draft.lines.filter((line) => summarizeLine(line) !== null);
    if (usable.length === 0) {
      clearDraft();
      return;
    }
    if (draft.stale) setStaleDraft({ lines: usable, savedAt: draft.savedAt });
    else {
      // Deliberately not commitLines: merely loading a page shouldn't restamp
      // the draft and reset its three-day clock. The mirror still has to track
      // it, or the first edit would be computed against an empty order.
      linesRef.current = usable;
      setLines(usable);
    }
    // Mount-only: storage is an input here, not a subscription.
  }, []);

  // The single write path for the order, so React state and the saved draft
  // can't drift apart. Storage is written from handlers only — never from an
  // effect on `lines` — so merely loading a page doesn't restamp the draft and
  // reset its 3-day clock.
  const commitLines = useCallback((next: OrderLine[]) => {
    linesRef.current = next;
    setLines(next);
    if (next.length === 0) clearDraft();
    else writeDraft(next);
    // Any deliberate change to the order answers the resume question.
    setStaleDraft(null);
  }, []);

  // These build the next order from linesRef rather than from a functional
  // state update, which keeps the storage write out of the state updater —
  // updaters must stay pure, since React calls them twice in development's
  // StrictMode. Reading the mirror instead of the closure is what makes them
  // safe to fire repeatedly without a render in between.
  // Adding something already in the order raises that line's quantity instead
  // of listing it again: a customer dropping off three identically configured
  // disposables means "3 of these", not three rows to read past. The existing
  // line keeps its place in the list rather than jumping to the bottom, so the
  // order stays in the sequence it was built in.
  const addLine = useCallback(
    (line: NewOrderLine) => {
      const current = linesRef.current;
      const key = configKey(line);
      const match = current.find((l) => configKey(l) === key);

      if (match) {
        const merged: OrderLine = { ...match, qty: match.qty + line.qty };
        commitLines(current.map((l) => (l.id === match.id ? merged : l)));
        return merged;
      }

      const stored: OrderLine = { ...line, id: newLineId() };
      commitLines([...current, stored]);
      return stored;
    },
    [commitLines]
  );

  const updateLine = useCallback(
    (id: string, patch: LinePatch) =>
      commitLines(
        linesRef.current.map((l) => (l.id === id ? reviseLine(l, patch) : l))
      ),
    [commitLines]
  );

  const removeLine = useCallback(
    (id: string) => commitLines(linesRef.current.filter((l) => l.id !== id)),
    [commitLines]
  );

  const clearOrder = useCallback(() => commitLines([]), [commitLines]);

  const resumeDraft = useCallback(() => {
    if (!staleDraft) return;
    commitLines(staleDraft.lines);
  }, [staleDraft, commitLines]);

  const discardDraft = useCallback(() => {
    clearDraft();
    setStaleDraft(null);
  }, []);

  const forgetStoredDraft = useCallback(() => clearDraft(), []);

  const openCart = useCallback(() => setCartOpen(true), []);
  const closeCart = useCallback(() => setCartOpen(false), []);

  const value = useMemo<OrderContextValue>(
    () => ({
      lines,
      count: orderItemCount(lines),
      staleDraft,
      addLine,
      updateLine,
      removeLine,
      clearOrder,
      resumeDraft,
      discardDraft,
      forgetStoredDraft,
      cartOpen,
      openCart,
      closeCart,
    }),
    [
      lines,
      staleDraft,
      addLine,
      updateLine,
      removeLine,
      clearOrder,
      resumeDraft,
      discardDraft,
      forgetStoredDraft,
      cartOpen,
      openCart,
      closeCart,
    ]
  );

  return (
    <OrderContext.Provider value={value}>{children}</OrderContext.Provider>
  );
}
