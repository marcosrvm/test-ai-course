import Image from "next/image";
import { asset, links } from "./content";
import { SuLink } from "./SuLink";

// /v2/so-funktionierts: clone of smileunion.de/pages/wie-funktioniert-s.
// Texts as on the live page; "Los geht's" starts the v2 quiz,
// "Abdruckbox bestellen" goes to /v2/abdruckbox.

export function HowItWorksHero() {
  return (
    <>
      <a href={links.suitabilityV2} className="su-btn su-btn-primary su-mobile-cta">
        Los geht&apos;s
      </a>
      <section
        className="su-hiw-hero"
        style={{ backgroundImage: `url(${asset("images/hiw-hero-bg.jpg")})` }}
      >
        <div className="su-container">
          <div className="su-hiw-hero-inner">
            <h1>Dein Weg zu geraden Zähnen in 3 bis 7 Monaten</h1>
            <p>Für das Lächeln, das du schon immer wolltest. Ganz einfach mit Zahnschienen vom Testsieger. </p>
            <a href={links.suitabilityV2} className="su-btn su-btn-primary">
              Los geht&apos;s
            </a>
          </div>
        </div>
      </section>
    </>
  );
}

export function HowItWorksTimeline() {
  return (
    <section className="su-hiw-timeline">
      <div className="su-container">
        <h2>Mit jedem Schritt näher zum Lieblingslächeln</h2>
        <div className="su-timeline">
          <div className="su-timeline-dot" />
          <div className="su-hiw-step">
            <div className="su-hiw-step-graphic">
              <Image src={asset("images/hiw-step-1.jpg")} alt="Zeig uns deine Zähne" width={1030} height={790} />
            </div>
            <div className="su-hiw-step-content">
              <p className="su-hiw-step-time">Heute</p>
              <h3>Zeig uns deine Zähne</h3>
              <p>
                Vereinbare einen kostenlosen Termin in einer unserer Partnerpraxen oder lasse dir unsere Abdruckbox
                völlig unverbindlich nach Hause schicken. Dieses Starter-Set enthält vom Abdrucklöffel bis hin zum
                Wangenhalter alles, was du für deine Abdrücke und Fotos deiner Zähne brauchst.
              </p>
              <p>
                <a href={links.boxV2} className="su-btn su-btn-primary">
                  Abdruckbox bestellen
                </a>
              </p>
            </div>
          </div>
          <div className="su-hiw-step">
            <div className="su-hiw-step-graphic">
              <video autoPlay muted loop playsInline src={asset("video/hiw-step-2.mp4")} />
            </div>
            <div className="su-hiw-step-content">
              <p className="su-hiw-step-time">IN 3 WOCHEN</p>
              <h3>
                Du erhältst deinen <br />
                3D-Behandlungsplan per E-Mail
              </h3>
              <p>
                Unsere auf digitale Kieferorthopädie spezialisierten Ärzte analysieren deinen Fall und erstellen auf
                Grundlage deiner Unterlagen einen individuellen{" "}
                <SuLink href={links.simulation} external>
                  <strong>3D-Behandlungsplan</strong>
                </SuLink>
                , den du per E-Mail erhältst. Dieser zeigt dir Schritt für Schritt, wie deine Zähne sich während der
                Behandlung bewegen. So bekommst du bereits vorher ein Bild davon, wie das zu erwartende Endergebnis
                aussieht. Bis hierhin ist alles völlig unverbindlich und verpflichtet nicht zum Kauf.{" "}
              </p>
            </div>
          </div>
          <div className="su-hiw-step">
            <div className="su-hiw-step-graphic">
              <Image
                src={asset("images/hiw-step-3.jpg")}
                alt={"Du erhältst deine\nZahnschienen"}
                width={1030}
                height={790}
              />
            </div>
            <div className="su-hiw-step-content">
              <p className="su-hiw-step-time">IN 6 WOCHEN</p>
              <h3>
                Du erhältst deine
                <br />
                Zahnschienen
              </h3>
              <p>
                Entscheidest du dich für deinen Behandlungsplan, beginnt unser Dentallabor mit der Produktion deiner
                Zahnschienen. Nach Fertigstellung senden wir dir diese direkt nach Hause. Du trägst die Schienen 22
                Stunden täglich und wechselst alle 10 Tage zur nächsten Schiene. Zum Essen und Trinken (außer bei
                kaltem Wasser) nimmst du sie heraus. Zum Reinigen der Zahnschienen eignet sich eine weiche Zahnbürste
                und eine gelförmige Zahnpasta sowie kaltes oder handwarmes Wasser.
              </p>
            </div>
          </div>
          <div className="su-hiw-step">
            <div className="su-hiw-step-graphic">
              <Image
                src={asset("images/hiw-step-4.jpg")}
                alt="Fertig ist dein schönstes Lächeln"
                width={1030}
                height={790}
              />
            </div>
            <div className="su-hiw-step-content">
              <p className="su-hiw-step-time">IN 3 BIS 7 MONATEN</p>
              <h3>Fertig ist dein schönstes Lächeln</h3>
              <p>
                Gehe durch die Straßen und zeige allen dein schönstes Lächeln. Du erhältst von uns noch ein Paar
                Retainer-Schienen, die du in den ersten Monaten nach der Behandlung zunächst täglich und dann weiterhin
                nachts trägst, sodass deine Zähne weiterhin in ihrer neuen Position bleiben.{" "}
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export function HowItWorksCare() {
  return (
    <section
      className="su-hiw-cta"
      style={{ backgroundImage: `url(${asset("images/hiw-cta-bg.jpg")})` }}
    >
      <div className="su-container">
        <div className="su-hiw-cta-inner">
          <div className="su-before-title">JEDERZEIT</div>
          <h2>Stets zahnärztlich betreut</h2>
          <p>
            Unsere Ärzte sind vor und während der Behandlung immer für dich da. Vereinbare sieben Tage die Woche einen
            Skype- oder Telefontermin mit deinem Behandler, sende uns Bilder deines Zahnstatus zum Beispiel per
            WhatsApp oder melde dich per E-Mail bei uns. Du entscheidest, welcher Kommunikationsweg am besten zu deinen
            Bedürfnissen passt.
          </p>
        </div>
      </div>
    </section>
  );
}
