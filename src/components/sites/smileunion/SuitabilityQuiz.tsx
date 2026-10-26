"use client";

import Image from "next/image";
import { useId, useState, type FormEvent, type ReactNode } from "react";
import { links } from "./content";
import { improved, quiz } from "./quiz-content";

type Variant = "original" | "improved";
type Question = "priorTreatment" | "retainer" | "reasons" | "crowding" | "gaps" | "checkup";
type Result = "suitable" | "strongCrowding" | "retainer-result";
type Step = "intro" | Question | Result;
type RequestType = keyof typeof improved.contact.examples;
type Answers = Record<"q1" | "q2" | "q3" | "q4" | "q5" | "q6", string>;

const labelOf = (options: { id: string; label: string }[], id: string | null) =>
  options.find((option) => option.id === id)?.label ?? "";

// Mirrors the live flow: a retainer ends the quiz, a single selected reason
// (crowding or gaps) skips the other picture question, and only a strong
// crowding answer changes the final result. The other answers don't affect it.
export function SuitabilityQuiz({ variant }: { variant: Variant }) {
  const [step, setStep] = useState<Step>("intro");
  const [priorTreatment, setPriorTreatment] = useState("");
  const [retainer, setRetainer] = useState("");
  const [reasons, setReasons] = useState<string[]>([]);
  const [crowding, setCrowding] = useState<string | null>(null);
  const [gaps, setGaps] = useState<string | null>(null);
  const [checkup, setCheckup] = useState("");

  // Skipped or unanswered questions stay empty.
  const answers: Answers = {
    q1: priorTreatment,
    q2: retainer,
    q3: quiz.reasons.options
      .filter((option) => reasons.includes(option.id))
      .map((option) => option.label)
      .join(", "),
    q4: labelOf(quiz.crowding.options, crowding),
    q5: labelOf(quiz.gaps.options, gaps),
    q6: checkup,
  };

  const hasCrowding = reasons.includes("crowding");
  const hasGaps = reasons.includes("gaps");
  const skipCrowding = hasGaps && !hasCrowding;
  const skipGaps = hasCrowding && !hasGaps;

  const toggleReason = (id: string) =>
    setReasons((current) => (current.includes(id) ? current.filter((r) => r !== id) : [...current, id]));

  const finish = (answer: string) => {
    setCheckup(answer);
    setStep(crowding === "c" ? "strongCrowding" : "suitable");
  };

  return (
    <section className="su-quiz">
      <div key={step} className="su-quiz-step">
        {step === "intro" && (
          <TextSection image={quiz.intro.image}>
            <h1>{quiz.title}</h1>
            <p>{quiz.intro.text}</p>
            <button type="button" className="su-btn su-btn-primary" onClick={() => setStep("priorTreatment")}>
              {quiz.intro.cta}
            </button>
          </TextSection>
        )}

        {step === "priorTreatment" && (
          <YesNoQuestion
            question={quiz.priorTreatment}
            onYes={() => {
              setPriorTreatment(quiz.yes);
              setStep("retainer");
            }}
            onNo={() => {
              setPriorTreatment(quiz.no);
              setStep("retainer");
            }}
          />
        )}

        {step === "retainer" && (
          <YesNoQuestion
            question={quiz.retainer}
            onYes={() => {
              setRetainer(quiz.yes);
              setStep("retainer-result");
            }}
            onNo={() => {
              setRetainer(quiz.no);
              setStep("reasons");
            }}
          />
        )}

        {step === "reasons" && (
          <QuestionSection question={quiz.reasons.question} className="su-quiz-multiple">
            <p className="su-quiz-description">{quiz.reasons.description}</p>
            {quiz.reasons.options.map((option) => (
              <div key={option.id} className="su-quiz-checkbox">
                <label>
                  <input
                    type="checkbox"
                    checked={reasons.includes(option.id)}
                    onChange={() => toggleReason(option.id)}
                  />
                  <span className="su-quiz-checkmark" aria-hidden="true" />
                  {option.label}
                </label>
              </div>
            ))}
            <ContinueButton
              onClick={() => {
                if (reasons.length === 0) return;
                setStep(skipCrowding ? "gaps" : "crowding");
              }}
            />
          </QuestionSection>
        )}

        {step === "crowding" && (
          <ImageQuestion
            name="crowding"
            question={quiz.crowding.question}
            options={quiz.crowding.options}
            value={crowding}
            onChange={setCrowding}
            onContinue={() => {
              if (!crowding) return;
              setStep(skipGaps ? "checkup" : "gaps");
            }}
          />
        )}

        {step === "gaps" && (
          <ImageQuestion
            name="gaps"
            question={quiz.gaps.question}
            options={quiz.gaps.options}
            value={gaps}
            onChange={setGaps}
            onContinue={() => {
              if (!gaps) return;
              setStep("checkup");
            }}
          />
        )}

        {step === "checkup" && (
          <YesNoQuestion
            question={quiz.checkup}
            onYes={() => finish(quiz.yes)}
            onNo={() => finish(quiz.no)}
            medium
          />
        )}

        {step === "strongCrowding" && (
          <TextSection image={quiz.results.strongCrowding.image}>
            <h1>{quiz.results.strongCrowding.title}</h1>
            {variant === "original" ? (
              <>
                <p>{quiz.results.strongCrowding.text}</p>
                <OriginalActions />
              </>
            ) : (
              <>
                <p>{improved.strongCrowdingText}</p>
                <ImprovedActions />
                <ContactBlock requestType="strong_crowding" answers={answers} />
              </>
            )}
          </TextSection>
        )}

        {step === "suitable" && (
          <TextSection image={quiz.results.suitable.image}>
            <h1>{quiz.results.suitable.title}</h1>
            {variant === "original" ? (
              <>
                <p>{quiz.results.suitable.text}</p>
                <OriginalActions />
              </>
            ) : (
              <>
                <p>{improved.suitableText}</p>
                <ImprovedActions />
                <ContactBlock requestType="suitable" answers={answers} />
              </>
            )}
          </TextSection>
        )}

        {step === "retainer-result" && (
          <TextSection image={quiz.results.retainer.image}>
            <h1>{quiz.results.retainer.title}</h1>
            {variant === "original" ? (
              <>
                <p>{quiz.results.retainer.text}</p>
                <a href={links.contact} className="su-btn su-btn-primary">
                  {quiz.contactCta}
                </a>
              </>
            ) : (
              <>
                <p>{improved.retainerText}</p>
                <ContactBlock requestType="retainer" answers={answers} />
              </>
            )}
          </TextSection>
        )}
      </div>
    </section>
  );
}

function TextSection({ image, children }: { image: string; children: ReactNode }) {
  return (
    <div className="su-quiz-text" style={{ backgroundImage: `url(${image})` }}>
      <div className="su-container">
        <div className="su-quiz-text-content">{children}</div>
      </div>
    </div>
  );
}

function QuestionSection({
  question,
  className = "",
  children,
}: {
  question: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div className="su-quiz-question">
      <div className="su-container">
        <div className={`su-quiz-question-container ${className}`}>
          <h2>{quiz.title}</h2>
          <h3>{question}</h3>
          {children}
        </div>
      </div>
    </div>
  );
}

function YesNoQuestion({
  question,
  onYes,
  onNo,
  medium = false,
}: {
  question: string;
  onYes: () => void;
  onNo: () => void;
  medium?: boolean;
}) {
  return (
    <QuestionSection question={question} className={medium ? "su-quiz-medium" : ""}>
      <p className="su-quiz-answers">
        <button type="button" className="su-btn su-btn-secondary" onClick={onYes}>
          {quiz.yes}
        </button>{" "}
        <button type="button" className="su-btn su-btn-secondary" onClick={onNo}>
          {quiz.no}
        </button>
      </p>
    </QuestionSection>
  );
}

function ImageQuestion({
  name,
  question,
  options,
  value,
  onChange,
  onContinue,
}: {
  name: string;
  question: string;
  options: { id: string; label: string; image: string }[];
  value: string | null;
  onChange: (id: string) => void;
  onContinue: () => void;
}) {
  return (
    <QuestionSection question={question} className="su-quiz-large">
      <div className="su-quiz-images">
        {options.map((option, index) => (
          <div key={option.id} className="su-quiz-image">
            <label>
              <input
                type="radio"
                name={name}
                value={option.id}
                checked={value === option.id}
                onChange={() => onChange(option.id)}
              />
              <span className="su-quiz-radio" aria-hidden="true" />
              <Image src={option.image} alt={option.label} width={1394} height={808} unoptimized />
              <span>
                <strong>{String.fromCharCode(65 + index)}.</strong> {option.label}
              </span>
            </label>
          </div>
        ))}
      </div>
      <ContinueButton onClick={onContinue} />
    </QuestionSection>
  );
}

function ContinueButton({ onClick }: { onClick: () => void }) {
  return (
    <div className="su-quiz-continue">
      <button type="button" className="su-btn su-btn-secondary" onClick={onClick}>
        {quiz.next}
      </button>
    </div>
  );
}

function OriginalActions() {
  return (
    <div className="su-quiz-actions">
      <a href={links.appointment} className="su-btn su-btn-secondary">
        {quiz.appointmentCta}
      </a>
      <span className="su-quiz-divider">{quiz.divider}</span>
      <a href={links.start} className="su-btn su-btn-primary">
        {quiz.boxCta}
      </a>
    </div>
  );
}

function ImprovedActions() {
  return (
    <div className="su-quiz-actions">
      <a href={links.appointment} className="su-btn su-btn-secondary">
        {improved.appointmentCta}
      </a>
      <small className="su-quiz-note">{improved.appointmentNote}</small>
      <span className="su-quiz-divider">{quiz.divider}</span>
      <a href={links.start} className="su-btn su-btn-primary">
        {quiz.boxCta}
      </a>
      <small className="su-quiz-note">{improved.boxNote}</small>
    </div>
  );
}

function ContactBlock({ requestType, answers }: { requestType: RequestType; answers: Answers }) {
  const id = useId();
  const [marketing, setMarketing] = useState(false);
  const [sent, setSent] = useState<{ message: string; requestType: string } | null>(null);
  const copy = improved.contact;

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    // Read the type back from the submitted form data, as a backend would receive it.
    const data = new FormData(event.currentTarget);
    setSent({
      message: marketing ? copy.thanksConfirm : copy.thanks,
      requestType: String(data.get("result_type")),
    });
  };

  return (
    <div className="su-quiz-contact">
      <h2>{copy.title}</h2>
      <p className="su-quiz-contact-subtitle">{copy.subtitle}</p>

      {sent ? (
        <div className="su-quiz-contact-status" role="status">
          <p>{sent.message}</p>
          <p className="su-quiz-contact-type">
            {copy.requestType} {sent.requestType}
          </p>
        </div>
      ) : (
        <form className="su-quiz-form" onSubmit={onSubmit}>
          <input type="hidden" name="result_type" value={requestType} />
          {Object.entries(answers).map(([name, value]) => (
            <input key={name} type="hidden" name={name} value={value} />
          ))}
          <label htmlFor={`${id}-email`} className="su-sr-only">
            {copy.email}
          </label>
          <input id={`${id}-email`} type="email" name="email" placeholder={copy.email} autoComplete="email" required />
          <label htmlFor={`${id}-question`} className="su-quiz-field-label">
            {copy.question}
          </label>
          <textarea
            id={`${id}-question`}
            name="question"
            placeholder={copy.examples[requestType]}
            rows={3}
          />
          <label className="su-quiz-consent">
            <input type="checkbox" name="consent" required />
            {copy.consent}
          </label>
          <label className="su-quiz-consent">
            <input
              type="checkbox"
              name="marketing"
              checked={marketing}
              onChange={(event) => setMarketing(event.target.checked)}
            />
            {copy.marketing}
          </label>
          <button type="submit" className="su-btn su-btn-secondary">
            {copy.submit}
          </button>
        </form>
      )}

      <button type="button" className="su-quiz-whatsapp" onClick={() => window.alert(improved.whatsappPlaceholder)}>
        <span className="su-icon su-icon-brand" aria-hidden="true">
          {""}
        </span>
        {improved.whatsapp}
      </button>
    </div>
  );
}
