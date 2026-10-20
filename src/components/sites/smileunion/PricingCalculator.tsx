"use client";

import { useRef, useState } from "react";
import type { KeyboardEvent, PointerEvent } from "react";
import { asset, pricing } from "./content";

const lastLevel = pricing.levels.length - 1;

export function PricingCalculator() {
  const [level, setLevel] = useState(0);
  const [dragging, setDragging] = useState(false);
  const trackRef = useRef<HTMLDivElement>(null);
  const current = pricing.levels[level];

  const levelFromPointer = (clientX: number) => {
    const rect = trackRef.current?.getBoundingClientRect();
    if (!rect) return level;
    const ratio = Math.min(Math.max((clientX - rect.left) / rect.width, 0), 1);
    return Math.round(ratio * lastLevel);
  };

  const onPointerDown = (event: PointerEvent<HTMLDivElement>) => {
    event.currentTarget.setPointerCapture(event.pointerId);
    setDragging(true);
    setLevel(levelFromPointer(event.clientX));
  };

  const onPointerMove = (event: PointerEvent<HTMLDivElement>) => {
    if (dragging) setLevel(levelFromPointer(event.clientX));
  };

  const onKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    const step = { ArrowLeft: -1, ArrowDown: -1, ArrowRight: 1, ArrowUp: 1 }[event.key];
    if (step !== undefined) {
      event.preventDefault();
      setLevel((value) => Math.min(Math.max(value + step, 0), lastLevel));
    } else if (event.key === "Home" || event.key === "End") {
      event.preventDefault();
      setLevel(event.key === "Home" ? 0 : lastLevel);
    }
  };

  return (
    <div className="su-pricing-calc">
      <div className="su-pricing-details">
        <div className="su-pricing-info">
          <p>ab</p>
          <div className="su-pricing-amount">
            <strong>{current.monthly} €</strong> /Monat*
          </div>
          <div className="su-pricing-amount">
            <strong>{current.oneTime} €</strong> /einmalige Zahlung
          </div>
        </div>
        <div className="su-pricing-video">
          <video autoPlay loop muted playsInline src={asset("video/home-pricing.mp4")} />
        </div>
      </div>

      <div
        ref={trackRef}
        className="su-pricing-slider"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={() => setDragging(false)}
        onPointerCancel={() => setDragging(false)}
      >
        <button
          type="button"
          role="slider"
          className="su-pricing-handle su-icon"
          aria-label="Schweregrad der Zahnfehlstellung"
          aria-valuemin={0}
          aria-valuemax={lastLevel}
          aria-valuenow={level}
          aria-valuetext={current.label}
          data-dragging={dragging}
          style={{ left: `${(level / lastLevel) * 100}%` }}
          onKeyDown={onKeyDown}
        >
          <span aria-hidden="true">{""}</span>
        </button>
      </div>

      <div className="su-pricing-labels">
        {pricing.levels.map((item, index) => (
          <button key={item.label} type="button" onClick={() => setLevel(index)}>
            {item.label}
          </button>
        ))}
      </div>
    </div>
  );
}
