import Link from "next/link";
import { NAV_ITEMS, ORDER_URL } from "../lib/site";
import styles from "./Nav.module.css";

export default function Nav({ activeHref }: { activeHref?: string }) {
  return (
    <>
      {/* Brand mark is rendered globally by <HeroLogo /> in layout.tsx,
          which morphs from the giant hero into this nav slot
          (top: 20.5px, left: 40px, height: 33px). */}
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
        order prints →
      </Link>
    </>
  );
}
