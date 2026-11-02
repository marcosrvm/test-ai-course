import type { MouseEventHandler, ReactNode } from "react";

// v2: a link that leaves the prototype opens in a new tab and is marked with "↗".
// Without `external` it is a plain link (the originals keep the live behaviour).
export function SuLink({
  href,
  external = false,
  className,
  onClick,
  children,
}: {
  href: string;
  external?: boolean;
  className?: string;
  onClick?: MouseEventHandler<HTMLAnchorElement>;
  children: ReactNode;
}) {
  if (!external) {
    return (
      <a href={href} className={className} onClick={onClick}>
        {children}
      </a>
    );
  }
  return (
    <a href={href} className={className} onClick={onClick} target="_blank" rel="noreferrer">
      {children}
      <span className="su-ext" aria-hidden="true">
        ↗
      </span>
      <span className="su-sr-only"> (öffnet in neuem Tab)</span>
    </a>
  );
}
