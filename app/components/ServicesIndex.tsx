// ServicesIndex.tsx
// Homepage index of the four services: a label above an image at the
// site-wide --image-ratio. Each card links to its service page. On hover the
// other cards' images desaturate (same treatment as the film stocks grid).

import Link from "next/link";
import Image from "next/image";
import { withBasePath } from "../lib/basePath";
import styles from "./ServicesIndex.module.css";

type Service = {
  label: string;
  href: string;
  image?: string;
};

const SERVICES: Service[] = [
  { label: "Film", href: "/film", image: "/Film.jpg" },
  { label: "Prints", href: "/prints" },
  { label: "Video", href: "/video" },
  { label: "Passport", href: "/passport" },
];

export default function ServicesIndex() {
  return (
    <section className={styles.section} aria-label="Services">
      <ul className={styles.grid}>
        {SERVICES.map((s) => (
          <li key={s.href} className={styles.card}>
            <Link href={s.href} className={styles.link}>
              <span className={styles.label}>
                {s.label}
              </span>
              <span className={styles.image}>
                {s.image && (
                  <Image src={withBasePath(s.image)} alt="" fill sizes="(max-width: 900px) 50vw, 25vw" />
                )}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
