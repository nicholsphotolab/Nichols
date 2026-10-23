import PageHero from "@/components/page/PageHero";
import page from "@/components/page/Page.module.css";
import Nav from "@/components/layout/Nav";
import FaqAccordion from "./FaqAccordion";
import { FAQ_SECTIONS } from "./faqData";
import styles from "./FaqPage.module.css";

export default function FaqPage() {
  return (
    <>
      <Nav activeHref="/faq" />
      <main id="main" tabIndex={-1} className={`${page.page} ${page.roomy}`}>
        <PageHero
          label="FAQ"
          title="FAQ"
          titleBearing={0.078}
          image="/FAQ-Hero.jpg"
          description="Answers to the questions we hear most, from film processing and prints to passport photos and visiting the shop."
        />

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
