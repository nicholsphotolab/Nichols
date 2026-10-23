// Drop-in replacement for next/image. next.config.js had image optimization
// disabled (`unoptimized: true`, required for static export) everywhere this
// site used it, so there's no optimization behavior to replicate — every
// usage in this codebase passes `fill`, so that's the only prop given real
// treatment; the rest are accepted and ignored so call sites didn't need to
// change.
import type { CSSProperties, ImgHTMLAttributes } from "react";

type ImageProps = ImgHTMLAttributes<HTMLImageElement> & {
  fill?: boolean;
  priority?: boolean;
  sizes?: string;
  quality?: number;
};

export default function Image({
  fill,
  priority,
  sizes: _sizes,
  quality: _quality,
  style,
  ...rest
}: ImageProps) {
  const fillStyle: CSSProperties | undefined = fill
    ? { position: "absolute", inset: 0, width: "100%", height: "100%" }
    : undefined;

  return (
    <img
      loading={priority ? "eager" : "lazy"}
      fetchPriority={priority ? "high" : undefined}
      style={{ ...fillStyle, ...style }}
      {...rest}
    />
  );
}
