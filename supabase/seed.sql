-- smileunion chatbot – synthetic demo data. Run ONCE, after migrations/001_init.sql.
-- All people are fictitious (first names end with "(Demo)", e-mails @example.com, phones +49 000…).
-- Category / sub-category keys come from src/lib/chatbot/taxonomy.json.
-- knowledge_article stays empty: the chatbot reads src/lib/chatbot/knowledge-base.json via loadKnowledge().
-- Fixed ids keep the references readable: a… lead, b… ticket, c… quiz_response, d… chat_conversation.

begin;

-- ---------- Leads ----------
-- identity_level: customer if in_treatment, contactable otherwise.
insert into lead (id, email, phone, first_name, last_name, entry_path, funnel_stage, identity_level, follow_up_status, created_at) values
  ('a0000000-0000-4000-8000-000000000001', 'julia.weber@example.com',     '+49 000 1000001', 'Julia (Demo)',  'Weber',    'direct_kit',         'plan_sent',    'contactable', 'single_email', now() - interval '30 days'),
  ('a0000000-0000-4000-8000-000000000002', 'markus.hoffmann@example.com', '+49 000 1000002', 'Markus (Demo)', 'Hoffmann', 'direct_appointment', 'in_treatment', 'customer',    'none',         now() - interval '120 days'),
  ('a0000000-0000-4000-8000-000000000003', 'laura.schmidt@example.com',   null,              'Laura (Demo)',  'Schmidt',  'quiz_form',          'lead',         'contactable', 'none',         now() - interval '11 days'),
  ('a0000000-0000-4000-8000-000000000004', 'sophie.demo@example.com',     '+49 000 1000004', 'Sophie (Demo)', null,       'direct_kit',         'in_treatment', 'customer',    'none',         now() - interval '90 days'),
  ('a0000000-0000-4000-8000-000000000005', 'thomas.demo@example.com',     '+49 000 1000005', 'Thomas (Demo)', null,       'practice_referral',  'in_treatment', 'customer',    'none',         now() - interval '150 days'),
  ('a0000000-0000-4000-8000-000000000006', 'anna.demo@example.com',       null,              'Anna (Demo)',   null,       'chatbot',            'lead',         'contactable', 'none',         now() - interval '6 hours'),
  ('a0000000-0000-4000-8000-000000000007', 'mia.demo@example.com',        null,              'Mia (Demo)',    null,       'social_dm',          'plan_sent',    'contactable', 'sequence',     now() - interval '25 days');

-- ---------- Consent (contact_request; no double opt-in needed for a contact request) ----------
insert into consent (lead_id, type, given_at, double_opt_in_confirmed) values
  ('a0000000-0000-4000-8000-000000000001', 'contact_request', now() - interval '30 days',  false),
  ('a0000000-0000-4000-8000-000000000002', 'contact_request', now() - interval '120 days', false),
  ('a0000000-0000-4000-8000-000000000003', 'contact_request', now() - interval '11 days',  false),
  ('a0000000-0000-4000-8000-000000000004', 'contact_request', now() - interval '90 days',  false),
  ('a0000000-0000-4000-8000-000000000005', 'contact_request', now() - interval '150 days', false),
  ('a0000000-0000-4000-8000-000000000006', 'contact_request', now() - interval '6 hours',  false),
  ('a0000000-0000-4000-8000-000000000007', 'contact_request', now() - interval '25 days',  false);

-- ---------- Quiz response (Laura; answers as the quiz stores them, skipped question = null) ----------
insert into quiz_response (id, lead_id, session_id, q1, q2, q3, q4, q5, q6, result_type, created_at) values
  ('c0000000-0000-4000-8000-000000000001', 'a0000000-0000-4000-8000-000000000003', null,
   'Nein', 'Nein', 'Ich habe Lücken', null, 'Moderater Lückenstand', 'Ja', 'suitable', now() - interval '11 days');

-- ---------- Tickets ----------
-- Priority / queue / handling follow the sub-category defaults unless noted (overrides: tickets 1 and 4, ticket 6 per priority_note).
insert into ticket (id, lead_id, quiz_response_id, channel, message, category, sub_category, priority, queue, automation_level,
                    status, alert, summary, assigned_agent, created_at, first_response_at, resolved_at) values
  -- 1. Julia – override P2: sales blocker.
  ('b0000000-0000-4000-8000-000000000001', 'a0000000-0000-4000-8000-000000000001', null, 'whatsapp',
   'Hallo! Ich habe meine 3D-Simulation bekommen und bin echt begeistert. Kann ich die 1.790 € auch in Monatsraten zahlen? Und wie lange dauert es nach meiner Zusage, bis die Schienen bei mir sind?',
   '4_payment', 'financing', 'P2', 'general', 'ai_draft_approval', 'new', 'none',
   'Kundin hat ihren 3D-Behandlungsplan erhalten (1.790 €, Variante Leicht) und möchte zusagen. Fragt nach Ratenzahlung und danach, wie lange es nach der Zusage bis zur Lieferung der Schienen dauert. Verkaufshindernis – zeitnah beantworten.',
   null, now() - interval '2 days', null, null),

  -- 2. Markus – AI suggested 8_medical, the agent changed it to 6_aligner_fit / fit_issues.
  ('b0000000-0000-4000-8000-000000000002', 'a0000000-0000-4000-8000-000000000002', null, 'email',
   'Hallo zusammen, ich bin jetzt bei Schiene 3. Seit zwei Tagen sitzt die untere Schiene irgendwie locker und ein Zahn unten links ist beim Draufbeißen empfindlich. Ist das normal? Viele Grüße, Markus Hoffmann',
   '6_aligner_fit', 'fit_issues', 'P1', 'dental', 'dentist_handover', 'new', 'none',
   'Kunde in Behandlung (Schiene 3): Die untere Schiene sitzt seit zwei Tagen locker, ein Zahn unten links ist beim Draufbeißen empfindlich. Passformproblem – Prüfung durch das Zahnärzteteam.',
   null, now() - interval '3 hours', null, null),

  -- 3. Markus – older ticket, resolved.
  ('b0000000-0000-4000-8000-000000000003', 'a0000000-0000-4000-8000-000000000002', null, 'whatsapp',
   'Hi, wann kommt eigentlich meine nächste Lieferung mit den Schienen?',
   '5_shipping', 'aligner_tracking', 'P3', 'general', 'zero_touch', 'resolved', 'none',
   'Kunde fragt, wann seine nächste Schienenlieferung ankommt.',
   null, now() - interval '21 days', now() - interval '21 days' + interval '2 hours', now() - interval '20 days'),

  -- 4. Laura – override P3 / zero_touch: general how-to before ordering, no photo to check.
  ('b0000000-0000-4000-8000-000000000004', 'a0000000-0000-4000-8000-000000000003', 'c0000000-0000-4000-8000-000000000001', 'contact_page',
   'Hallo, ich würde gern die Abdruckbox für 9 € bestellen, habe aber Angst, dass ich die Abdruckmasse falsch anrühre. Ist das kompliziert? Ich habe so etwas noch nie gemacht.',
   '2_kit_appointment', 'impression_guidance', 'P3', 'general', 'zero_touch', 'resolved', 'none',
   'Interessentin (Selbsttest: suitable) möchte die Abdruckbox für 9 € bestellen und ist unsicher, ob sie die Abdruckmasse richtig anmischt. Allgemeine Frage vor der Bestellung, keine Fotos zu prüfen. Die Abdruckbox enthält eine leicht verständliche Anleitung.',
   null, now() - interval '10 days', now() - interval '10 days' + interval '1 hour', now() - interval '10 days' + interval '3 hours'),

  -- 5. Sophie – medical guard, urgent: red alert (internal only).
  ('b0000000-0000-4000-8000-000000000005', 'a0000000-0000-4000-8000-000000000004', null, 'chatbot',
   'Mein Zahnfleisch blutet und ist geschwollen, seit ich die neue Schiene trage.',
   '8_medical', 'pain_discomfort', 'P1', 'dental', 'dentist_handover', 'new', 'red',
   'Kundin in Behandlung: Zahnfleischbluten und Schwellung seit der neuen Schiene. Vom medizinischen Guard als dringend erkannt – Rückruf durch das Zahnärzteteam.',
   null, now() - interval '20 minutes', null, null),

  -- 6. Thomas – P1 (churn risk, priority_note of refund_warranty_cancellation).
  ('b0000000-0000-4000-8000-000000000006', 'a0000000-0000-4000-8000-000000000005', null, 'phone',
   'Ich trage die Schienen jetzt seit drei Monaten und sehe überhaupt keinen Unterschied! Das ist rausgeschmissenes Geld. Ich will die Behandlung abbrechen und mein Geld zurück.',
   '7_complaints', 'refund_warranty_cancellation', 'P1', 'senior', 'manual', 'in_progress', 'none',
   'Kunde in Behandlung, sehr verärgert: nach drei Monaten kein sichtbarer Fortschritt. Möchte die Behandlung abbrechen und sein Geld zurück. Abwanderungsrisiko. Zufriedenheitsversprechen prüfen (Bedingungen: mindestens 22 Stunden tägliche Tragezeit und Fotos alle 4 Wochen).',
   'Senior Agent (Demo)', now() - interval '4 days', now() - interval '4 days' + interval '30 minutes', null),

  -- 7. Anna – chatbot handed over (only the retainer fact was known).
  ('b0000000-0000-4000-8000-000000000007', 'a0000000-0000-4000-8000-000000000006', null, 'chatbot',
   'Zahlt meine Krankenkasse die Behandlung?',
   '1_pre_purchase', 'health_insurance', 'P3', 'general', 'zero_touch', 'new', 'none',
   'Interessentin fragt, ob die Krankenkasse die Behandlung übernimmt. Der Chatbot kannte nur die Regelung zu Retainern (Kostenübernahme für herausnehmbare Retainer zwei Jahre nach der Behandlung) und hat an das Team übergeben.',
   null, now() - interval '6 hours', null, null),

  -- 8. Mia – clinical change to the plan → dentist; waiting for her reply.
  ('b0000000-0000-4000-8000-000000000008', 'a0000000-0000-4000-8000-000000000007', null, 'email',
   'Hallo, danke für die 3D-Simulation! Mir gefällt nur nicht, wie meine Schneidezähne am Ende aussehen – die mittleren sollten gerader stehen und nicht so weit nach vorne. Kann man das noch ändern? LG Mia',
   '3_treatment_plan', 'plan_adjustment', 'P2', 'dental', 'dentist_handover', 'waiting_customer', 'none',
   'Interessentin hat ihre 3D-Simulation erhalten und wünscht eine Änderung an den mittleren Schneidezähnen (gerader, weniger weit vorne). Klinische Anpassung – Zahnärzteteam. Rückfrage an die Kundin gesendet.',
   null, now() - interval '5 days', now() - interval '4 days', null);

-- ---------- AI suggestions (one per ticket; all match the final values except ticket 2) ----------
insert into ai_suggestion (ticket_id, ai_category, ai_sub_category, ai_priority, ai_queue, ai_sentiment, ai_summary, confidence, created_at) values
  ('b0000000-0000-4000-8000-000000000001', '4_payment', 'financing', 'P2', 'general', 'positive',
   'Kaufbereite Kundin mit Behandlungsplan (1.790 €) fragt nach Ratenzahlung und Lieferzeit nach der Zusage.', 0.93, now() - interval '2 days' + interval '5 seconds'),
  ('b0000000-0000-4000-8000-000000000002', '8_medical', 'pain_discomfort', 'P1', 'dental', 'negative',
   'Kunde meldet einen empfindlichen Zahn und eine locker sitzende Schiene. Medizinische Frage – an das Zahnärzteteam.', 0.86, now() - interval '3 hours' + interval '5 seconds'),
  ('b0000000-0000-4000-8000-000000000003', '5_shipping', 'aligner_tracking', 'P3', 'general', 'neutral',
   'Frage nach dem Liefertermin der nächsten Schienen.', 0.95, now() - interval '21 days' + interval '5 seconds'),
  ('b0000000-0000-4000-8000-000000000004', '2_kit_appointment', 'impression_guidance', 'P3', 'general', 'neutral',
   'Interessentin vor der Bestellung der Abdruckbox, unsicher beim Anmischen der Abdruckmasse.', 0.91, now() - interval '10 days' + interval '5 seconds'),
  ('b0000000-0000-4000-8000-000000000005', '8_medical', 'pain_discomfort', 'P1', 'dental', 'negative',
   'Zahnfleischbluten und Schwellung seit der neuen Schiene – dringend, Zahnärzteteam.', 0.98, now() - interval '20 minutes' + interval '5 seconds'),
  ('b0000000-0000-4000-8000-000000000006', '7_complaints', 'refund_warranty_cancellation', 'P1', 'senior', 'high_agitation',
   'Sehr verärgerter Kunde ohne sichtbaren Fortschritt nach drei Monaten, will abbrechen und Geld zurück. Abwanderungsrisiko.', 0.94, now() - interval '4 days' + interval '5 seconds'),
  ('b0000000-0000-4000-8000-000000000007', '1_pre_purchase', 'health_insurance', 'P3', 'general', 'neutral',
   'Frage zur Kostenübernahme durch die Krankenkasse; nur die Retainer-Regelung ist bekannt.', 0.90, now() - interval '6 hours' + interval '5 seconds'),
  ('b0000000-0000-4000-8000-000000000008', '3_treatment_plan', 'plan_adjustment', 'P2', 'dental', 'neutral',
   'Wunsch nach Änderung der Schneidezähne in der 3D-Simulation – klinische Anpassung.', 0.89, now() - interval '5 days' + interval '5 seconds');

-- ---------- Chat conversations (tickets 5 and 7) ----------
insert into chat_conversation (id, lead_id, session_id, channel, messages, topics, escalated_to_human, ticket_id, ai_disclosure_shown, started_at) values
  ('d0000000-0000-4000-8000-000000000001', 'a0000000-0000-4000-8000-000000000004', null, 'website',
   '[
     {"role": "user", "content": "Mein Zahnfleisch blutet und ist geschwollen, seit ich die neue Schiene trage."},
     {"role": "assistant", "content": "Unser Zahnärzteteam ruft dich zurück – hinterlass uns dafür bitte deine Telefonnummer. Wenn die Beschwerden stark sind, geh bitte direkt zu einer Zahnarztpraxis oder zum zahnärztlichen Notdienst."}
   ]'::jsonb,
   '8_medical', true, 'b0000000-0000-4000-8000-000000000005', true, now() - interval '21 minutes'),
  ('d0000000-0000-4000-8000-000000000002', 'a0000000-0000-4000-8000-000000000006', null, 'website',
   '[
     {"role": "user", "content": "Zahlt meine Krankenkasse die Behandlung?"},
     {"role": "assistant", "content": "Zwei Jahre nach der Behandlung übernimmt die Krankenkasse die Kosten für die Folgebehandlung mit herausnehmbaren Retainern. Ob sie die Behandlung selbst übernimmt, dazu habe ich keine geprüfte Information – unser Team kann dir dabei helfen."},
     {"role": "user", "content": "Mit einem Menschen sprechen"}
   ]'::jsonb,
   '1_pre_purchase', true, 'b0000000-0000-4000-8000-000000000007', true, now() - interval '6 hours 2 minutes');

commit;
