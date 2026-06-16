// QuoteCta.tsx
// Estimate disclaimer + "Get a quote" call-to-action shown at the bottom of
// every configurator page. The current selections are passed to the /quote
// intake form as a URL-encoded summary so the form arrives prefilled.

import Link from "next/link";
import styles from "./QuoteCta.module.css";

export default function QuoteCta({ summary }: { summary: string }) {
  return (
    <div className={styles.wrap}>
      <p className={styles.disclaimer}>
        Prices shown are estimates. Final pricing is confirmed at drop&#8209;off.
      </p>
      <Link
        className={styles.cta}
        href={`/quote?summary=${encodeURIComponent(summary)}`}
      >
        get a quote →
      </Link>
    </div>
  );
}
