// useScrollRestoration.ts
// Where the window should be scrolled to after a page change.
//
//   - Following a link to another page starts at the top (or at the link's
//     #anchor, if it has one).
//   - Back / Forward return to wherever that page was left.
//   - A reload keeps its place.
//   - Moving within a page (an in-page #anchor) is left to the browser.
//
// React Router's own <ScrollRestoration> only works with its data routers;
// this app uses <BrowserRouter>, so it's done here. Positions are kept per
// history entry (React Router's location.key) in sessionStorage, which lasts
// as long as the tab and survives a reload. The browser's own restoration is
// switched off so it doesn't fight this — it would restore before the new
// page has rendered.
//
// On a page change, keyboard focus also moves to the new page's <main>, so a
// screen reader isn't left on a link that's no longer there.

import { useEffect, useLayoutEffect, useRef } from "react";
import { useLocation, useNavigationType, type Location } from "react-router-dom";

const STORE_KEY = "nichols:scroll";

// How long a restore keeps trying while the page grows tall enough to reach
// the saved spot (late images, fonts). About half a second.
const RESTORE_FRAMES = 30;

function load(): Record<string, number> {
  try {
    return JSON.parse(sessionStorage.getItem(STORE_KEY) ?? "{}");
  } catch {
    return {};
  }
}

function save(positions: Record<string, number>) {
  try {
    sessionStorage.setItem(STORE_KEY, JSON.stringify(positions));
  } catch {
    // Private mode or storage full — Back just won't remember the spot.
  }
}

// "default" is the key of the very first entry (and of any entry whose state
// something else wiped); fall back to the path so those still get a slot.
const entryKey = (location: Location) =>
  location.key !== "default" ? location.key : `path:${location.pathname}`;

export function useScrollRestoration() {
  const location = useLocation();
  const navigationType = useNavigationType();

  const positions = useRef<Record<string, number> | null>(null);
  const currentKey = useRef(entryKey(location));
  const lastPath = useRef<string | null>(null);
  const restoring = useRef(0);

  // Take restoration over from the browser.
  useEffect(() => {
    if (!("scrollRestoration" in window.history)) return;
    const previous = window.history.scrollRestoration;
    window.history.scrollRestoration = "manual";
    return () => {
      window.history.scrollRestoration = previous;
    };
  }, []);

  // Record the current entry's position as the page is scrolled — in memory
  // on every frame, to storage when the page is hidden or left.
  useEffect(() => {
    positions.current ??= load();
    let frame = 0;
    const record = () => {
      frame = 0;
      positions.current![currentKey.current] = window.scrollY;
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(record);
    };
    const persist = () => {
      record();
      save(positions.current!);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("pagehide", persist);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("pagehide", persist);
      if (frame) cancelAnimationFrame(frame);
    };
  }, []);

  // Before paint on every navigation: point recording at the new entry, then
  // put the window where it belongs.
  useLayoutEffect(() => {
    positions.current ??= load();
    const previousKey = currentKey.current;
    const key = entryKey(location);
    const previousPath = lastPath.current;

    // The page being left keeps the spot it was at.
    if (previousPath !== null && previousKey !== key) {
      save(positions.current);
    }
    currentKey.current = key;
    lastPath.current = location.pathname;

    cancelAnimationFrame(restoring.current);
    const saved = positions.current[key];

    const restore = (y: number) => {
      let tries = 0;
      const attempt = () => {
        window.scrollTo(0, y);
        if (Math.abs(window.scrollY - y) > 1 && tries++ < RESTORE_FRAMES) {
          restoring.current = requestAnimationFrame(attempt);
        }
      };
      attempt();
    };

    // First load (including a reload): the prerendered page is already
    // showing, so only step in to put a reload back where it was.
    if (previousPath === null) {
      if (navigationType === "POP" && saved != null) restore(saved);
      return;
    }

    // Same page — an in-page #anchor. The browser has already handled it.
    if (previousPath === location.pathname) return;

    if (navigationType === "POP") {
      if (saved != null) restore(saved);
      else window.scrollTo(0, 0);
    } else {
      const target = location.hash
        ? document.getElementById(decodeURIComponent(location.hash.slice(1)))
        : null;
      if (target) target.scrollIntoView();
      else window.scrollTo(0, 0);
    }

    document.getElementById("main")?.focus({ preventScroll: true });
    // Runs once per history entry; the other values are read at that moment.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.key]);

  // A user scroll during a restore wins.
  useEffect(() => {
    const stop = () => cancelAnimationFrame(restoring.current);
    window.addEventListener("wheel", stop, { passive: true });
    window.addEventListener("touchstart", stop, { passive: true });
    window.addEventListener("keydown", stop);
    return () => {
      window.removeEventListener("wheel", stop);
      window.removeEventListener("touchstart", stop);
      window.removeEventListener("keydown", stop);
    };
  }, []);
}
