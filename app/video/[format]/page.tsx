// app/video/[format]/page.tsx
// Dynamic route for individual video-transfer detail pages.
// URL pattern: /video/vhs, /video/mini-dv, /video/reels, …
// generateStaticParams pre-renders all known formats at build time.
// Lightweight detail scaffold for now — pricing/configurator to be added later.

import { notFound } from "next/navigation";
import Nav from "../../components/Nav";
import { FORMATS, FORMATS_BY_SLUG } from "../videoFormatsData";
import styles from "./page.module.css";

// Tell Next.js which slugs to statically generate at build time.
export function generateStaticParams() {
  return FORMATS.map((f) => ({ format: f.slug }));
}

export default async function VideoFormatPage({
  params,
}: {
  params: Promise<{ format: string }>;
}) {
  const { format } = await params;
  const data = FORMATS_BY_SLUG[format];

  // Return 404 for any slug not defined in videoFormatsData.ts.
  if (!data) notFound();

  return (
    <>
      <Nav activeHref="/video" />

      <main className={styles.page}>
        <header className={styles.head}>
          <h1 className={styles.title}>{data.name}</h1>
          <p className={styles.price}>{data.startingAt}</p>
        </header>

        <p className={styles.description}>{data.description}</p>
      </main>
    </>
  );
}
