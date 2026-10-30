// Quote/intake form page. Configurator CTAs land here with their selection
// summary in the ?summary= query param; the form passes it along with the
// customer's contact details. This is an inquiry, not a checkout.

import Nav from "@/components/layout/Nav";
import QuoteForm from "./QuoteForm";
import page from "@/components/page/Page.module.css";
import styles from "./QuotePage.module.css";

export default function QuotePage() {
  return (
    <>
      <Nav />

      <main id="main" tabIndex={-1} className={`${page.page} ${page.roomy}`}>
        <h1 className={styles.title}>Quote</h1>

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
