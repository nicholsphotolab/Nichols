// ServicesIndex.tsx
// Homepage index of the four services: a label above an image at the
// site-wide --image-ratio. Each card links to its service page. On hover the
// other cards' images desaturate (same treatment as the film stocks grid).
// A card can carry a silent preview clip instead of a still (e.g. Video's Hi8
// tape): it shows its poster frame at rest and plays while hovered/focused,
// resetting when the pointer leaves. Client component only for those
// play/pause handlers.


import Link from "@/components/SmartLink";
import Image from "@/components/Image";
import { useRef } from "react";
import { withBasePath } from "@/lib/basePath";
import styles from "./ServicesIndex.module.css";
import { prefersReducedMotion } from "@/lib/media";

type Service = {
  label: string;
  href: string;
  image?: string;
  // Optional muted preview clip; `image` doubles as its poster frame.
  video?: string;
};

const SERVICES: Service[] = [
  { label: "Film", href: "/film", image: "/Film.webp" },
  { label: "Prints", href: "/prints" },
  {
    label: "Video",
    href: "/video",
    image: "/VIDEO/Hi8-Poster.jpg",
    video: "/VIDEO/Hi8.mp4",
  },
  { label: "Passport", href: "/passport" },
];

function ServiceCard({ service }: { service: Service }) {
  const videoRef = useRef<HTMLVideoElement | null>(null);

  // Hover/focus starts the clip (first hover also triggers its lazy fetch —
  // preload="none" keeps 5.5MB off the initial page load). Reduced-motion
  // users keep the still poster frame.
  const play = () => {
    if (prefersReducedMotion()) return;
    videoRef.current?.play().catch(() => {
      // Autoplay can be blocked (e.g. low-power mode); the poster shows instead.
    });
  };

  const stop = () => {
    const video = videoRef.current;
    if (!video) return;
    video.pause();
    video.currentTime = 0;
  };

  return (
    <li className={styles.card}>
      <Link
        href={service.href}
        className={styles.link}
        onMouseEnter={service.video ? play : undefined}
        onMouseLeave={service.video ? stop : undefined}
        onFocus={service.video ? play : undefined}
        onBlur={service.video ? stop : undefined}
      >
        <span className={styles.label}>{service.label}</span>
        <span className={styles.image}>
          {service.video ? (
            <video
              ref={videoRef}
              src={withBasePath(service.video)}
              poster={service.image ? withBasePath(service.image) : undefined}
              muted
              playsInline
              loop
              preload="none"
              aria-hidden="true"
              tabIndex={-1}
            />
          ) : (
            service.image && (
              <Image
                src={withBasePath(service.image)}
                alt=""
                fill
                sizes="(max-width: 900px) 50vw, 25vw"
              />
            )
          )}
        </span>
      </Link>
    </li>
  );
}

export default function ServicesIndex() {
  return (
    <section className={styles.section} aria-label="Services">
      <ul className={styles.grid}>
        {SERVICES.map((s) => (
          <ServiceCard key={s.href} service={s} />
        ))}
      </ul>
    </section>
  );
}
