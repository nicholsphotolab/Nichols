import { withBasePath } from "@/lib/basePath";
import styles from "./MenuPhotoStack.module.css";

// Reuses each destination page's own existing hero image rather than new
// photography (per user direction). Prints/About have no page yet, so they
// have no entry here and fall back to the black placeholder.
const HOVER_IMAGES: Record<string, string> = {
  "/film": withBasePath("/Hero-Film.webp"),
  "/video": withBasePath("/VIDEO/Video-Reel-Poster.jpg"),
  "/passport": withBasePath("/Passport-Hero.jpg"),
};

export default function MenuPhotoStack({
  hoveredHref,
}: {
  hoveredHref: string | null;
}) {
  const image = hoveredHref ? HOVER_IMAGES[hoveredHref] : undefined;
  const photoStyle = image ? { backgroundImage: `url(${image})` } : undefined;

  return (
    <div className={styles.stack} aria-hidden="true">
      <div className={`${styles.photo} ${styles.layer3}`} style={photoStyle} />
      <div className={`${styles.backer} ${styles.backer2}`} />
      <div className={`${styles.photo} ${styles.photo2}`} style={photoStyle} />
      <div className={`${styles.backer} ${styles.backer1}`} />
      <div className={`${styles.photo} ${styles.photo1}`} style={photoStyle} />
    </div>
  );
}
