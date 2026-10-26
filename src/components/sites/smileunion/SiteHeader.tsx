"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { asset, links, nav } from "./content";

export function SiteHeader({ homeHref = links.home, navItems = nav }: { homeHref?: string; navItems?: typeof nav }) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <header className="su-header">
      <div className="su-container">
        <div className="su-header-inner">
          <a href={homeHref} className="su-logo">
            <Image src={asset("images/logo.svg")} alt="smileunion GmbH" width={300} height={57} priority />
          </a>

          <button
            type="button"
            className="su-menu-toggle su-menu-open"
            aria-expanded={open}
            aria-controls="su-main-menu"
            onClick={() => setOpen(true)}
          >
            <span className="su-sr-only">Menü öffnen</span>
            <span className="su-icon" aria-hidden="true">
              {""}
            </span>
          </button>

          <nav id="su-main-menu" className="su-menu" data-open={open}>
            <button type="button" className="su-menu-toggle su-menu-close" onClick={() => setOpen(false)}>
              <span className="su-sr-only">Menü schließen</span>
              <span className="su-icon" aria-hidden="true">
                {""}
              </span>
            </button>
            <ul>
              {navItems.map((item) => (
                <li key={item.label}>
                  <a href={item.href} onClick={() => setOpen(false)}>
                    {item.label}
                  </a>
                </li>
              ))}
              <li className="su-menu-cta">
                <a href={links.start}>Jetzt starten</a>
              </li>
            </ul>
          </nav>

          <a href={links.start} className="su-header-cta">
            Jetzt starten
          </a>
        </div>
      </div>
    </header>
  );
}
