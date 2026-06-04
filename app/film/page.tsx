import Link from "next/link";
import Nav from "../components/Nav";
import FilmHeroImage from "./FilmHeroImage";
import FilmProcessSteps from "./FilmProcessSteps";
import styles from "./page.module.css";

type Stock = {
  name: React.ReactNode;
  startingAt: string;
  image?: string;
  href: string;
};

const STOCKS: Stock[] = [
  {
    name: "C‑41",
    startingAt: "Develop from $6.50",
    image: "/C-41.webp",
    href: "/film/c-41",
  },
  {
    name: "B&W",
    startingAt: "Develop from $8.50",
    image: "/B%26W.webp",
    href: "/film/bw",
  },
  {
    name: "E‑6",
    startingAt: "Develop from $8.50",
    image: "/E-6.webp",
    href: "/film/e-6",
  },
];

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

        <section className={styles.stocks} aria-label="Film stocks">
          {STOCKS.map((s, i) => (
            <Link
              key={i}
              className={`${styles.stock} reveal-on-hover`}
              href={s.href}
            >
              <div className={styles.stockImage} aria-hidden="true">
                {s.image && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={s.image} alt="" />
                )}
              </div>
              <div className={styles.stockMeta}>
                <h2 className={styles.stockName}>{s.name}</h2>
                <p className={styles.stockPrice}>{s.startingAt}</p>
              </div>
              <span className={styles.stockCta}>
                Estimate cost
                <span className="reveal-arrow" aria-hidden="true">
                  →
                </span>
              </span>
            </Link>
          ))}
        </section>

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
