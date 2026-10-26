// Page content for the smileunion.de homepage clone.
// Navigation labels, headings, prices and links mirror the source page.
// Longer body copy is newly written placeholder text: replace it with your
// own (or the licensed original) copy before publishing.

const SOURCE = "https://www.smileunion.de";
export const asset = (path: string) => `/sites/smileunion/${path}`;

export const nav = [
  { label: "So funktioniert's", href: `${SOURCE}/pages/wie-funktioniert-s` },
  { label: "Bin ich geeignet?", href: `${SOURCE}/pages/bin-ich-geeignet` },
  { label: "Preise", href: `${SOURCE}/pages/pricing` },
  { label: "Abdruckbox", href: `${SOURCE}/pages/anleitung` },
  { label: "Terminbuchung", href: `${SOURCE}/pages/vor-ort-termine` },
  { label: "Erfahrungen", href: `${SOURCE}/pages/erfahrungen` },
  { label: "Ratgeber", href: `${SOURCE}/pages/faq` },
];

export const links = {
  home: "/",
  start: `${SOURCE}/pages/anleitung`,
  suitability: "/bin-ich-geeignet",
  homeV2: "/v2",
  suitabilityV2: "/v2/bin-ich-geeignet",
  pricing: `${SOURCE}/pages/pricing`,
  appointment: `${SOURCE}/pages/vor-ort-termine`,
  contact: `${SOURCE}/pages/kontakt`,
  withdrawal: `${SOURCE}/pages/widerrufsbelehrung`,
  simulation:
    "https://3dsimulation.info/?u=23432&a=Client3048/Client3927/EF18144/E583D970CBB442CEB3B091EACCFE4CA3.iiwgl&fg=888&bg=000&p=HLECAU",
  instagram: "https://www.instagram.com/smileunion.de/",
  facebook: "https://www.facebook.com/smileunion.de/",
};

export const hero = {
  title: "Gerade Zähne vom Testsieger schon ab 30€ pro Monat.",
  text: "Unsichtbare Aligner, ärztlich begleitet und bequem von zu Hause aus – dein Weg zu einem Lächeln, das du gerne zeigst.",
  cta: "Bin ich geeignet?",
  sideText: "Mache den Test.",
};

export const qualifications = {
  text: "Gerade Zähne in 3-7 Monaten - jederzeit ärztlich betreut.",
  seals: [
    { src: asset("images/seal-4.png"), alt: "", width: 200, height: 200 },
    { src: asset("images/seal-1.png"), alt: "klinisch getestet", width: 300, height: 200 },
    { src: asset("images/seal-bestpreisgarantie.png"), alt: "Bestpreisgarantie", width: 190, height: 200 },
  ],
};

export const about = {
  title: "Warum sind Zahnschienen die perfekte Alternative zur Zahnspange?",
  textBefore: "Transparente Aligner sind ",
  textStrong: "eine zeitgemäße Form der Zahnkorrektur",
  textAfter:
    ". Leichte und mittlere Fehlstellungen lassen sich damit zuverlässig behandeln – ganz ohne Brackets und Drähte. Weil die Schienen kaum zu sehen sind, begleiten sie dich unauffällig durch Job, Schule und Freizeit.",
  cta: "Bin ich geeignet?",
};

export const steps = {
  title: "Probiere es aus!",
  subtitle: "In drei einfachen Schritten",
  items: [
    {
      label: "Schritt 1",
      title: ["Zeig uns deine Zähne"],
      image: asset("images/home-step-1.jpg"),
      text: "Komm kostenlos in eine Partnerpraxis in deiner Nähe oder lass dir die Abdruckbox nach Hause schicken. Beides ist unverbindlich – du entscheidest später.",
    },
    {
      label: "Schritt 2",
      title: ["Unsere Zahnärzte erstellen", "deinen Behandlungsplan"],
      image: asset("images/home-step-2-play.jpg"),
      href: links.simulation,
      text: "In einer {3D-Simulation} siehst du vorab, wie sich deine Zähne Schritt für Schritt bewegen und wie dein Lächeln am Ende aussehen wird.",
    },
    {
      label: "Schritt 3",
      title: ["Wir schicken dir deine", "Zahnschienen direkt nach Hause"],
      image: asset("images/home-step-3.jpg"),
      text: "Gefällt dir dein Plan, bekommst du alle Schienen für die gesamte Behandlung per Post und wechselst sie etwa alle 10 Tage. Retainer für die Zeit danach sind bereits dabei.",
    },
  ],
  cta: "Abdruckbox bestellen",
};

export const pricing = {
  title: "Bestpreisgarantie",
  subtitle: "Spare bis zu 60%",
  levels: [
    { label: "Leicht", monthly: "30", oneTime: "1.790" },
    { label: "Mittel", monthly: "40", oneTime: "2.390" },
    { label: "Komplex", monthly: "49", oneTime: "2.890" },
  ],
  cta: "Mehr zu „Preise“",
  disclaimer:
    "*Monatsrate bei 72 Monaten Laufzeit, effektiver Jahreszins 6,69% (gebundener Sollzinssatz 6,9%), bezogen auf den Barzahlungspreis. Rechenbeispiel: Barzahlungspreis 1.790€, Gesamtbetrag 2.188,84€. Beträge gerundet. Es gelten die AGB unseres Finanzierungspartners.",
};

export const benefits = {
  title: "Verlass dich auf uns",
  items: [
    {
      icon: asset("images/benefit-bestpreis.png"),
      title: "Bestpreisgarantie",
      text: "Findest du einen vergleichbaren deutschen Anbieter günstiger, zahlen wir dir die Differenz zurück.",
    },
    {
      icon: asset("images/benefit-tooth.png"),
      title: "Zufriedenheitsversprechen",
      text: "Bist du mit dem Ergebnis noch nicht ganz glücklich, korrigieren wir kostenlos nach.*",
    },
    {
      icon: asset("images/benefit-aligner.png"),
      title: "Dauerhaftes Ergebnis",
      text: "Ein Paar Retainer gehört zu jeder Behandlung. Du trägst sie nur noch nachts, damit deine Zähne an ihrem neuen Platz bleiben.",
    },
    {
      icon: asset("images/benefit-arzt.png"),
      title: "Jederzeit ärztlich betreut",
      text: "Regelmäßige digitale Kontrollen durch unsere Zahnärzte sorgen dafür, dass deine Behandlung sicher verläuft.",
    },
  ],
  footnote:
    "*Voraussetzung für eine (1) kostenlose Nachkorrektur: Du schickst uns alle 4 Wochen Fotos deines Behandlungsfortschritts.",
};

export const order = {
  title: "Mache den ersten Schritt",
  image: asset("images/home-order-img.jpg"),
  list: [
    "Buche einen kostenlosen Termin in einer Partnerpraxis.",
    "Oder mach Abdrücke und Fotos deiner Zähne ganz einfach selbst – mit unserer Abdruckbox.",
    "Erst wenn dein persönlicher Behandlungsplan vorliegt, entscheidest du, ob du starten möchtest.",
  ],
  secondaryCta: "Termin buchen",
  divider: "oder",
  primaryCta: "Abdruckbox bestellen",
};

// The source shows short excerpts from press coverage here. These are
// placeholders; insert licensed press quotes before publishing.
export const media = {
  title: ["Transparente Zahnschienen", "in den Medien"],
  items: [
    { logo: asset("images/media-4.png"), text: "Platzhalter: Pressestimme zur Unauffälligkeit transparenter Zahnschienen im Alltag." },
    { logo: asset("images/media-3.png"), text: "Platzhalter: Pressestimme zur einfachen Pflege herausnehmbarer Aligner." },
    { logo: asset("images/media-2.png"), text: "Platzhalter: Pressestimme zu Vorteilen beim Essen und bei der Zahnpflege." },
    { logo: asset("images/media-1.png"), text: "Platzhalter: Pressestimme zu Alignern als Alternative zu festen Brackets." },
    { logo: asset("images/media-0.png"), text: "Platzhalter: Erfahrungsbericht einer Kundin über ihre Behandlung." },
  ],
};

export const footer = {
  navTitle: "Entdecke smileunion",
  nav: [
    { label: "Bin ich geeignet?", href: `${SOURCE}/pages/bin-ich-geeignet` },
    { label: "Kontakt", href: `${SOURCE}/pages/kontakt` },
    { label: "Blog", href: `${SOURCE}/blogs/wissenswertes` },
    { label: "Impressum", href: `${SOURCE}/pages/impressum` },
    { label: "Datenschutz", href: `${SOURCE}/pages/datenschutz` },
    { label: "AGB", href: `${SOURCE}/pages/agb` },
    { label: "Widerrufsbelehrung", href: `${SOURCE}/pages/widerrufsbelehrung` },
    { label: "Cookie Einstellungen", href: `${SOURCE}/pages/datenschutz` },
  ],
  newsletterTitle: "Newsletter",
  consent:
    "Ja, ich möchte Werbe-E-Mails erhalten und bin einverstanden, dass meine Daten dafür verwendet werden. Diese Einwilligung kann ich jederzeit widerrufen.",
  copyright: "© 2026 smileunion GmbH.",
  withdrawal: "Abdruckbox widerrufen",
};

// /v2 homepage: same content, but every "Bin ich geeignet?" link goes to the v2 quiz.
const toSuitabilityV2 = (items: { label: string; href: string }[]) =>
  items.map((item) => (item.label === "Bin ich geeignet?" ? { ...item, href: links.suitabilityV2 } : item));

export const navV2 = toSuitabilityV2(nav);
export const footerNavV2 = toSuitabilityV2(footer.nav);

export const headerV2 = {
  menu: "Menü",
  // Dropdown groups (by nav label), separated by dividers.
  groups: [
    ["So funktioniert's", "Bin ich geeignet?", "Preise", "Erfahrungen"],
    ["Abdruckbox", "Terminbuchung"],
    ["Ratgeber"],
  ],
};

export const heroV2 = {
  text: "Starte heute die Reise zu deinem schönen Lächeln mit den unsichtbaren Zahnschienen vom Testsieger.",
  note: "Kostenlos · in 30 Sekunden",
};
