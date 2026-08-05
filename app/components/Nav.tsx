import Link from "next/link";
import { NAV_ITEMS, ORDER_URL } from "../lib/site";
import CartButton from "./CartButton";
import MobileMenu from "./MobileMenu";
import NavBar from "./NavBar";
import styles from "./Nav.module.css";

export default function Nav({
  activeHref,
  solid,
}: {
  activeHref?: string;
  /** Pin the solid white bar from the top (pages without a dark hero). */
  solid?: boolean;
}) {
  return (
    <>
      {/* The bar is a real flex container; its height comes from its padding
          + the content. The brand mark is rendered globally by
          <BrandLogoSwitch /> in layout.tsx (HeroLogo on home, NavBrand
          elsewhere), so a spacer reserves its slot on the left and sets the
          content height the padding wraps. */}
      <NavBar solid={solid}>
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

        {/* Rightmost item in the bar, and the only one that survives the 900px
            breakpoint — the links and the CTA move into the hamburger menu,
            but the order stays one tap away. */}
        <CartButton />
      </NavBar>

      <MobileMenu activeHref={activeHref} />
    </>
  );
}
