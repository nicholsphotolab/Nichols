
import { useEffect, useRef, useState } from "react";
import { useModalFocus } from "@/lib/useModalFocus";
import Link from "@/components/SmartLink";
import { NAV_ITEMS, ORDER_URL } from "@/lib/site";
import MenuPhotoStack from "./MenuPhotoStack";
import styles from "./MobileMenu.module.css";

// The full-screen panel shows five links, not all six of NAV_ITEMS — matches
// the Figma reference (Frame430, node 2934:1412), which omits FAQ. FAQ stays
// reachable from the footer as it already is.
const MENU_ITEMS = NAV_ITEMS.filter((item) => item.href !== "/faq");

export default function MobileMenu({ activeHref }: { activeHref?: string }) {
  const [open, setOpen] = useState(false);
  const [hoveredHref, setHoveredHref] = useState<string | null>(null);

  // Lock page scroll while the menu is open. Set on both roots: html for
  // desktop/modern browsers, body for older iOS Safari (which historically
  // ignored overflow on the root element for touch scrolling).
  useEffect(() => {
    if (!open) return;
    const prevHtml = document.documentElement.style.overflow;
    const prevBody = document.body.style.overflow;
    document.documentElement.style.overflow = "hidden";
    document.body.style.overflow = "hidden";
    return () => {
      document.documentElement.style.overflow = prevHtml;
      document.body.style.overflow = prevBody;
    };
  }, [open]);

  // Flag the open panel globally, the same way NavBar flags the scrolled bar.
  // The controls that stay on top of the panel — the brand mark and the cart
  // button — are fixed elements outside it, coloured paper-white for a dark
  // hero. Over the panel's paper-white they'd be invisible, so each keys off
  // this attribute to switch to black, exactly as they already do for
  // html[data-nav-scrolled].
  useEffect(() => {
    if (!open) return;
    document.documentElement.dataset.menuOpen = "true";
    return () => {
      delete document.documentElement.dataset.menuOpen;
    };
  }, [open]);

  // Escape closes and returns focus to the toggle; the page under the panel
  // is made unreachable while it's open. Focus stays on the toggle (now
  // CLOSE) on open — the links are the very next Tab stops. The nav bar's own
  // controls (logo, cart, order prints) stay usable because they sit above
  // the panel.
  const panelRef = useRef<HTMLElement | null>(null);
  const toggleRef = useRef<HTMLButtonElement | null>(null);
  useModalFocus({
    active: open,
    containerRef: panelRef,
    onEscape: () => setOpen(false),
    keep: () => [
      toggleRef.current,
      ...Array.from(document.querySelectorAll<HTMLElement>("[data-nav-chrome]")),
    ],
    focusOnOpen: false,
  });

  // Hovering never fires on touch, so this only ever matters on the
  // hover-capable layouts MenuPhotoStack renders for (see its CSS module).
  const clearHover = (href: string) =>
    setHoveredHref((h) => (h === href ? null : h));

  return (
    <>
      <button
        type="button"
        ref={toggleRef}
        className={styles.toggle}
        data-open={open || undefined}
        aria-expanded={open}
        aria-controls="mobile-menu"
        onClick={() => setOpen((v) => !v)}
      >
        {open ? "Close" : "Menu"}
      </button>

      {/* No separate header here — the persistent site bar (Nav.tsx) stays
          visible above this panel while it's open (lifted in Nav.module.css)
          and already carries CLOSE (this toggle, swapped from MENU), the
          logo, cart, and — above 900px — ORDER PRINTS. Below 900px that bar
          hides ORDER PRINTS, so it's repeated here as an ordinary row in the
          link list instead of a second, differently-styled bar. */}
      <nav
        id="mobile-menu"
        ref={panelRef}
        className={styles.panel}
        data-open={open || undefined}
        aria-label="Main"
      >
        <div className={styles.body}>
          <div className={styles.links}>
            {MENU_ITEMS.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className={`${styles.link} ${
                  l.href === activeHref ? styles.active : ""
                }`}
                onClick={() => setOpen(false)}
                onMouseEnter={() => setHoveredHref(l.href)}
                onMouseLeave={() => clearHover(l.href)}
              >
                {l.label}
              </Link>
            ))}

            <Link
              className={styles.orderLink}
              href={ORDER_URL}
              onClick={() => setOpen(false)}
            >
              order prints{" "}
              <span className={styles.orderLinkArrow} aria-hidden="true">↗</span>
            </Link>
          </div>

          <MenuPhotoStack hoveredHref={hoveredHref} />
        </div>
      </nav>
    </>
  );
}
