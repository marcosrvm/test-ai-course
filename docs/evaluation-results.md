# Evaluation results

## Current: 2026-11-02

Date: 2026-11-02 · Model: gemini-3.5-flash · Test set: 47 questions (44 taxonomy examples + 3 demo scenarios from Po) · Run as in production: medical guard first, LLM only for questions the guard does not flag.

| Metric | Result |
|---|---|
| Medical guard – recall (8_medical + fit_issues) | 100 % (10/10) |
| Medical guard – false positives (other questions) | 0 % (0/37) |
| Retrieval – non-medical questions with a chunk ≥ 6 | 84 % (31/37) |
| Classification – correct category (guard + LLM) | 98 % (46/47) |
| Classification – correct category (LLM only) | 97 % (36/37) |
| LLM calls / failed / skipped | 37 / 0 / 0 |
| Medical guard – Spanish medical cases | 100 % (4/4) |
| Chat scenarios passed (language, financing, guard) | 100 % (21/21) |
| Security – ticket table, No key | ✓ HTTP 401 denied |
| Security – ticket table, Invalid key | ✓ HTTP 401 denied |
| Security – ticket table, Publishable key | ✓ HTTP 401 denied |

Note: Most test questions were generated with AI when the taxonomy was created; next step: evaluate on real tickets.

Known limit (multilingual safety): the keyword guard covers German, English and Spanish. In the chat, the LLM's health flag is a second safety layer for any other language (a health answer is replaced by the dentist answer), and an English or Spanish message that finds no chunk is translated to German and checked again. At handover, the server re-checks with the keyword guard only: in other languages the ticket still reaches the dentist through the classification's second layer (AI says 8_medical → P1, dental), but without an automatic red alert.

### Chat scenarios (language, financing, Spanish guard)

| Scenario | Question | Result | Detail |
|---|---|---|---|
| Instalments (DE): .de offer only | Kann ich die Behandlung in Raten zahlen? | ✓ | „Ja, bei smileunion kannst du deine Behandlung bequem in Raten zahlen. Die Ratenzahlung läuft über einen Zeitraum von 72 Monaten (bei 6,9 % effektivem Jahreszins…“ |
| Instalments (ES): .de offer only, in Spanish | ¿Puedo pagar el tratamiento a plazos? | ✓ | „¡Hola! Sí, puedes pagar tu tratamiento mediante una pago único o en cuotas. Ofrecemos financiación a 72 meses (con un 6,9 % de interés anual efectivo), desde 30…“ |
| Klarna: .eu chunk, one answer, handover | Kann ich auch mit Klarna bezahlen? | ✓ | „Bei smileunion kannst du deine Behandlung flexibel über 72 Monate ab 30, 41 oder 49 € pro Monat finanzieren (bei 6,9 % effektivem Jahreszins). Zudem sind Ratenz…“ |
| 36 months: both financing chunks retrieved | Can I pay over 36 months? | ✓ | ratenzahlung-bedingungen, ratenzahlung-klarna-splitit-eu, preise-schweregrade |
| 36 months (EN): both offers, in English, handover | Can I pay over 36 months? | ✓ | „Yes, you can pay in installments over 72 months starting from 30, 41, or 49 € per month (with 6.9% effective annual interest). Alternatively, installments over …“ |
| General financing never retrieves the .eu chunk | Wie funktioniert die Ratenzahlung? | ✓ | ratenzahlung-bedingungen, preise-schweregrade |
| Payment methods: one-off / instalments, handover | Welche Zahlungsmethoden gibt es? Kreditkarte oder PayPal? | ✓ | „Bei smileunion kannst du deine Behandlung als Einmalzahlung begleichen oder bequem in Raten über 72 Monate ab 30 €, 41 € oder 49 € pro Monat (bei 6,9 % effektiv…“ |
| Payment question: financing chunk, no .eu chunk | Wie kann ich die Behandlung bezahlen? | ✓ | preise-schweregrade, ratenzahlung-bedingungen, retainer-nach-behandlung |
| Payment question: financing chunk, no .eu chunk | Wie kann ich bezahlen? | ✓ | ratenzahlung-bedingungen, preise-schweregrade |
| Payment question: financing chunk, no .eu chunk | ¿Cómo puedo pagar el tratamiento? | ✓ | preise-schweregrade, ratenzahlung-bedingungen |
| Payment question (DE): .de facts, team confirms methods | Wie kann ich die Behandlung bezahlen? | ✓ | „Du kannst deine Behandlung bei smileunion entweder als Einmalzahlung (1.790 €, 2.390 € oder 2.890 € je nach Schweregrad) oder per Ratenzahlung über 72 Monate (a…“ |
| Dentist reply (ES) in Spanish | ¿Duele el tratamiento? | ✓ | „Esto lo revisa mejor nuestro equipo de odontólogos. ¿Quieres que te ponga en contacto?…“ |
| Urgent dentist reply (EN) in English | My gums are bleeding a lot since yesterday. | ✓ | „Our dental team will call you back – please leave us your phone number. If the symptoms are severe, please go straight to a dental practice or the emergency den…“ |
| Off-topic (EN): answer in English | Who won the football match yesterday? | ✓ | „I'm sorry, but I can't help with sports results! I am here to assist you with any questions regarding your smileunion treatment, prices, appointments, or the im…“ |
| Off-topic (ES): answer in Spanish | ¿Quién ganó el partido de fútbol ayer? | ✓ | „¡Hola! No dispongo de información sobre eventos deportivos, pero con gusto puedo ayudarte con dudas sobre tu tratamiento en smileunion, precios, el proceso o ci…“ |
| Price (ES): finds the price chunk | ¿Cuánto cuesta el tratamiento? | ✓ | „El tratamiento con alineadores invisibles de smileunion está disponible desde 1.790 € en pago único o financiado desde 30 € al mes (en 72 cuotas con un 6,9 % de…“ |
| Medical (ES): toothache | Me duele mucho la muela desde ayer, ¿qué hago? | ✓ | guard: mucho, duel |
| Medical (ES): bleeding gums | Me sangran las encías cuando me pongo la férula. | ✓ | guard: sangr, encia |
| Medical (ES): aligner too tight, sore | La férula me aprieta mucho y tengo una herida en la encía. | ✓ | guard: aprieta, férula, herida, encia |
| Medical (ES): ¿duele el tratamiento? (like DE/EN) | ¿Duele el tratamiento? | ✓ | guard: duel |
| Not medical (ES): price question | ¿Cuánto cuesta el tratamiento? | ✓ | guard: no match |

**Guard false positives:** none

**Guard misses:** none

**No chunk above the threshold:**
- 1_pre_purchase: „Bin ich mit 45 nicht schon zu alt dafür?“
- 1_pre_purchase: „Übernimmt die AOK da irgendwas?“
- 3_treatment_plan: „Mir ist die Lücke vorne im Plan noch zu groß. Kann man das anpassen?“
- 3_treatment_plan: „Ich bin überzeugt – was muss ich jetzt machen, damit es losgeht?“
- 4_payment: „Ich bräuchte eine Rechnung für die Steuererklärung.“
- 7_complaints: „Das ist jetzt das dritte Mal, dass ich nachfrage, und niemand meldet sich. So geht das nicht!“

**Wrong category:**
- expected 3_treatment_plan, got 1_pre_purchase (llm): „Muss ich danach eigentlich für immer einen Retainer tragen?“

**Sub-category distribution (no labels, for information):**
- 1_pre_purchase / eligibility: 3
- 1_pre_purchase / health_insurance: 1
- 1_pre_purchase / kit_vs_practice: 1
- 1_pre_purchase / pricing_comparison: 2
- 2_kit_appointment / appointment_booking: 2
- 2_kit_appointment / extra_putty: 1
- 2_kit_appointment / impression_guidance: 2
- 2_kit_appointment / kit_tracking: 1
- 3_treatment_plan / expected_duration: 1
- 3_treatment_plan / plan_acceptance: 1
- 3_treatment_plan / plan_adjustment: 2
- 3_treatment_plan / simulation_video: 1
- 4_payment / financing: 3
- 4_payment / invoice: 1
- 4_payment / payment_failure: 2
- 5_shipping / aligner_tracking: 2
- 5_shipping / delay_address_change: 1
- 5_shipping / missing_damaged: 2
- 6_aligner_fit / broken_lost: 2
- 6_aligner_fit / fit_issues: 4
- 6_aligner_fit / wearing_habits: 1
- 7_complaints / progress_dissatisfaction: 1
- 7_complaints / refund_warranty_cancellation: 2
- 7_complaints / service_complaint: 2
- 8_medical / –: 6

## Before: 2026-10-29 (before the language / financing changes)

Date: 2026-10-29 · Model: gemini-3.5-flash · Test set: 47 questions (44 taxonomy examples + 3 demo scenarios from Po) · Run as in production: medical guard first, LLM only for questions the guard does not flag.

| Metric | Result |
|---|---|
| Medical guard – recall (8_medical + fit_issues) | 100 % (10/10) |
| Medical guard – false positives (other questions) | 0 % (0/37) |
| Retrieval – non-medical questions with a chunk ≥ 6 | 76 % (28/37) |
| Classification – correct category (guard + LLM) | 98 % (46/47) |
| Classification – correct category (LLM only) | 97 % (36/37) |
| LLM calls / failed / skipped | 37 / 0 / 0 |
| Security – ticket table, No key | ✓ HTTP 401 denied |
| Security – ticket table, Invalid key | ✓ HTTP 401 denied |
| Security – ticket table, Publishable key | ✓ HTTP 401 denied |

Note: Most test questions were generated with AI when the taxonomy was created; next step: evaluate on real tickets.

Known limit (multilingual safety): the keyword guard covers German and basic English. In the chat, the LLM's health flag is a second safety layer for any language (a health answer is replaced by the dentist answer). At handover, the server re-checks with the keyword guard only (German + English): in other languages the ticket still reaches the dentist through the classification's second layer (AI says 8_medical → P1, dental), but without an automatic red alert.

**Guard false positives:** none

**Guard misses:** none

**No chunk above the threshold:**
- 1_pre_purchase: „Bin ich mit 45 nicht schon zu alt dafür?“
- 1_pre_purchase: „Was zahl ich am Ende insgesamt?“
- 1_pre_purchase: „Übernimmt die AOK da irgendwas?“
- 3_treatment_plan: „Mir ist die Lücke vorne im Plan noch zu groß. Kann man das anpassen?“
- 3_treatment_plan: „Ich bin überzeugt – was muss ich jetzt machen, damit es losgeht?“
- 4_payment: „Ich bräuchte eine Rechnung für die Steuererklärung.“
- 4_payment: „Meine Zahlung ist fehlgeschlagen, was jetzt?“
- 4_payment: „Kann ich von Kreditkarte auf Lastschrift wechseln?“
- 7_complaints: „Das ist jetzt das dritte Mal, dass ich nachfrage, und niemand meldet sich. So geht das nicht!“

**Wrong category:**
- expected 3_treatment_plan, got 8_medical (llm): „Muss ich danach eigentlich für immer einen Retainer tragen?“

**Sub-category distribution (no labels, for information):**
- 1_pre_purchase / eligibility: 2
- 1_pre_purchase / health_insurance: 1
- 1_pre_purchase / kit_vs_practice: 1
- 1_pre_purchase / pricing_comparison: 2
- 2_kit_appointment / appointment_booking: 2
- 2_kit_appointment / extra_putty: 1
- 2_kit_appointment / impression_guidance: 2
- 2_kit_appointment / kit_tracking: 1
- 3_treatment_plan / expected_duration: 1
- 3_treatment_plan / plan_acceptance: 1
- 3_treatment_plan / plan_adjustment: 2
- 3_treatment_plan / simulation_video: 1
- 4_payment / financing: 3
- 4_payment / invoice: 1
- 4_payment / payment_failure: 2
- 5_shipping / aligner_tracking: 1
- 5_shipping / delay_address_change: 2
- 5_shipping / missing_damaged: 2
- 6_aligner_fit / broken_lost: 2
- 6_aligner_fit / fit_issues: 4
- 6_aligner_fit / wearing_habits: 1
- 7_complaints / progress_dissatisfaction: 1
- 7_complaints / refund_warranty_cancellation: 2
- 7_complaints / service_complaint: 2
- 8_medical / refinement_retainer_clinical: 1
- 8_medical / –: 6
