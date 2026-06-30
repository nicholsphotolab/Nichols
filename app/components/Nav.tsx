import Link from "next/link";
import { NAV_ITEMS, ORDER_URL } from "../lib/site";
import MobileMenu from "./MobileMenu";
import NavBar from "./NavBar";
import styles from "./Nav.module.css";

export default function Nav({ activeHref }: { activeHref?: string }) {
  return (
    <>
      {/* The bar is a real flex container with 40px top/bottom padding; its
          height comes from that padding + the content. The brand mark is
          rendered globally by <BrandLogoSwitch /> in layout.tsx (HeroLogo on
          home, NavBrand elsewhere), so a spacer reserves its slot on the left
          and sets the content height the padding wraps. */}
      <NavBar>
        <span className={styles.brandSlot} aria-hidden="true" />

        <nav className={styles.links} aria-label="Primary">
          {NAV_ITEMS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={l.href === activeHref ? styles.active : undefined}
            >
              {l.label}
              <span className={styles.underline} aria-hidden="true" />
            </Link>
          ))}
        </nav>

        <Link className={styles.cta} href={ORDER_URL}>
          order prints{" "}
          <span className={styles.ctaArrow} aria-hidden="true">↗</span>
        </Link>
      </NavBar>

      <MobileMenu activeHref={activeHref} />
    </>
  );
}
