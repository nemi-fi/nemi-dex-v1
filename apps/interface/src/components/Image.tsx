import type { ImgHTMLAttributes } from "react";

export interface ImageProps extends ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  alt: string;
  /** Stretch the image over its positioned parent */
  fill?: boolean;
  /** Load eagerly with high priority (above-the-fold images) */
  priority?: boolean;
  /** Ignored. Kept for compatibility with `next/image` usages */
  quality?: number;
}

/** A plain `<img>` with the subset of the `next/image` API this app uses */
export default function Image({
  fill,
  priority,
  quality: _quality,
  style,
  ...props
}: ImageProps) {
  return (
    <img
      loading={priority ? "eager" : "lazy"}
      fetchPriority={priority ? "high" : undefined}
      decoding="async"
      style={
        fill
          ? {
              position: "absolute",
              inset: 0,
              width: "100%",
              height: "100%",
              ...style,
            }
          : style
      }
      {...props}
    />
  );
}
