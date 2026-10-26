import Image from "next/image";
import { MediaCarousel } from "./MediaCarousel";
import { PricingCalculator } from "./PricingCalculator";
import {
  about,
  asset,
  benefits,
  hero,
  heroV2,
  links,
  media,
  order,
  pricing,
  qualifications,
  steps,
} from "./content";

export function Hero() {
  return (
    <section className="su-hero" style={{ backgroundImage: `url(${asset("images/home-hero-background.jpg")})` }}>
      <div className="su-container">
        <div className="su-hero-inner">
          <h1>{hero.title}</h1>
          <p>{hero.text}</p>
          <a href={links.suitability} className="su-btn su-btn-primary">
            {hero.cta}
          </a>
          <span className="su-hero-side-text">{hero.sideText}</span>
        </div>
      </div>
      <Image
        className="su-hero-badge"
        src={asset("images/ntv-testsieger-2026.png")}
        alt="ntv / DISQ Testsieger 2026"
        width={3703}
        height={2083}
        priority
      />
    </section>
  );
}

// /v2 hero: full-width CTA under the text, no side text, small note below.
export function HeroV2() {
  return (
    <section
      className="su-hero su-hero-v2"
      style={{ backgroundImage: `url(${asset("images/home-hero-background.jpg")})` }}
    >
      <div className="su-container">
        <div className="su-hero-inner">
          <h1>{hero.title}</h1>
          <p>{heroV2.text}</p>
          <a href={links.suitabilityV2} className="su-btn su-btn-primary">
            {hero.cta}
          </a>
          <span className="su-hero-note">{heroV2.note}</span>
        </div>
      </div>
      <Image
        className="su-hero-badge"
        src={asset("images/ntv-testsieger-2026.png")}
        alt="ntv / DISQ Testsieger 2026"
        width={3703}
        height={2083}
        priority
      />
    </section>
  );
}

export function Qualifications() {
  return (
    <section className="su-qualifications">
      <div className="su-container">
        <p>{qualifications.text}</p>
        <div className="su-seals">
          {qualifications.seals.map((seal) => (
            <div key={seal.src}>
              <Image src={seal.src} alt={seal.alt} width={seal.width} height={seal.height} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function About({ suitabilityHref = links.suitability }: { suitabilityHref?: string }) {
  return (
    <section className="su-about">
      <div className="su-container">
        <div className="su-about-inner">
          <div className="su-about-graphics">
            <div className="su-about-video">
              <div
                className="su-about-image"
                style={{ backgroundImage: `url(${asset("images/home-about-img.jpg")})` }}
              />
              <video autoPlay loop muted playsInline src={asset("video/home-about.mp4")} />
            </div>
          </div>
          <div className="su-about-content">
            <h2 className="su-section-title">{about.title}</h2>
            <p>
              {about.textBefore}
              <strong>{about.textStrong}</strong>
              {about.textAfter}
            </p>
            <a href={suitabilityHref} className="su-btn su-btn-secondary">
              {about.cta}
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}

function StepText({ text, href }: { text: string; href?: string }) {
  const match = text.match(/^(.*)\{(.+)\}(.*)$/);
  if (!match || !href) return <p>{text}</p>;
  return (
    <p>
      {match[1]}
      <a href={href} target="_blank" rel="noreferrer">
        {match[2]}
      </a>
      {match[3]}
    </p>
  );
}

export function Steps() {
  return (
    <section className="su-steps">
      <div className="su-container">
        <div className="su-steps-intro">
          <h2 className="su-section-title">{steps.title}</h2>
          <p>{steps.subtitle}</p>
        </div>
        <div className="su-steps-list">
          {steps.items.map((step) => {
            const image = <Image src={step.image} alt={step.title.join(" ")} width={680} height={680} />;
            return (
              <div key={step.label} className="su-step">
                {step.href ? (
                  <a href={step.href} target="_blank" rel="noreferrer">
                    {image}
                  </a>
                ) : (
                  image
                )}
                <div className="su-step-inner">
                  <h3>{step.label}</h3>
                  <h4>
                    {step.title.map((line, index) => (
                      <span key={line}>
                        {index > 0 && <br />}
                        {line}
                      </span>
                    ))}
                  </h4>
                  <StepText text={step.text} href={step.href} />
                </div>
              </div>
            );
          })}
        </div>
        <div className="su-steps-footer">
          <a href={links.start} className="su-btn su-btn-primary">
            {steps.cta}
          </a>
        </div>
      </div>
    </section>
  );
}

export function Pricing() {
  return (
    <section className="su-pricing">
      <div className="su-container">
        <div className="su-pricing-inner">
          <div className="su-pricing-header">
            <h2 className="su-section-title">{pricing.title}</h2>
            <p>{pricing.subtitle}</p>
          </div>
          <PricingCalculator />
          <div className="su-pricing-footer">
            <a href={links.pricing} className="su-btn su-btn-primary">
              {pricing.cta}
            </a>
          </div>
          <div className="su-pricing-disclaimer">
            <p>{pricing.disclaimer}</p>
          </div>
        </div>
      </div>
    </section>
  );
}

export function Benefits() {
  return (
    <section className="su-benefits">
      <div className="su-container">
        <h2 className="su-section-title">{benefits.title}</h2>
        <div className="su-benefits-inner">
          <div className="su-benefits-graphics">
            <video autoPlay loop muted playsInline src={asset("video/home-benefits.mp4")} />
          </div>
          <div className="su-benefit-list">
            {benefits.items.map((item) => (
              <div key={item.title} className="su-benefit-item">
                <Image src={item.icon} alt={item.title} width={160} height={160} />
                <h3>{item.title}</h3>
                <p>{item.text}</p>
              </div>
            ))}
          </div>
        </div>
        <p className="su-benefits-footnote">{benefits.footnote}</p>
      </div>
    </section>
  );
}

export function Order() {
  return (
    <section className="su-order">
      <div className="su-container">
        <div className="su-order-inner">
          <div className="su-order-graphics">
            <a href={links.instagram} target="_blank" rel="noreferrer">
              <Image src={order.image} alt={order.title} width={1440} height={1528} />
            </a>
          </div>
          <div className="su-order-content">
            <h2 className="su-section-title">{order.title}</h2>
            <ul>
              {order.list.map((item) => (
                <li key={item}>
                  <span className="su-icon" aria-hidden="true">
                    {""}
                  </span>
                  {item}
                </li>
              ))}
            </ul>
            <div className="su-order-actions">
              <a href={links.appointment} className="su-btn su-btn-secondary">
                {order.secondaryCta}
              </a>
              <span className="su-order-divider">{order.divider}</span>
              <a href={links.start} className="su-btn su-btn-primary">
                {order.primaryCta}
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export function Media() {
  return (
    <section className="su-media">
      <div className="su-container">
        <h2 className="su-section-title">
          {media.title[0]}
          <br />
          {media.title[1]}
        </h2>
        <MediaCarousel />
      </div>
    </section>
  );
}
