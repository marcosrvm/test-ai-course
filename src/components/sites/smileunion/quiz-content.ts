// Copy for the "Bin ich geeignet?" quiz.
// Question, answer and result texts mirror smileunion.de/pages/bin-ich-geeignet;
// `improved` holds the rewritten result screens used under /v2.

import { asset } from "./content";

export const quiz = {
  title: "Bin ich geeignet?",
  intro: {
    text: "Ist deine Fehlstellung für die Behandlung mit unsichtbaren Zahnschienen geeignet? Erhalte eine erste Einschätzung in 30 Sekunden.",
    cta: "Start",
    image: asset("images/assessment/assessment-bg-1.jpg"),
  },
  yes: "Ja",
  no: "Nein",
  next: "Weiter",
  priorTreatment: "Hast du schon einmal eine Zahnspange oder Zahnschienen gehabt?",
  retainer: "Hast du einen permanenten Retainer-Draht?",
  reasons: {
    question: "Wieso möchtest du deine Zähne korrigieren?",
    description: "Mehrfachnennungen möglich",
    options: [
      { id: "crowding", label: "Ich habe Engstände" },
      { id: "gaps", label: "Ich habe Lücken" },
      { id: "bite", label: "Ich habe ein Bissproblem (Überbiss, Kreuzbiss)" },
      { id: "straighter", label: "Ich möchte insgesamt geradere Zähne" },
    ],
  },
  crowding: {
    question: "Welches der folgenden Bilder beschreibt deinen möglichen Engstand am ehesten?",
    options: [
      { id: "a", label: "Kein oder nur geringer Engstand", image: asset("images/assessment/example-crowding-1.svg") },
      { id: "b", label: "Moderater Engstand", image: asset("images/assessment/example-crowding-2a.svg") },
      { id: "c", label: "Starker Engstand", image: asset("images/assessment/example-crowding-3.svg") },
    ],
  },
  gaps: {
    question: "Welches der folgenden Bilder beschreibt deinen möglichen Lückenstand am ehesten?",
    options: [
      { id: "a", label: "Kein oder nur geringer Lückenstand", image: asset("images/assessment/example-gap-1.svg") },
      { id: "b", label: "Moderater Lückenstand", image: asset("images/assessment/example-gap-2.svg") },
      { id: "c", label: "Starker Lückenstand", image: asset("images/assessment/example-gap-3.svg") },
    ],
  },
  checkup: "Warst du innerhalb der letzten 6-12 Monate zum jährlichen Checkup bei deinem Zahnarzt?",
  results: {
    strongCrowding: {
      title: "Du hast angegeben, einen starken Engstand zu haben.",
      text: "Bitte vereinbare einen kostenlosen Termin in einer unserer Partnerpraxen oder bestelle unsere Abdruckbox, sodass wir abschließend beurteilen können, ob deine Fehlstellung mit unsichtbaren Zahnschienen behandelt werden kann.",
      image: asset("images/assessment/assessment-bg-2.jpg"),
    },
    suitable: {
      title: "Glückwunsch, du bist startklar!",
      text: "Deine Fehlstellung ist für die Behandlung mit unseren Zahnschienen geeignet. Vereinbare einen kostenlosen Termin in einer unserer Partnerpraxen oder bestelle unsere Abdruckbox und erhalte deinen individuellen Behandlungsplan. Beide Optionen sind völlig unverbindlich und verpflichten nicht zum Kauf.",
      image: asset("images/assessment/assessment-bg-3.jpg"),
    },
    retainer: {
      title: "Du hast einen permanenten Retainer-Draht?",
      text: "Bevor eine Behandlung mit unsichtbaren Zahnschienen möglich ist, musst du dir vorher deinen Draht hinter den Zähnen entfernen lassen. Kontaktiere unseren Kundenservice und lasse dich weiter beraten.",
      image: asset("images/assessment/assessment-bg-2.jpg"),
    },
  },
  appointmentCta: "Termin Buchen",
  divider: "oder",
  boxCta: "Abdruckbox bestellen",
  contactCta: "Kontaktiere uns",
};

export const improved = {
  suitableText:
    "Deine Fehlstellung ist für unsere Aligner geeignet. Wähle jetzt deinen nächsten Schritt – beide Optionen sind unverbindlich.",
  strongCrowdingText: "Lass deine Situation unverbindlich prüfen.",
  appointmentCta: "Termin buchen",
  appointmentNote: "Kostenlos · 20–30 Min. in einer Partnerpraxis",
  boxNote: "9 € · bequem zu Hause · Rückerstattung, falls du nicht geeignet bist",
  contact: {
    title: "Noch Fragen?",
    subtitle: "Unser Team antwortet dir innerhalb von 24 Stunden.",
    email: "E-Mail-Adresse",
    question: "Deine Frage (optional)",
    consent: "Ich stimme zu, dass smileunion mich zu meiner Anfrage kontaktiert.",
    marketing: "Ich möchte per E-Mail Infos und Erinnerungen von smileunion erhalten. Abmeldung jederzeit möglich.",
    submit: "Absenden",
    thanks: "Danke! Wir melden uns innerhalb von 24 Stunden.",
    thanksConfirm: "Danke! Bitte bestätige deine E-Mail-Adresse über den Link, den wir dir gerade geschickt haben.",
  },
  whatsapp: "Lieber per WhatsApp – Antwort in wenigen Minuten →",
  whatsappPlaceholder: "WhatsApp-Chat folgt",
};
