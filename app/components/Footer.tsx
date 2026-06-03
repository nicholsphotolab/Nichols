// Footer.tsx
// Site-wide footer rendered in the root layout (app/layout.tsx), so it appears
// on every page. Contains four columns: copyright, nav links, hours, and contact.
// All type styles are unified in Footer.module.css under a single shared rule.
// The reveal-on-hover arrow pattern comes from the global .reveal-arrow utility
// defined in globals.css.

import Link from "next/link";
import { CONTACT, MAPS_URL, NAV_ITEMS } from "../lib/site";
import styles from "./Footer.module.css";
import FooterLogoScrollReveal from "./FooterLogoScrollReveal";

export default function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer className={styles.footer}>
      {/* Full-width logo that slides up from below when the footer enters view */}
      <FooterLogoScrollReveal />

      <hr className={styles.divider} />

      <div className={styles.cols}>
        {/* Copyright — bottom-left on mobile (order: 3) */}
        <div className={styles.copyright}>©{year}</div>

        {/* Nav links — same items as the top nav, with footer-specific labels */}
        <nav className={styles.nav} aria-label="Footer">
          {NAV_ITEMS.map((l) => (
            <Link key={l.href} href={l.href} className="reveal-on-hover">
              {l.footerLabel ?? l.label}<span className="reveal-arrow" aria-hidden="true">↗</span>
            </Link>
          ))}
        </nav>

        {/* Business hours */}
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

        {/* Address (links to Google Maps) and phone number */}
        <div className={styles.contact}>
          <a
            className={`${styles.address} reveal-on-hover`}
            href={MAPS_URL}
            target="_blank"
            rel="noopener noreferrer"
          >
            <span>{CONTACT.addressLine1}</span>
            <span>
              {CONTACT.addressLine2}<span className="reveal-arrow" aria-hidden="true">↗</span>
            </span>
          </a>
          <a className={`${styles.phone} reveal-on-hover`} href={`tel:${CONTACT.phoneTel}`}>
            {CONTACT.phoneDisplay}<span className="reveal-arrow" aria-hidden="true">↗</span>
          </a>
        </div>
      </div>
    </footer>
  );
}
