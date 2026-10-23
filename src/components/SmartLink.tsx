// Drop-in replacement for next/link. next/link transparently handled both
// internal routes (basePath-aware client navigation) and external/absolute
// URLs (plain anchor behavior); react-router-dom's <Link> only does the
// former; it would misinterpret an absolute URL as an internal path and try
// to route to it. This picks the right element based on the href, so every
// call site can keep using `href=` unchanged.
import { Link as RouterLink, type LinkProps as RouterLinkProps } from "react-router-dom";
import type { Ref } from "react";

type SmartLinkProps = Omit<RouterLinkProps, "to"> & {
  href: string;
  ref?: Ref<HTMLAnchorElement>;
};

function isExternal(href: string): boolean {
  return /^([a-z][a-z0-9+.-]*:)?\/\//i.test(href) || /^(mailto|tel):/i.test(href);
}

export default function SmartLink({ href, ref, ...rest }: SmartLinkProps) {
  if (isExternal(href)) {
    return <a ref={ref} href={href} {...rest} />;
  }
  return <RouterLink ref={ref} to={href} {...rest} />;
}
