import Hero from "./Hero";
import HomeIntro from "./HomeIntro";
import Nav from "@/components/layout/Nav";
import ServicesIndex from "./ServicesIndex";

export default function Home() {
  return (
    <>
      {/* Plays over everything on a fresh load of "/", then removes itself. */}
      <HomeIntro />
      <Nav solid />
      <main id="main" tabIndex={-1}>
        <Hero />
        <ServicesIndex />
      </main>
    </>
  );
}
