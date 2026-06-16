import Nav from "../components/Nav";
import VideoHeroReel from "./VideoHeroReel";
import VideoCategoriesGrid from "./VideoCategoriesGrid";
import VideoProcessSteps from "./VideoProcessSteps";
import styles from "./page.module.css";

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

        <VideoCategoriesGrid />

        <VideoProcessSteps />
      </main>
    </>
  );
}
