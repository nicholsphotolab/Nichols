// FilmJourney.tsx
// Full-bleed "how your film moves through the lab" section on the film page.
// Each step (Drop Off / Development / Output / Delivery) is a full-viewport
// panel laid over its own photo with a dark scrim, plus a numbered step nav and
// a set of collapsible items.
//
// Scroll behaviour (YLLW-style stacking): the panels are sticky-piled at the top
// of the viewport, so as you scroll each panel rises up and overtakes the one
// before it. Each panel's photo, scrim, and text move together as a single
// unit as it's scrolled through — see useStackingScroll for how that motion
// and the next panel's rise stay in sync. The overflow is measured live, so
// opening/closing an item recomputes the scroll length automatically.
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
      next.has(id) ? next.delete(id) : next.add(id);
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

// Smooth-scroll to a panel. Uses the page's Lenis instance when present so the
// jump matches the site's smooth scrolling; falls back to native scrollIntoView.
function scrollToStep(key: string) {
  const el = document.getElementById(`film-step-${key}`);
  if (!el) return;
  const lenis = (window as unknown as { __lenis?: { scrollTo: (t: Element) => void } }).__lenis;
  if (lenis?.scrollTo) lenis.scrollTo(el);
  else el.scrollIntoView({ behavior: "smooth" });
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
// rises over it). Photo, scrim, and text live together in one `.panelInner`
// wrapper that moves as a single unit ("outgoing" motion) — when a panel's
// content is taller than its viewport area, the spacer after it adds that
// much extra scroll, and during that distance panelInner (photo included)
// translates up by the scroll delta, panning the photo in sync with the text
// rather than leaving it frozen behind a separately-scrolling text column.
// panelInner is sized taller than the panel by exactly that overflow (set
// inline below) so translating it up never exposes a gap at the bottom.
//
// The next panel's rise is *not* deferred until that outgoing motion finishes.
// Native sticky/flow would only reveal it during the trailing one-viewport
// stretch of the spacer, so a panel with a lot of overflow content gets a long
// "content has settled, nothing on screen is moving" wait before the next
// panel appears. Instead each panel gets a small corrective lift during its
// pre-arrival phase, proportional to how much of the *previous* panel's span
// was padding beyond one viewport — pulling its rise earlier so it grows
// concurrently with the outgoing motion instead of only after it.
//
// A rAF loop reads the current scroll each frame (robust to Lenis suppressing
// native scroll events), and a ResizeObserver recomputes the overflow when
// accordions open/close.
function useStackingScroll(count: number, onActive: (i: number) => void) {
  const panelRefs = useRef<(HTMLElement | null)[]>([]);
  const innerRefs = useRef<(HTMLDivElement | null)[]>([]);
  const gridRefs = useRef<(HTMLDivElement | null)[]>([]);
  const contentRefs = useRef<(HTMLDivElement | null)[]>([]);
  const spacerRefs = useRef<(HTMLDivElement | null)[]>([]);
  const overflows = useRef<number[]>([]);
  const spans = useRef<number[]>([]); // one viewport + this panel's overflow
  const pinStarts = useRef<number[]>([]);
  const onActiveRef = useRef(onActive);
  onActiveRef.current = onActive;

  useLayoutEffect(() => {
    let lastActive = -1;

    const getScroll = () => {
      const lenis = (window as unknown as { __lenis?: { scroll?: number } }).__lenis;
      return lenis?.scroll ?? window.scrollY;
    };

    const apply = (scroll: number) => {
      // Outgoing: photo + text move together, translating up through the
      // panel's own content overflow, starting the moment it becomes active.
      for (let i = 0; i < count; i++) {
        const inner = innerRefs.current[i];
        if (!inner) continue;
        const ov = overflows.current[i] || 0;
        const start = pinStarts.current[i] || 0;
        const delta = ov > 0 ? Math.min(Math.max(scroll - start, 0), ov) : 0;
        inner.style.transform = delta ? `translate3d(0, ${-delta}px, 0)` : "";
      }

      // Incoming rise: pull panel i up early, in proportion to how much of
      // the *previous* panel's span was overflow padding, so the two panels'
      // motion reads as one continuous scroll instead of "settle, then swap."
      // No-op once panel i has reached its own pin start (native sticky takes
      // over from there), and a no-op entirely when the previous panel had no
      // overflow (its span is exactly one viewport, so the native reveal is
      // already concurrent).
      for (let i = 1; i < count; i++) {
        const panel = panelRefs.current[i];
        if (!panel) continue;
        const prevOverflow = overflows.current[i - 1] || 0;
        const prevSpan = spans.current[i - 1] || 1;
        const d = Math.max((pinStarts.current[i] || 0) - scroll, 0);
        const lift = d * (prevOverflow / prevSpan);
        panel.style.transform = lift > 0.5 ? `translate3d(0, ${-lift}px, 0)` : "";
      }

      // Active step = the last panel that has risen to cover ~half the viewport.
      // Its pin start is where it fully pins (top of viewport); it covers half
      // a viewport before that, so switch the highlight then.
      const half = window.innerHeight * 0.5;
      let active = 0;
      for (let i = 0; i < count; i++) {
        if (scroll >= (pinStarts.current[i] || 0) - half) active = i;
      }
      if (active !== lastActive) {
        lastActive = active;
        onActiveRef.current(active);
      }
    };

    const measure = () => {
      const vh = window.innerHeight;
      for (let i = 0; i < count; i++) {
        const panel = panelRefs.current[i];
        const inner = innerRefs.current[i];
        const grid = gridRefs.current[i];
        const content = contentRefs.current[i];
        const spacer = spacerRefs.current[i];
        if (!panel || !inner || !grid || !content || !spacer) continue;

        // Available height = the panel's own height minus the grid's
        // top/bottom padding (read live so this stays correct across the
        // responsive breakpoints, which use different padding values).
        const gridStyle = getComputedStyle(grid);
        const padding =
          (parseFloat(gridStyle.paddingTop) || 0) +
          (parseFloat(gridStyle.paddingBottom) || 0);
        const available = panel.clientHeight - padding;
        const realOverflow = Math.max(0, content.scrollHeight - available);

        overflows.current[i] = realOverflow;
        spans.current[i] = vh + realOverflow;
        spacer.style.height = `${realOverflow}px`;
        inner.style.height = `${panel.clientHeight + realOverflow}px`;
      }
      for (let i = 0; i < count; i++) {
        pinStarts.current[i] = getDocTop(panelRefs.current[i]);
      }
      apply(getScroll());
    };

    measure();

    const ro = new ResizeObserver(() => measure());
    contentRefs.current.forEach((el) => el && ro.observe(el));
    window.addEventListener("resize", measure);

    let rafId = 0;
    let last = -1;
    const tick = () => {
      const sc = getScroll();
      if (sc !== last) {
        last = sc;
        apply(sc);
      }
      rafId = requestAnimationFrame(tick);
    };
    rafId = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(rafId);
      ro.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, [count]);

  return { panelRefs, innerRefs, gridRefs, contentRefs, spacerRefs };
}

export default function FilmJourney() {
  const [active, setActive] = useState(0);
  const { panelRefs, innerRefs, gridRefs, contentRefs, spacerRefs } = useStackingScroll(
    STEPS.length,
    setActive
  );

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
        <Fragment key={step.key}>
          <article
            ref={(el) => {
              panelRefs.current[idx] = el;
            }}
            id={`film-step-${step.key}`}
            className={styles.panel}
            aria-label={`Step ${idx + 1}: ${step.label}`}
          >
            {/* Photo, scrim, and text share one wrapper so they translate
                together as the scroll hook pans the panel — see .panelInner. */}
            <div
              className={styles.panelInner}
              ref={(el) => {
                innerRefs.current[idx] = el;
              }}
            >
              <div
                className={styles.bg}
                style={{ backgroundImage: `url("${withBasePath(step.image)}")` }}
                aria-hidden="true"
              />
              <div className={styles.scrim} aria-hidden="true" />

              <div
                className={styles.grid}
                ref={(el) => {
                  gridRefs.current[idx] = el;
                }}
              >
                <div
                  className={styles.content}
                  ref={(el) => {
                    contentRefs.current[idx] = el;
                  }}
                >
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
            </div>
          </article>

          {/* Spacer adds the extra scroll distance equal to this panel's content
              overflow; height is set by the scroll hook. */}
          <div
            className={styles.spacer}
            aria-hidden="true"
            ref={(el) => {
              spacerRefs.current[idx] = el;
            }}
          />
        </Fragment>
      ))}
    </section>
  );
}
