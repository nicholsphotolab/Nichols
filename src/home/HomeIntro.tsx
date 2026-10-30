// HomeIntro.tsx
// The load-in animation for the home page (Figma "Slide up / Photos", node
// 2653:6088): three brand-black prints, each matted in a paper-white border,
// rise into the middle of a blank paper-white screen one after another, hold together
// as a little stack of prints, then lift away off the top — and the page is
// there underneath.
//
// It plays on a real page load of "/" — first visit or reload — and not when
// arriving at home by clicking around the site, which would make the logo a
// toll gate. It's pure CSS (see the stylesheet), so it starts the moment the
// prerendered HTML paints rather than waiting for JavaScript; React only
// removes it once it's finished. Skipped entirely for reduced-motion users.

import { useEffect, useState } from "react";
import { introPending, spendIntro } from "./introState";
import styles from "./HomeIntro.module.css";

// Back to front, as they arrive. Each print is a solid black block inset in
// its mat; positions are the Figma layout relative to the stack's top-left
// corner.
const PRINTS = [styles.print3, styles.print2, styles.print1];

export default function HomeIntro() {
  // Read at first render so the client's hydration matches the server HTML.
  const [show, setShow] = useState(introPending);

  // Only ever once per page load — coming back to home later skips it.
  useEffect(() => {
    spendIntro();
  }, []);

  if (!show) return null;

  return (
    <div
      className={styles.overlay}
      aria-hidden="true"
      // The overlay's own (zero-length, delayed) animation marks the end of
      // the sequence; the prints' animations bubble here too, so check the
      // target.
      onAnimationEnd={(e) => {
        if (e.target === e.currentTarget) setShow(false);
      }}
    >
      <div className={styles.stack}>
        {PRINTS.map((className) => (
          <div key={className} className={`${styles.print} ${className}`}>
            <div className={styles.photo} />
          </div>
        ))}
      </div>
    </div>
  );
}
