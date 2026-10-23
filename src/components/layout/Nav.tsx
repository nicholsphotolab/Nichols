import Link from "@/components/SmartLink";
import { ORDER_URL } from "@/lib/site";
import CartButton from "@/order/CartButton";
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
          <BrandLogoSwitch /> in RootLayout.tsx (HeroLogo on home, NavBrand
          elsewhere) and is centered here (NavBrand.module.css) rather than
          left-aligned — a spacer still reserves its slot and sets the
          content height the padding wraps. Primary navigation is the MENU
          control MobileMenu.tsx renders as a fixed element at the bar's left
          edge, opening the same full-screen panel at every width, not just
          mobile — there's no separate inline link list here any more. */}
      {/* First in source so MENU — the bar's left-most control — comes
          before the cart and ORDER PRINTS in tab order, matching how the bar
          reads. Stacking is set by explicit z-indexes, not source order. */}
      <MobileMenu activeHref={activeHref} />

      <NavBar solid={solid}>
        <span className={styles.brandSlot} aria-hidden="true" />

        {/* Same reveal gesture as the global reveal-arrow utility, but local: that
            one keeps the arrow's space reserved at all times, which would hold
            this label off-centre inside its fixed-width box. See Nav.module.css. */}
        <Link className={styles.cta} href={ORDER_URL}>
          order prints
          <span className={styles.ctaArrow} aria-hidden="true">↗</span>
        </Link>

        <CartButton solid={solid} />
      </NavBar>
    </>
  );
}
