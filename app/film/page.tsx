import Image from "next/image";
import Nav from "../components/Nav";
import FilmStocksGrid from "./FilmStocksGrid";
import FilmProcessSteps from "./FilmProcessSteps";
import styles from "./page.module.css";

export default function FilmPage() {
  return (
    <>
      <Nav activeHref="/film" />

      <main className={styles.page}>
        <section className={styles.hero} aria-label="Film">
          <Image
            className={styles.heroBg}
            src="/Film-Hero.jpg"
            alt=""
            fill
            priority
            sizes="100vw"
          />
          <div className={styles.heroScrim} aria-hidden="true" />

          <div className={styles.heroContent}>
            <h1 className={styles.title}>FILM</h1>
            <p className={styles.heroDescription}>
              We carefully develop your film the way it deserves, so every frame
              comes back as rich as the moment you shot it.
            </p>
            <p className={styles.heroMeta}>
              PORTRA 400
              <br />
              C-41 • 36EXP
            </p>
          </div>
        </section>

        <FilmStocksGrid />

        <p className={styles.intro}>
          Film deserves to be developed right. We process C&#8209;41, B&amp;W,
          and E&#8209;6 all in-house across every major format, backed by 45+
          years of experience.
        </p>

        <FilmProcessSteps />
      </main>
    </>
  );
}
