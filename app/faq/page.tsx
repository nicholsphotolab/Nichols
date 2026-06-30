import Image from "next/image";
import Nav from "../components/Nav";
import FaqAccordion from "./FaqAccordion";
import { FAQ_SECTIONS } from "./faqData";
import { withBasePath } from "../lib/basePath";
import styles from "./page.module.css";

export const metadata = {
  title: "FAQ — Nichols Photo Lab",
  description:
    "Answers to common questions about film processing, prints, passport photos, and general store info.",
};

export default function FaqPage() {
  return (
    <>
      <Nav activeHref="/faq" />
      <main className={styles.page}>
        <section className={styles.hero} aria-label="FAQ">
          <Image
            className={styles.heroBg}
            src={withBasePath("/FAQ-Hero.jpg")}
            alt=""
            fill
            priority
            sizes="100vw"
          />
          <div className={styles.heroScrim} aria-hidden="true" />

          <div className={styles.heroContent}>
            <h1 className={styles.title}>FAQ</h1>
            <p className={styles.heroDescription}>
              Answers to the questions we hear most, from film processing and
              prints to passport photos and visiting the shop.
            </p>
          </div>
        </section>

        <div className={styles.sections}>
          {FAQ_SECTIONS.map((section) => (
            <section key={section.heading} className={styles.section}>
              <h2 className={styles.sectionHeading}>{section.heading}</h2>
              <FaqAccordion items={section.items} />
            </section>
          ))}
        </div>
      </main>
    </>
  );
}
