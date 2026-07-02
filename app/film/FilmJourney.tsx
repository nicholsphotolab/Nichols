// FilmJourney.tsx
// Full-bleed "how your film moves through the lab" section on the film page.
// Each step (Drop Off / Development / Output / Delivery) is a full-viewport
// panel laid over its own photo with a dark scrim, plus a numbered step nav and
// a set of collapsible items.
//
// Scroll behaviour (YLLW-style stacking, pure CSS): each panel's photo is a
// sticky layer that pins at the top of the viewport while the panel's content
// scrolls past it in normal document flow — the text never freezes and moves
// at native scroll speed. Each panel then overlaps the next by one viewport
// (padding-bottom + negative margin), so the outgoing photo stays pinned while
// the next panel rises over it, its edge tracking the outgoing text 1:1. The
// only JS is the active-step highlight (useActiveStep).
//
// Only the "Drop Off" step is populated for now — the other three are scaffolded
// with empty `items` arrays so their content (and any CTAs) drop straight in
// later. Mirrors Figma node 1987:779.

"use client";

import {
  Fragment,
  useLayoutEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { withBasePath } from "../lib/basePath";
import styles from "./FilmJourney.module.css";

type AccordionItem = {
  id: string;
  title: string; // "Subheader 2" — shown collapsed and expanded
  body: string;
  // Optional extra block under the body (e.g. opening hours).
  extra?: ReactNode;
  // Optional call-to-action rendered below the body (e.g. download a form).
  cta?: { label: string; href: string; download?: boolean };
};

type JourneyStep = {
  key: string;
  label: string; // nav label
  heading: string; // big header
  intro: string; // "Medium Body" intro paragraph
  image: string; // full-bleed panel background photo
  items: AccordionItem[];
};

const STEPS: JourneyStep[] = [
  {
    key: "drop-off",
    label: "Drop off",
    heading: "Drop off",
    intro:
      "Come by the store and drop off your film, or mail it in from anywhere. However it gets to us, it's logged on arrival and developed in-house, with a fast turnaround and results you can count on.",
    image: "/FilmForm.webp",
    items: [
      {
        id: "in-store",
        title: "In-store drop-off",
        body:
          "Bring your rolls by during open hours. First-timers, come through the main entrance and we'll walk you through the film forms. Regulars, head to the pickup and drop-off door, fill out a form, and drop it in a film box.",
        extra: (
          <p className={styles.hours}>
            Open:
            <br />
            Monday&ndash;Friday
            <br />
            9am&ndash;5pm
          </p>
        ),
      },
      {
        id: "after-hours",
        title: "After hours film drop box",
        body:
          "Can't make our hours? No problem. There's a film drop box outside our building with forms right there, so you can fill one out and drop your film anytime. Just note that any account details will need to be set up by phone during open hours.",
      },
      {
        id: "mail-in",
        title: "Mail-in",
        body:
          "Not local? Mail your film from anywhere. Just print and fill out our mail-in form, pack it with your rolls, and ship it our way so we know exactly how you'd like everything done.",
        // TODO(mail-in-form): point href at the printable mail-in form once it's
        // ready (drop the file in /public and update this). Placeholder for now.
        cta: { label: "Download mail-in form", href: "#", download: true },
      },
    ],
  },
  // TODO: populate the remaining three steps — they follow the same shape.
  {
    key: "development",
    label: "Development",
    heading: "Development",
    intro: "",
    image: "/Develop.webp",
    items: [],
  },
  {
    key: "output",
    label: "Output",
    heading: "Output",
    intro: "",
    image: "/Output.webp",
    items: [],
  },
  {
    key: "delivery",
    label: "Delivery",
    heading: "Delivery",
    intro: "",
    image: "/Pickup.jpg",
    items: [],
  },
];

function Accordion({ items }: { items: AccordionItem[] }) {
  // All items start collapsed; opening removes the id from this set.
  const [collapsed, setCollapsed] = useState<Set<string>>(
    () => new Set(items.map((i) => i.id))
  );

  const toggle = (id: string) =>
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  // Dividers are rendered as standalone siblings (one after each item) so they
  // sit in the content column's 20px rhythm with even space above and below.
  return (
    <>
      {items.map((item) => {
        const open = !collapsed.has(item.id);
        return (
          <Fragment key={item.id}>
            <div className={styles.item}>
              <button
                className={styles.trigger}
                aria-expanded={open}
                aria-controls={`journey-${item.id}`}
                onClick={() => toggle(item.id)}
              >
                <span className={styles.itemTitle}>{item.title}</span>
                <span
                  className={`${styles.indicator} ${open ? styles.indicatorOpen : ""}`}
                  aria-hidden="true"
                >
                  ↓
                </span>
              </button>

              <div
                className={`${styles.body} ${open ? styles.bodyOpen : ""}`}
                id={`journey-${item.id}`}
              >
                <div className={styles.bodyInner}>
                  <div className={styles.bodyContent}>
                    <p className={styles.bodyText}>{item.body}</p>
                    {item.extra}
                    {item.cta && (
                      <a
                        className={`${styles.cta} reveal-on-hover`}
                        href={item.cta.href}
                        {...(item.cta.download ? { download: true } : {})}
                      >
                        {item.cta.label}
                        <span className="reveal-arrow" aria-hidden="true">
                          ↗
                        </span>
                      </a>
                    )}
                  </div>
                </div>
              </div>
            </div>
            <hr className={styles.divider} />
          </Fragment>
        );
      })}
    </>
  );
}

// Smooth-scroll to a panel.
function scrollToStep(key: string) {
  document
    .getElementById(`film-step-${key}`)
    ?.scrollIntoView({ behavior: "smooth" });
}

// Document Y of an element's top, summed via offsetTop — unaffected by sticky
// positioning (unlike getBoundingClientRect), so it gives a stable pin start.
function getDocTop(el: HTMLElement | null): number {
  let y = 0;
  let node: HTMLElement | null = el;
  while (node) {
    y += node.offsetTop;
    node = node.offsetParent as HTMLElement | null;
  }
  return y;
}

// Drives the stacking scroll. Each panel is sticky at top:0 (so the next panel
// Tracks which panel is front-most, for the step-nav highlight. All the
// stacking motion itself is pure CSS — sticky pinned photos, in-flow content,
// and a negative-margin overlap for the handoff (see FilmJourney.module.css) —
// so the scroll is native-smooth with no JS transforms to jitter.
//
// A passive scroll listener (rAF-throttled) tracks the scroll position, and a
// ResizeObserver re-measures the panel offsets when accordions open/close
// (they change every later panel's position).
function useActiveStep(count: number, onActive: (i: number) => void) {
  const panelRefs = useRef<(HTMLElement | null)[]>([]);
  const docTops = useRef<number[]>([]);
  const onActiveRef = useRef(onActive);
  onActiveRef.current = onActive;

  useLayoutEffect(() => {
    let lastActive = -1;

    const apply = (scroll: number) => {
      // Active step = the last panel that has risen to cover ~half the
      // viewport. Its doc top reaching the scroll position is where it's
      // fully in place; it covers half a viewport before that, so switch
      // the highlight then.
      const half = window.innerHeight * 0.5;
      let active = 0;
      for (let i = 0; i < count; i++) {
        if (scroll >= (docTops.current[i] || 0) - half) active = i;
      }
      if (active !== lastActive) {
        lastActive = active;
        onActiveRef.current(active);
      }
    };

    const measure = () => {
      for (let i = 0; i < count; i++) {
        docTops.current[i] = getDocTop(panelRefs.current[i]);
      }
      apply(window.scrollY);
    };

    measure();

    const ro = new ResizeObserver(() => measure());
    panelRefs.current.forEach((el) => el && ro.observe(el));
    window.addEventListener("resize", measure);

    let raf = 0;
    const onScroll = () => {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = 0;
        apply(window.scrollY);
      });
    };
    window.addEventListener("scroll", onScroll, { passive: true });

    return () => {
      if (raf) cancelAnimationFrame(raf);
      ro.disconnect();
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", measure);
    };
  }, [count]);

  return { panelRefs };
}

export default function FilmJourney() {
  const [active, setActive] = useState(0);
  const { panelRefs } = useActiveStep(STEPS.length, setActive);

  return (
    <section className={styles.section} aria-label="How your film moves through the lab">
      {/* One persistent step nav, pinned across all four panels (sticky, on top
          of the photos). The active label tracks the panel currently in front. */}
      <div className={styles.navOverlay}>
        <nav className={styles.steps} aria-label="Film journey steps">
          {STEPS.map((s, i) => (
            <button
              key={s.key}
              className={styles.stepBtn}
              data-active={i === active || undefined}
              aria-current={i === active ? "step" : undefined}
              onClick={() => scrollToStep(s.key)}
            >
              <span className={styles.stepNum}>{i + 1}.</span>
              {s.label}
            </button>
          ))}
        </nav>
      </div>

      {STEPS.map((step, idx) => (
        <article
          key={step.key}
          ref={(el) => {
            panelRefs.current[idx] = el;
          }}
          id={`film-step-${step.key}`}
          className={styles.panel}
          aria-label={`Step ${idx + 1}: ${step.label}`}
        >
          {/* Sticky rail spanning the whole panel; the photo inside pins at
              the top of the viewport until the next panel covers it. */}
          <div className={styles.bgWrap} aria-hidden="true">
            <div
              className={styles.bg}
              style={{ backgroundImage: `url("${withBasePath(step.image)}")` }}
            >
              <div className={styles.scrim} />
            </div>
          </div>

          <div className={styles.grid}>
            {/* Right: this step's content, scrolling in normal flow past
                the pinned photo. */}
            <div className={styles.content}>
              <div className={styles.headGroup}>
                <h2 className={styles.heading}>{step.heading}</h2>
                {step.intro && <p className={styles.intro}>{step.intro}</p>}
              </div>
              <hr className={styles.divider} />
              {step.items.length > 0 ? (
                <Accordion items={step.items} />
              ) : (
                <p className={styles.placeholder}>Coming soon.</p>
              )}
            </div>
          </div>
        </article>
      ))}
    </section>
  );
}
