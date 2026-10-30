// Hero.tsx
// The home page's first screen: a full-bleed lab photo with the large logo
// over it (HeroLogo, rendered globally by BrandLogoSwitch in RootLayout.tsx —
// this section reserves its room).

import Image from "@/components/Image";
import { withBasePath } from "@/lib/basePath";
import styles from "./Hero.module.css";

// Case-sensitive on deploy — must match the filename in public/ exactly.
const BACKGROUND = "/Home.webp";

export default function Hero() {
  return (
    <section id="home-hero" className={styles.hero} aria-label="Nichols Photo Lab">
      <div className={styles.backgrounds} aria-hidden="true">
        <Image
          className={styles.background}
          src={withBasePath(BACKGROUND)}
          alt=""
          fill
          priority
          sizes="100vw"
        />
      </div>
      <div className={styles.scrim} aria-hidden="true" />
    </section>
  );
}
