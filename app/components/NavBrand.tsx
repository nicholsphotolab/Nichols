import Link from "next/link";
import NicholsLogoSvg from "./NicholsLogoSvg";
import styles from "./NavBrand.module.css";

// Static top-left logo used on every page EXCEPT the home page.
// Home uses <HeroLogo /> which morphs from a giant centered state into
// this exact position (top: 20.5px, left: 40px, height: 33px).
export default function NavBrand() {
  return (
    <Link
      href="/"
      aria-label="Nichols Photo Lab — home"
      className={styles.brand}
    >
      <NicholsLogoSvg className={styles.svg} />
    </Link>
  );
}
