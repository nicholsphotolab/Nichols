import Hero from "./Hero";
import HomeIntro from "./HomeIntro";
import Nav from "@/components/layout/Nav";

// The hero's height less the nav bar's — the scroll at which the photo's
// bottom edge passes under the bar.
const NAV_BAR_HEIGHT = 80;
function heroScrolledPast(): number {
  const hero = document.getElementById("home-hero");
  return hero ? hero.offsetHeight - NAV_BAR_HEIGHT : 40;
}

export default function Home() {
  return (
    <>
      {/* Plays over everything on a fresh load of "/", then removes itself. */}
      <HomeIntro />
      {/* Transparent over the photo; the solid bar (and the black logo with
          it) only snaps in once the photo has scrolled up under the nav. By
          then the large logo has long finished docking. */}
      <Nav solidAfter={heroScrolledPast} />
      <main id="main" tabIndex={-1}>
        <Hero />
      </main>
    </>
  );
}
