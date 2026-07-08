import type { Metadata } from "next";
import Nav from "../components/Nav";
import VideoHero from "./VideoHero";
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
        <VideoHero />

        <VideoProductsGrid />

        <VideoProcessSteps />
      </main>
    </>
  );
}
