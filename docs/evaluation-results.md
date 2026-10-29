# Evaluation results

Date: 2026-10-29 · Model: gemini-3.5-flash · Test set: 47 questions (44 taxonomy examples + 3 demo scenarios from Po) · Run as in production: medical guard first, LLM only for questions the guard does not flag.

| Metric | Result |
|---|---|
| Medical guard – recall (8_medical + fit_issues) | 100 % (10/10) |
| Medical guard – false positives (other questions) | 0 % (0/37) |
| Retrieval – non-medical questions with a chunk ≥ 6 | 76 % (28/37) |
| Classification – correct category (guard + LLM) | 100 % (46/46) |
| Classification – correct category (LLM only) | 100 % (36/36) |
| LLM calls / failed / skipped | 37 / 1 / 0 |
| Security – ticket table, No key | ✓ HTTP 401 denied |
| Security – ticket table, Invalid key | ✓ HTTP 401 denied |
| Security – ticket table, Publishable key | ✓ HTTP 401 denied |

Note: Most test questions were generated with AI when the taxonomy was created; next step: evaluate on real tickets.

Known limit (multilingual safety): the keyword guard covers German and basic English. In the chat, the LLM's health flag is a second safety layer for any language (a health answer is replaced by the dentist answer). At handover, the server re-checks with the keyword guard only (German + English): in other languages the ticket still reaches the dentist through the classification's second layer (AI says 8_medical → P1, dental), but without an automatic red alert.

**Guard false positives:** none

**Guard misses:** none

**LLM failures (not counted in the accuracy):**
- 3_treatment_plan: „Muss ich danach eigentlich für immer einen Retainer tragen?“ – classify: invalid LLM output

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

**Wrong category:** none

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
- 8_medical / –: 6
