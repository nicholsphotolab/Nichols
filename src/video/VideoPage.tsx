import Nav from "@/components/layout/Nav";
import VideoHero from "./VideoHero";
import ProductGrid from "@/components/page/ProductGrid";
import ProcessSteps from "@/components/page/ProcessSteps";
import { VIDEO_CARDS, VIDEO_STEPS } from "./videoPageContent";
import page from "@/components/page/Page.module.css";

export default function VideoPage() {
  return (
    <>
      <Nav activeHref="/video" />

      <main id="main" tabIndex={-1} className={page.page}>
        <VideoHero />

        <ProductGrid
          heading="Video & Audio Transfer"
          label="Video & audio transfer"
          itemsLabel="formats"
          cards={VIDEO_CARDS}
        />

        <ProcessSteps steps={VIDEO_STEPS} />
      </main>
    </>
  );
}
