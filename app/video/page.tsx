import Nav from "../components/Nav";
import VideoHeroReel from "./VideoHeroReel";
import VideoServicesCarousel from "./VideoServicesCarousel";
import VideoProcessSteps from "./VideoProcessSteps";
import styles from "./page.module.css";

export default function VideoPage() {
  return (
    <>
      <Nav activeHref="/video" />

      <main className={styles.page}>
        <section className={styles.heroVideo} aria-label="Video transfer">
          <VideoHeroReel />
          <div className={styles.overlay}>
            <h1 className={styles.title}>VIDEO</h1>
            <p className={styles.description}>
              Old memories deserve to be preserved. We transfer film reels,
              tapes, and other video formats into clean digital files,
              in&#8209;house, so you can relive those precious moments.
            </p>
          </div>
        </section>

        <VideoServicesCarousel />

        <VideoProcessSteps />
      </main>
    </>
  );
}
