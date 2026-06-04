import Nav from "../components/Nav";
import FaqAccordion from "./FaqAccordion";
import { FAQ_SECTIONS } from "./faqData";
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
        <h1 className={styles.title}>FAQ</h1>
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
