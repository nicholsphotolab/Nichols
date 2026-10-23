// useModalFocus.ts
// Keyboard and screen-reader behaviour shared by every surface that covers the
// page — the cart drawer, the full-screen menu, the printable order form and
// the configurator explainer:
//
//   - Escape closes it.
//   - Focus moves into it on open, so keyboard and screen-reader users land in
//     what they just opened rather than being left behind it.
//   - Everything outside it is made `inert` while it's open — unreachable by
//     Tab and hidden from screen readers — so focus can't wander into the page
//     underneath. (This is what aria-modal promises but doesn't enforce.)
//   - On close, focus returns to whatever opened it, so the user picks up
//     where they left off instead of being dropped at the top of the page.
//
// Surfaces stack: the order form opens over the cart. The cart passes
// `active: cartOpen && !formOpen`, which hands control to the form while it's
// up and takes it back when it closes — without losing the cart's own opener.

import { useEffect, useRef, type RefObject } from "react";

/** Mark every element outside `keep` inert; returns the undo. */
function inertOutside(keep: HTMLElement[]): () => void {
  const changed: HTMLElement[] = [];
  for (const root of keep) {
    let node: HTMLElement = root;
    while (node.parentElement && node !== document.body) {
      const parent: HTMLElement = node.parentElement;
      for (const sibling of Array.from(parent.children)) {
        if (!(sibling instanceof HTMLElement)) continue;
        if (sibling.inert || keep.some((k) => sibling.contains(k))) continue;
        // Never touch <head>-ish or script nodes that have no rendering.
        if (sibling.tagName === "SCRIPT" || sibling.tagName === "STYLE") continue;
        sibling.inert = true;
        changed.push(sibling);
      }
      node = parent;
    }
  }
  return () => changed.forEach((el) => (el.inert = false));
}

export function useModalFocus({
  active,
  containerRef,
  onEscape,
  keep,
  focusOnOpen = true,
}: {
  active: boolean;
  /** The surface itself. Give it tabIndex={-1} so it can take focus. */
  containerRef: RefObject<HTMLElement | null>;
  onEscape: () => void;
  /** Extra elements that stay usable alongside it (e.g. the menu's toggle). */
  keep?: () => (HTMLElement | null | undefined)[];
  /** False to leave focus where it is on open (e.g. on a toggle that sits
   *  right before the panel in tab order). */
  focusOnOpen?: boolean;
}) {
  // Latest callbacks without re-running the effect — re-running it would
  // undo and redo the inert marking on every render.
  const escapeRef = useRef(onEscape);
  escapeRef.current = onEscape;
  const keepRef = useRef(keep);
  keepRef.current = keep;

  // Survives a hand-off to a stacked surface and back (see header).
  const openerRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!active || !container) return;

    const focused = document.activeElement as HTMLElement | null;
    if (focused && !container.contains(focused)) openerRef.current = focused;

    const keepEls = [
      container,
      ...(keepRef.current?.() ?? []).filter((el): el is HTMLElement => !!el),
    ];
    const restoreInert = inertOutside(keepEls);

    if (focusOnOpen && !container.contains(document.activeElement)) {
      container.focus({ preventScroll: true });
    }

    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      e.preventDefault();
      escapeRef.current();
    };
    document.addEventListener("keydown", onKey);

    return () => {
      document.removeEventListener("keydown", onKey);
      restoreInert();
      // Only pull focus back if it's still in the surface (or lost to
      // <body>) — not if it has already moved on to a stacked surface.
      const now = document.activeElement;
      const stranded = !now || now === document.body || container.contains(now);
      const opener = openerRef.current;
      if (stranded && opener && opener.isConnected) {
        opener.focus({ preventScroll: true });
      }
    };
  }, [active, containerRef, focusOnOpen]);
}
