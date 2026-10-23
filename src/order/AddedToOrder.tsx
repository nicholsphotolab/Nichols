// AddedToOrder.tsx
// The confirmation toast raised by a configurator's "Add to order" button —
// Figma node 2512:1725: a white band holding the product shot of what was just
// added, the ADDED TO ORDER label, and a VIEW CART ↗ link into the drawer.
// It slides up from the bottom of the viewport and fades out on its own.
//
// There is only ever ONE toast. Repeat adds coalesce into the one already on
// screen rather than stacking or queueing behind it: the commonest multi-add
// here is the same roll added three or four times in a row at the counter, so a
// stack would be three identical bands climbing over the configurator the
// customer is still using, and a queue would deliver the last confirmation
// seconds after they'd stopped clicking. Instead the toast re-arms and plays a
// short nudge — a silent content swap reads as nothing having happened, and the
// nudge is what says "that one registered too".
//
// The configurators supply `note` (a fresh sentence per add, since it carries
// the running item count) and never clear it — this component owns the whole
// visible lifecycle, because dismissal has to answer to the pointer and only
// the toast knows where the pointer is:
//
//   in  → hold 3s → fade out
//   another add → nudge, hold restarts from 3s
//   hovered (or focused) at any point, including mid-fade → hold indefinitely
//   pointer leaves → 2s, restarted on every leave → fade out
//
// The note also stays as the live region's content, visually hidden: "added to
// order" alone doesn't say what was added or how much is now in the order, and
// the thumbnail can't carry that. The region is mounted whether or not there's
// a note — one added and filled in the same tick is announced unreliably.


import { useEffect, useRef, useState } from "react";
import Image from "@/components/Image";
import { withBasePath } from "@/lib/basePath";
import styles from "./AddedToOrder.module.css";

/** Untouched, the toast holds this long before it starts to go. */
const HOLD_MS = 3000;
/** Once it has been hovered, every departure of the pointer buys this long. */
const HOVER_GRACE_MS = 2000;
/** Must match the opacity transition on .band in the stylesheet. */
const FADE_MS = 260;

export default function AddedToOrder({
  note,
  image,
  onViewCart,
}: {
  /** The spoken confirmation. A new string raises or re-arms the toast; the
      configurators leave it set, so this never has to be cleared upstream. */
  note: string | null;
  /** Product shot of the item that was added — null shows the placeholder
      block, matching the gallery's convention for formats without one. */
  image: string | null;
  /** Opens the cart drawer. */
  onViewCart: () => void;
}) {
  const [visible, setVisible] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const [held, setHeld] = useState(false);

  // Alternates so the nudge keyframes actually restart. Two identically-shaped
  // animations under different names is the reliable way to replay one: the
  // browser only restarts an animation when its name changes, so re-setting the
  // same value would do nothing on the second add. null = no nudge, which is
  // the state a fresh toast enters in (it gets the entrance instead).
  const [nudge, setNudge] = useState<"a" | "b" | null>(null);

  // Bumped on every add so the countdown effect below re-runs. Without it a
  // repeat add during the hold changes none of that effect's other inputs, and
  // the toast would still dismiss 3s after the *first* add.
  const [cycle, setCycle] = useState(0);

  // Whether the pointer has been over this toast during this showing. Once it
  // has, the countdown switches to the shorter post-hover grace — the customer
  // has already read it, so the full hold would just be in the way.
  const wasHeld = useRef(false);

  // Mirrors `visible` for the effect below, which must know whether a toast was
  // already up *before* this add without taking `visible` as a dependency (that
  // would re-run it on its own state changes).
  const onScreen = useRef(false);

  useEffect(() => {
    if (!note) {
      setVisible(false);
      setLeaving(false);
      setNudge(null);
      onScreen.current = false;
      return;
    }

    // Already up — coalesce: acknowledge with a nudge instead of a second band.
    // Mid-fade counts as up, so an add during the fade pulls it back to full
    // opacity (the transition reverses cleanly) and nudges, rather than
    // restarting the entrance from off-screen.
    setNudge(onScreen.current ? (n) => (n === "a" ? "b" : "a") : null);

    wasHeld.current = false;
    onScreen.current = true;
    setHeld(false);
    setLeaving(false);
    setVisible(true);
    setCycle((c) => c + 1);
  }, [note]);

  // The countdown. Held cancels it outright; the dependencies on `held` and
  // `cycle` are what restart it — every pointer departure and every repeat add
  // re-runs this and lays down a fresh timer rather than resuming a remainder.
  useEffect(() => {
    if (!visible || held) return;
    const t = window.setTimeout(
      () => setLeaving(true),
      wasHeld.current ? HOVER_GRACE_MS : HOLD_MS
    );
    return () => window.clearTimeout(t);
  }, [visible, held, cycle]);

  // Unmount once the fade has played out.
  useEffect(() => {
    if (!leaving) return;
    const t = window.setTimeout(() => {
      setVisible(false);
      setNudge(null);
      onScreen.current = false;
    }, FADE_MS);
    return () => window.clearTimeout(t);
  }, [leaving]);

  // Pointer or keyboard focus both hold it. Clearing `leaving` pulls it back if
  // the fade had already started — the customer reaching for it is the clearest
  // possible signal they aren't done with it.
  function hold() {
    wasHeld.current = true;
    setHeld(true);
    setLeaving(false);
  }

  function release() {
    setHeld(false);
  }

  return (
    <div className={styles.wrapper}>
      <p className={styles.note} role="status">
        {note}
      </p>

      {visible && (
        // Two elements on purpose: the anchor owns the fixed position, the
        // entrance and the exit, while the band owns the surface and the nudge.
        // Keeping them apart means the nudge's transform can't fight the
        // anchor's centring translate, and re-arming never disturbs the
        // entrance mid-flight.
        <div
          className={styles.anchor}
          data-leaving={leaving || undefined}
          onMouseEnter={hold}
          onMouseLeave={release}
          onFocus={hold}
          onBlur={release}
        >
          <div className={styles.band} data-nudge={nudge ?? undefined}>
            <div className={styles.product}>
              <span className={styles.thumb} aria-hidden="true">
                {image ? (
                  <Image
                    src={withBasePath(image)}
                    alt=""
                    width={32}
                    height={32}
                    className={styles.thumbImg}
                  />
                ) : (
                  <span className={styles.thumbFill} />
                )}
              </span>
              <span className={styles.label}>Added to order</span>
            </div>

            {/* A button, not a link — the cart is a drawer on this page, not a
                route. aria-hidden on the glyph keeps it out of the name. */}
            <button
              type="button"
              className={styles.link}
              onClick={onViewCart}
              aria-haspopup="dialog"
            >
              View cart <span aria-hidden="true">↗</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
