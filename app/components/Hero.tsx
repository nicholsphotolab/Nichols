import styles from "./Hero.module.css";

export default function Hero() {
  return (
    <section className={styles.hero}>
      <div className={styles.media} aria-hidden="true">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/Hero.jpg" alt="" />
      </div>
    </section>
  );
}
