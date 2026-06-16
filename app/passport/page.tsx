import Image from "next/image";
import Nav from "../components/Nav";
import PassportPackages from "./PassportPackages";
import styles from "./page.module.css";

export default function PassportPage() {
  return (
    <>
      <Nav activeHref="/passport" />

      <main className={styles.page}>
        <section className={styles.hero} aria-label="Passport">
          <Image
            className={styles.heroBg}
            src="/Passport-Hero.jpg"
            alt=""
            fill
            priority
            sizes="100vw"
          />
          <div className={styles.heroScrim} aria-hidden="true" />

          <div className={styles.heroContent}>
            <h1 className={styles.title}>PASSPORT</h1>
            <p className={styles.heroDescription}>
              From US passports to Canada, Australia and beyond, we shoot and
              print to each country&rsquo;s exact specs, so your application
              clears the first time.
            </p>
            <p className={styles.heroMeta}>
              ILFORD HP5
              <br />
              B&amp;W • 24EXP
            </p>
          </div>
        </section>

        <PassportPackages />
      </main>
    </>
  );
}
