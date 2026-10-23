
import { useId, useState } from "react";
import type { FaqItem } from "./faqData";
import styles from "./FaqAccordion.module.css";

function Item({
  item,
  open,
  onToggle,
}: {
  item: FaqItem;
  open: boolean;
  onToggle: () => void;
}) {
  const panelId = useId();
  return (
    <div className={styles.item}>
      <button
        type="button"
        className={`${styles.trigger} ${open ? styles.triggerOpen : ""}`}
        aria-expanded={open}
        aria-controls={panelId}
        onClick={onToggle}
      >
        <span className={styles.question}>{item.q}</span>
        <span className={`${styles.indicator} ${open ? styles.indicatorOpen : ""}`} aria-hidden="true">
          →
        </span>
      </button>
      {/* Collapsed answers stay mounted for the open/close animation, so
          they're made inert — otherwise screen readers read every answer
          on the page whether it's open or not. */}
      <div
        id={panelId}
        className={`${styles.body} ${open ? styles.open : ""}`}
        aria-hidden={!open}
        inert={!open}
      >
        <div className={styles.bodyInner}>
          <p className={styles.answer}>{item.a}</p>
        </div>
      </div>
    </div>
  );
}

export default function FaqAccordion({ items }: { items: FaqItem[] }) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <div className={styles.list}>
      {items.map((item, i) => (
        <Item
          key={i}
          item={item}
          open={openIndex === i}
          onToggle={() => setOpenIndex(openIndex === i ? null : i)}
        />
      ))}
    </div>
  );
}
