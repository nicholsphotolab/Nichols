import Link from "next/link";
import { CONTACT, MAPS_URL, NAV_ITEMS } from "../lib/site";
import styles from "./Footer.module.css";
import FooterLogoAnimated from "./FooterLogoAnimated";

export default function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer className={styles.footer}>
      <FooterLogoAnimated />

      <hr className={styles.divider} />

      <div className={styles.cols}>
        <div className={styles.copyright}>©{year}</div>

        <nav className={styles.nav} aria-label="Footer">
          {NAV_ITEMS.map((l) => (
            <Link key={l.href} href={l.href} className="reveal-on-hover">
              {l.footerLabel ?? l.label}
              <span className="reveal-arrow" aria-hidden="true">↗</span>
            </Link>
          ))}
        </nav>

        <div className={styles.hoursBlock}>
          <div className={styles.hoursGroup}>
            <span>Open:</span>
            <span>Monday-Friday</span>
            <span>9AM-5PM</span>
          </div>
          <div className={styles.hoursGroup}>
            <span>Passport Hours:</span>
            <span>9AM-4PM</span>
          </div>
        </div>

        <div className={styles.contact}>
          <a
            className={`${styles.address} reveal-on-hover`}
            href={MAPS_URL}
            target="_blank"
            rel="noopener noreferrer"
          >
            <span>{CONTACT.addressLine1}</span>
            <span>
              {CONTACT.addressLine2}
              <span className="reveal-arrow" aria-hidden="true">↗</span>
            </span>
          </a>
          <a className={`${styles.phone} reveal-on-hover`} href={`tel:${CONTACT.phoneTel}`}>
            {CONTACT.phoneDisplay}
            <span className="reveal-arrow" aria-hidden="true">↗</span>
          </a>
        </div>
      </div>
    </footer>
  );
}
