"use client";

import { useState } from "react";
import type { FormEvent } from "react";
import { footer, footerNavV2, links, type NavItem } from "./content";
import { SuLink } from "./SuLink";

// v2: own pages stay inside the prototype, live-site links open in a new tab.
export function SiteFooter({ v2 = false }: { v2?: boolean }) {
  const navItems: NavItem[] = v2 ? footerNavV2 : footer.nav;
  const [status, setStatus] = useState<string | null>(null);

  // The source posts to Shopify's customer endpoint; this clone has no backend yet.
  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setStatus("Danke! Deine Anmeldung wurde vorgemerkt.");
    event.currentTarget.reset();
  };

  return (
    <footer className="su-footer">
      <div className="su-container">
        <div className="su-footer-top">
          <div>
            <h2>{footer.navTitle}</h2>
            <ul className="su-footer-nav">
              {navItems.map((item) => (
                <li key={item.label}>
                  <SuLink href={item.href} external={item.external}>
                    {item.label}
                  </SuLink>
                </li>
              ))}
            </ul>
          </div>

          <div className="su-footer-newsletter">
            <div>
              <h2>{footer.newsletterTitle}</h2>
              <form onSubmit={onSubmit}>
                <div className="su-newsletter-group">
                  <input name="email" type="email" placeholder="Email" aria-label="Email" required />
                  <button type="submit">Senden</button>
                </div>
                <label className="su-consent">
                  <input type="checkbox" name="consent" required />
                  {footer.consent}
                </label>
                {status && (
                  <p className="su-newsletter-status" role="status">
                    {status}
                  </p>
                )}
              </form>
            </div>
            <div className="su-social">
              <a href={links.instagram} title="Instagram" target="_blank" rel="noreferrer">
                <span className="su-icon su-icon-brand" aria-hidden="true">
                  {""}
                </span>
                <span className="su-sr-only">Instagram</span>
              </a>
              <a href={links.facebook} title="Facebook" target="_blank" rel="noreferrer">
                <span className="su-icon su-icon-brand" aria-hidden="true">
                  {""}
                </span>
                <span className="su-sr-only">Facebook</span>
              </a>
            </div>
          </div>
        </div>
        <div className="su-footer-bottom">
          <p>{footer.copyright}</p>
        </div>
      </div>
      <SuLink href={links.withdrawal} external={v2} className="su-withdrawal">
        {footer.withdrawal}
      </SuLink>
    </footer>
  );
}
