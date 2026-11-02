import Image from "next/image";
import type { CSSProperties } from "react";
import { asset, links } from "./content";
import { SuLink } from "./SuLink";

// /v2/preise: clone of smileunion.de/pages/pricing.
// Texts and prices exactly as on the live page (they differ in places from the homepage).

const steps = [
  { title: "Mache den ersten Schritt", price: "Kostenfrei / 9,00€" },
  { title: "Starte unverbindlich", price: "Inklusive" },
  { title: "Erhalte eine 3D-Simulation deiner Zahnbewegungen", price: "Inklusive" },
  { title: "Bestelle deine durchsichtigen Zahnschienen", price: "ab 1.790 € oder 30€/Monat" },
];

const stepTexts = [
  <p key="1">
    Vereinbare einen kostenlosen Termin in einer unserer{" "}
    <SuLink href={links.appointment} external>
      Partnerpraxen
    </SuLink>{" "}
    (kostenfrei) oder bestelle unser <a href={links.boxV2}>Zahnabdruckset </a> (9,00€) direkt zu dir nach Hause.
    Beide Optionen verpflichten nicht zum Kauf.
  </p>,
  <p key="2">
    Unsere auf digitale Kieferorthopädie spezialisierten Ärzte analysieren deinen Fall und erstellen deinen
    individuellen Behandlungsplan.
  </p>,
  <p key="3">
    Schaue dir deine individuelle 3D-Simulation an und überzeuge dich, dass smileunion der richtige Partner für deine
    Zahnkorrektur ist. Bei Fragen kannst du dich jederzeit an uns wenden.
  </p>,
  <p key="4">
    Wenn du mit deinem Behandlungsplan einverstanden bist, bestellst du deine Zahnschienen und deine Behandlung kann
    beginnen.
  </p>,
];

// Bar widths: desktop / phone (<= 480px), as on the live page.
const comparison = [
  { label: "smileunion", price: "1.790 €", width: "43%", mobileWidth: "48%", color: "#f45561" },
  { label: "Online-Aligner-Anbieter ¹", price: "1.985 €", width: "55%", mobileWidth: "84%", color: "#c9c9c9" },
  { label: "Niedergelassene Zahnarztpraxis ²", price: "3.500 €", width: "80%", mobileWidth: "100%", color: "#969696" },
];

const levels = [
  { label: "Leicht", monthly: "30 €", oneTime: "1.790 €", image: "images/pricing-level-1.png" },
  { label: "Mittel", monthly: "41 €", oneTime: "2.390 €", image: "images/pricing-level-2.png" },
  { label: "Komplex", monthly: "49 €", oneTime: "2.890 €", image: "images/pricing-level-3.png" },
];

const advantages = [
  { label: "Effiziente Prozesse", icon: "images/pricing-advantage-1.gif" },
  { label: "Digitale Betreuung", icon: "images/pricing-advantage-2.png" },
  { label: "Direkt-zum-Kunden Modell", icon: "images/pricing-advantage-3.gif" },
];

const sources = {
  comparison: "https://www.zahnschienen.org/unsichtbare-zahnschienen-im-vergleich/",
  dentist: "https://www.kieferorthopaedie-my-smile.de/zahnspangen-kosten/",
};

export function PricingHero() {
  return (
    <>
      <SuLink href={links.start} external className="su-btn su-btn-primary su-mobile-cta">
        Abdruckbox bestellen
      </SuLink>
      <section
        className="su-pr-hero"
        style={{ backgroundImage: `url(${asset("images/pricing-hero-bg.jpg")})` }}
      >
        <div className="su-container">
          <div className="su-pr-hero-inner">
            <h1>Für jeden das richtige Preismodell</h1>
            <p>
              Ein schönes Lächeln muss kein Vermögen kosten. Deshalb bieten wir verschiedene Preismodelle an, die bis zu
              60% günstiger sind als die anderer Anbieter.
            </p>
            <div className="su-pr-hero-actions">
              <SuLink href={links.start} external className="su-btn su-btn-primary">
                Abdruckbox bestellen
              </SuLink>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

export function PricingSteps() {
  return (
    <section className="su-pr-benefits">
      <div className="su-container">
        <div className="su-pr-benefits-header">
          <h2>Völlig ohne Risiko</h2>
          <p>Erst nach Erhalt der 3D-Simulation entscheidest du dich für oder gegen eine Behandlung.</p>
        </div>
        <div className="su-pr-benefits-list su-timeline">
          <div className="su-timeline-dot" />
          {steps.map((step, index) => (
            <div key={step.title} className="su-pr-benefits-item">
              <div className="su-pr-benefits-item-title">
                <h3>{step.title}</h3>
                <div className="su-pr-benefits-item-pricing">{step.price}</div>
              </div>
              <div className="su-pr-benefits-item-content">{stepTexts[index]}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function PricingComparison() {
  return (
    <section className="su-pr-comparison">
      <div className="su-container">
        <div className="su-pr-comparison-inner">
          <div className="su-pr-comparison-image">
            <Image src={asset("images/pricing-comparison.jpg")} alt="Der Vergleich" width={1332} height={1126} />
          </div>
          <div className="su-pr-comparison-content">
            <h2>Der Vergleich</h2>
            <p>
              Eine Zahnbegradigung mit transparenten Alignern bei smileunion kostet <strong>ca. 60%</strong> weniger
              <br /> als eine Behandlung beim niedergelassenen Zahnarzt.
            </p>
            <div className="su-pr-comparison-list">
              {comparison.map((item) => (
                <div
                  key={item.label}
                  className="su-pr-comparison-item"
                  style={
                    {
                      "--su-bar-width": item.width,
                      "--su-bar-width-mobile": item.mobileWidth,
                      "--su-bar-color": item.color,
                    } as CSSProperties
                  }
                >
                  <div className="su-pr-comparison-bar">{item.label}</div>
                  <div className="su-pr-comparison-price">{item.price}</div>
                </div>
              ))}
            </div>
            <div className="su-pr-comparison-notes">
              <p>
                ¹ Durchschnittseinstiegspreis aller auf{" "}
                <SuLink href={sources.comparison} external>
                  {sources.comparison}
                </SuLink>{" "}
                gelisteter Anbieter mit dortiger Preisangabe (Stand 12/2025).
              </p>
              <p>
                ² Niedrigster auf{" "}
                <SuLink href={sources.dentist} external>
                  {sources.dentist}
                </SuLink>{" "}
                genannter Durchschnittpreis für eine Aligner-Behandlung (Stand 05/2021).
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export function PricingLevels() {
  return (
    <section className="su-pr-pricing">
      <div className="su-container">
        <h2>Preise genauso transparent wie unsere Zahnschienen</h2>
        <div className="su-pr-pricing-list">
          {levels.map((level) => (
            <div key={level.label} className="su-pr-pricing-item">
              <h3>{level.label}</h3>
              <Image src={asset(level.image)} alt="" width={674} height={418} />
              <div className="su-pr-pricing-details">
                <p>ab</p>
                <div className="su-pr-pricing-row">
                  <strong>{level.monthly}</strong> /Monat*
                </div>
                <div className="su-pr-pricing-row">
                  <strong>{level.oneTime}</strong> /einmalige Zahlung
                </div>
              </div>
            </div>
          ))}
        </div>
        <div className="su-pr-pricing-footer">
          <SuLink href={links.start} external className="su-btn su-btn-primary">
            ABDRUCKBOX BESTELLEN
          </SuLink>
          <p>
            *Rate bei einem Zahlungszeitraum von 72 Monaten inklusive 6,9% effektivem Jahreszins (bei einem
            Sollzinssatz von 6,69%) auf den Barzahlungspreis. Beispiel: Bei einem Barzahlungspreis von 1.790€ ergibt
            sich ein Gesamtpreis von 2.188,84€. Alle Beträge sind kaufmännisch gerundet. Bitte beachte die gesonderten
            AGB unserer Zahlungspartner.
          </p>
        </div>
      </div>
    </section>
  );
}

export function PricingAdvantages() {
  return (
    <section className="su-pr-advantages">
      <div className="su-container">
        <div className="su-pr-advantages-inner">
          <div>
            <a href={links.instagram} target="_blank" rel="noreferrer">
              <Image
                src={asset("images/pricing-advantages.png")}
                alt="Wie kommt unser Preis zustande?"
                width={800}
                height={850}
              />
            </a>
          </div>
          <div className="su-pr-advantages-content">
            <h2>Wie kommt unser Preis zustande?</h2>
            <ul>
              {advantages.map((item) => (
                <li key={item.label}>
                  <Image src={asset(item.icon)} alt="" width={96} height={96} unoptimized />
                  {item.label}
                </li>
              ))}
            </ul>
            <a href={links.howItWorksV2} className="su-btn su-btn-primary">
              So funktioniert`s
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
