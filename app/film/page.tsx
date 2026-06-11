import Nav from "../components/Nav";
import FilmHeroImage from "./FilmHeroImage";
import FilmStocksGrid from "./FilmStocksGrid";
import FilmProcessSteps from "./FilmProcessSteps";
import styles from "./page.module.css";

export default function FilmPage() {
  return (
    <>
      <Nav activeHref="/film" />

      <main className={styles.page}>
        <section className={styles.heroRow} aria-label="Film">
          <h1 className={styles.title}>FILM</h1>
          <div className={styles.heroImage}>
            <FilmHeroImage />
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
