import Image from "next/image";
import { asset, links } from "./content";
import { SuLink } from "./SuLink";
import { VideoLightbox } from "./VideoLightbox";

// /v2/abdruckbox: clone of smileunion.de/pages/anleitung.
// Texts as on the live page; every order button opens the live checkout in a new tab.

const contents = [
  "1 leicht verständliche Anleitung",
  "1 Paar Handschuhe",
  "1 Retourenlabel",
  "4 Abdrucklöffel",
  "1 Wangenhalter",
  "8 Behälter mit zwei verschiedenen Arten von Abdruckmasse",
];

// The two instruction videos (~13 MB each) are streamed from the live page's
// Shopify CDN only when opened, instead of being copied into the repo.
const VIDEO_CDN = "https://cdn.shopify.com/s/files/1/0102/6152/8623/files";
const videos = [
  {
    poster: asset("images/box-video-1.jpg"),
    src: `${VIDEO_CDN}/VIDEO_1_FINAL_COLOR_CORRECTED_720p.mp4?v=1637058245`,
    label: "Video 1 abspielen",
  },
  {
    poster: asset("images/box-video-2.jpg"),
    src: `${VIDEO_CDN}/Video_2_Shorter_Version_720p.mp4?v=1637058314`,
    label: "Video 2 abspielen",
  },
];

export function BoxHero() {
  return (
    <>
      <SuLink href={links.boxCheckout} external className="su-btn su-btn-primary su-mobile-cta">
        Abdruckbox bestellen
      </SuLink>
      <section className="su-box-hero" style={{ backgroundImage: `url(${asset("images/box-hero.jpg")})` }}>
        <div className="su-container">
          <div className="su-box-hero-inner">
            <h1>Unsere Abdruckbox</h1>
            <p>Für das Lächeln, das du schon immer wolltest.</p>
            <p>
              • Prüfung deiner Abdrücke durch unser Ärzteteam
              <br />• Keinerlei Verpflichtung zum Abschluss einer Behandlung
              <br />• Rückerstattung, wenn du nicht für die Behandlung geeignet bist
            </p>
            <p className="su-box-price">9,00€</p>
            <SuLink href={links.boxCheckout} external className="su-btn su-btn-primary">
              Abdruckbox bestellen
            </SuLink>
            <div className="su-box-hero-seal">
              <Image src={asset("images/box-seal.png")} alt="Unsere Abdruckbox" width={320} height={320} />
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

export function BoxContents() {
  return (
    <section className="su-box-content">
      <div className="su-container">
        <h2>Deine Box enthält</h2>
        <p>alles, was du für deine Zahnabdrücke und deren Rückversand benötigst</p>
        <ul className="su-box-content-list">
          {contents.map((item) => (
            <li key={item}>
              <span className="su-icon" aria-hidden="true">
                {""}
              </span>
              {item}
            </li>
          ))}
        </ul>
        <SuLink href={links.boxCheckout} external className="su-btn su-btn-secondary">
          Abdruckbox bestellen
        </SuLink>
        <div className="su-box-legal">
          <p>
            Preis inkl. Mehrwertsteuer. Lieferzeit ca. 3-5 Werktage per DHL. Beim Kauf gelten folgende{" "}
            <SuLink href={links.terms} external>
              AGB
            </SuLink>
            , unser{" "}
            <SuLink href={links.withdrawal} external>
              Widerrufsrecht
            </SuLink>{" "}
            und die{" "}
            <SuLink href={links.privacy} external>
              Datenschutzrichtlinien.
            </SuLink>
          </p>
        </div>
      </div>
    </section>
  );
}

export function BoxVideos() {
  return (
    <section className="su-box-material">
      <div className="su-container">
        <div className="su-box-material-list">
          {videos.map((video) => (
            <VideoLightbox key={video.src} {...video} />
          ))}
        </div>
      </div>
    </section>
  );
}

export function BoxCards() {
  return (
    <section className="su-box-cards">
      <div className="su-container">
        <div className="su-box-cards-image">
          <Image src={asset("images/box-cards.jpg")} alt="" width={2120} height={200} />
        </div>
      </div>
    </section>
  );
}
