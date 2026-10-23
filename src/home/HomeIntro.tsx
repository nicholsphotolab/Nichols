// HomeIntro.tsx
// The load-in animation for the home page (Figma "Slide up / Photos", node
// 2653:6088): three photos, each matted in a paper-white border, rise into
// the middle of a blank paper-white screen one after another, hold together
// as a little stack of prints, then lift away off the top — and the page is
// there underneath.
//
// It plays on a real page load of "/" — first visit or reload — and not when
// arriving at home by clicking around the site, which would make the logo a
// toll gate. It's pure CSS (see the stylesheet), so it starts the moment the
// prerendered HTML paints rather than waiting for JavaScript; React only
// removes it once it's finished. Skipped entirely for reduced-motion users.

import { useEffect, useState } from "react";
import { withBasePath } from "@/lib/basePath";
import styles from "./HomeIntro.module.css";

// Whether this page load began on the home page. Read once, when the app boots:
// a later client-side navigation to "/" leaves it false. On the server
// (prerendering) there's no window and HomePage only renders for "/", so the
// intro is always baked into the home page's HTML.
function bootedOnHome(): boolean {
  if (typeof window === "undefined") return true;
  const base = import.meta.env.BASE_URL.replace(/\/$/, "");
  const path = window.location.pathname.slice(base.length).replace(/\/+$/, "");
  return path === "";
}
let pending = bootedOnHome();

// Back to front, as they arrive. Each print is the photo inset in its mat;
// positions are the Figma layout relative to the stack's top-left corner.
const PRINTS = [
  { src: "/intro/photo-3.jpg", className: styles.print3 },
  { src: "/intro/photo-2.jpg", className: styles.print2 },
  { src: "/intro/photo-1.jpg", className: styles.print1 },
];

export default function HomeIntro() {
  // Read at first render so the client's hydration matches the server HTML.
  const [show, setShow] = useState(pending);

  // Only ever once per page load — coming back to home later skips it.
  useEffect(() => {
    pending = false;
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
        {PRINTS.map((p) => (
          <div key={p.src} className={`${styles.print} ${p.className}`}>
            <img
              className={styles.photo}
              src={withBasePath(p.src)}
              alt=""
              decoding="async"
              fetchPriority="high"
            />
          </div>
        ))}
      </div>
    </div>
  );
}
