import type { Metadata } from "next";
import Nav from "../components/Nav";
import VideoHeroReel from "./VideoHeroReel";
import VideoProductsGrid from "./VideoProductsGrid";
import VideoProcessSteps from "./VideoProcessSteps";
import styles from "./page.module.css";

export const metadata: Metadata = {
  title: "Video & Audio Transfer",
  description:
    "VHS, camcorder tapes, audio cassettes, discs, and 8mm/Super 8/16mm film reels digitized to clean, shareable files in Salt Lake City.",
};

export default function VideoPage() {
  return (
    <>
      <Nav activeHref="/video" />

      <main className={styles.page}>
        <section className={styles.hero} aria-label="Video transfer">
          <VideoHeroReel />
          <div className={styles.heroScrim} aria-hidden="true" />

          <div className={styles.heroContent}>
            <h1 className={styles.title}>VIDEO</h1>
            <p className={styles.heroDescription}>
              Old memories deserve to be preserved. We transfer film reels,
              tapes, and other video formats into clean digital files,
              in&#8209;house, so you can relive those precious moments.
            </p>
            <p className={styles.heroMeta}>8MM REEL</p>
          </div>
        </section>

        <VideoProductsGrid />

        <VideoProcessSteps />
      </main>
    </>
  );
}
