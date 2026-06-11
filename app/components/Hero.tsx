import styles from "./Hero.module.css";

// Spacer that reserves room for the fixed <HeroLogo /> (rendered globally by
// BrandLogoSwitch in layout.tsx). The logo sits below the nav at scroll 0 and
// docks into the nav corner on scroll; see Hero.module.css for the height math.
export default function Hero() {
  return <section className={styles.hero} aria-hidden="true" />;
}
