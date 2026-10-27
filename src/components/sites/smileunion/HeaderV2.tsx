"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { SiteHeader } from "./SiteHeader";
import { asset, headerV2, links, navV2 } from "./content";

const CLOSE_DELAY = 250;

const menuGroups = headerV2.groups.map((group) =>
  group.flatMap((label) => navV2.filter((item) => item.label === label)),
);

// Desktop (>= 1200px): menu button left, logo centred, equal-width notice column right.
// Below 1200px the existing SiteHeader is rendered unchanged, with v2 links,
// under a fixed student-project notice bar.
export function HeaderV2() {
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  // A hover only previews the menu; a click pins it open until closed explicitly.
  const pinned = useRef(false);

  const cancelClose = () => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    closeTimer.current = null;
  };

  const close = () => {
    cancelClose();
    pinned.current = false;
    setOpen(false);
  };

  useEffect(() => {
    if (!open) return;
    const dismiss = () => {
      if (closeTimer.current) clearTimeout(closeTimer.current);
      pinned.current = false;
      setOpen(false);
    };
    const onPointerDown = (event: PointerEvent) => {
      if (!menuRef.current?.contains(event.target as Node)) dismiss();
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        dismiss();
        buttonRef.current?.focus();
      }
    };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  useEffect(() => cancelClose, []);

  const onToggle = () => {
    cancelClose();
    if (open && !pinned.current) {
      pinned.current = true;
      return;
    }
    pinned.current = !open;
    setOpen(!open);
  };

  return (
    <div className="su-header-v2">
      <SiteHeader homeHref={links.homeV2} navItems={navV2} />

      <header className="su-header su-header-desktop">
        <div className="su-container">
          <div className="su-header-v2-inner">
            <div
              ref={menuRef}
              className="su-v2-menu"
              onMouseEnter={() => {
                cancelClose();
                setOpen(true);
              }}
              onMouseLeave={() => {
                if (pinned.current) return;
                cancelClose();
                closeTimer.current = setTimeout(() => setOpen(false), CLOSE_DELAY);
              }}
              onBlur={(event) => {
                if (!menuRef.current?.contains(event.relatedTarget as Node | null)) close();
              }}
            >
              <button
                ref={buttonRef}
                type="button"
                className="su-v2-menu-button"
                aria-expanded={open}
                aria-controls="su-v2-menu-panel"
                onClick={onToggle}
              >
                <span className="su-icon" aria-hidden="true">
                  {""}
                </span>
                {headerV2.menu}
              </button>

              {/* Stays mounted so it can animate; closed = visibility: hidden (not focusable). */}
              <nav id="su-v2-menu-panel" className="su-v2-menu-panel" data-open={open}>
                {menuGroups.map((group) => (
                  <ul key={group[0].label}>
                    {group.map((item) => (
                      <li key={item.label}>
                        <a href={item.href} onClick={close}>
                          <span className="su-v2-menu-label">{item.label}</span>
                          <span className="su-v2-menu-arrow" aria-hidden="true">
                            →
                          </span>
                        </a>
                      </li>
                    ))}
                  </ul>
                ))}
              </nav>
            </div>

            <a href={links.homeV2} className="su-logo">
              <Image src={asset("images/logo.svg")} alt="smileunion GmbH" width={300} height={57} priority />
            </a>

            <div className="su-v2-notice">{headerV2.notice}</div>
          </div>
        </div>
      </header>

      {/* Shown below the desktop breakpoint instead of the header notice. */}
      <div className="su-v2-notice-bar">{headerV2.notice}</div>
    </div>
  );
}
