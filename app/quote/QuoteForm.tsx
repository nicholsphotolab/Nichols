// QuoteForm.tsx
// Contact/intake form for quote requests. Shows the estimator selections
// (passed via the ?summary= query param) as a read-only block, and carries
// them in a hidden field. Submitting opens the visitor's mail client with
// everything prefilled — there is no backend yet.

"use client";

import { useEffect, useState } from "react";
import { QUOTE_EMAIL } from "../lib/site";
import styles from "./page.module.css";

export default function QuoteForm() {
  // Read the estimator selection from ?summary= on the client. Done here (not
  // via server searchParams) so the page can be statically exported.
  const [summary, setSummary] = useState("");
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setSummary(params.get("summary") ?? "");
  }, []);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [notes, setNotes] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const body = [
      `Name: ${name}`,
      `Email: ${email}`,
      phone && `Phone: ${phone}`,
      summary && `Estimate: ${summary}`,
      notes && `Notes: ${notes}`,
    ]
      .filter(Boolean)
      .join("\n");

    window.location.href = `mailto:${QUOTE_EMAIL}?subject=${encodeURIComponent(
      "Quote request"
    )}&body=${encodeURIComponent(body)}`;
  }

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      {summary && (
        <div className={styles.summaryBlock}>
          <span className={styles.summaryLabel}>Your estimate</span>
          <p className={styles.summaryText}>{summary}</p>
        </div>
      )}
      {/* Selections travel with the form for a future backend submission */}
      <input type="hidden" name="summary" value={summary} />

      <label className={styles.field}>
        <span className={styles.fieldLabel}>Name</span>
        <input
          className={styles.input}
          type="text"
          name="name"
          required
          autoComplete="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </label>

      <label className={styles.field}>
        <span className={styles.fieldLabel}>Email</span>
        <input
          className={styles.input}
          type="email"
          name="email"
          required
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </label>

      <label className={styles.field}>
        <span className={styles.fieldLabel}>Phone</span>
        <input
          className={styles.input}
          type="tel"
          name="phone"
          autoComplete="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
        />
      </label>

      <label className={styles.field}>
        <span className={styles.fieldLabel}>Notes</span>
        <textarea
          className={`${styles.input} ${styles.textarea}`}
          name="notes"
          rows={4}
          placeholder="Anything we should know about your order"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />
      </label>

      <button className={styles.submit} type="submit">
        start your order →
      </button>
    </form>
  );
}
