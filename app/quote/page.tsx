// app/quote/page.tsx
// Quote/intake form page. Configurator CTAs land here with their selection
// summary in the ?summary= query param; the form passes it along with the
// customer's contact details. This is an inquiry, not a checkout.

import Nav from "../components/Nav";
import QuoteForm from "./QuoteForm";
import styles from "./page.module.css";

export const metadata = {
  title: "Get a Quote — Nichols Photo Lab",
};

export default function QuotePage() {
  return (
    <>
      <Nav />

      <main className={styles.page}>
        <h1 className={styles.title}>QUOTE</h1>

        <p className={styles.intro}>
          Tell us a little about your order and we&rsquo;ll confirm pricing
          and turnaround. Prices shown in the estimator are estimates — final
          pricing is confirmed at drop&#8209;off.
        </p>

        <QuoteForm />
      </main>
    </>
  );
}
