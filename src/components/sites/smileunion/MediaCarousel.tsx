"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { media } from "./content";

const AUTOPLAY_MS = 5000;
const SWIPE_PX = 40;

export function MediaCarousel() {
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const startX = useRef<number | null>(null);
  const count = media.items.length;

  useEffect(() => {
    if (paused) return;
    const timer = window.setInterval(() => setActive((value) => (value + 1) % count), AUTOPLAY_MS);
    return () => window.clearInterval(timer);
  }, [paused, count, active]);

  const go = (delta: number) => setActive((value) => (value + delta + count) % count);

  return (
    <div
      className="su-media-carousel"
      aria-roledescription="carousel"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div
        className="su-media-viewport"
        onPointerDown={(event) => (startX.current = event.clientX)}
        onPointerUp={(event) => {
          if (startX.current === null) return;
          const delta = event.clientX - startX.current;
          if (Math.abs(delta) > SWIPE_PX) go(delta < 0 ? 1 : -1);
          startX.current = null;
        }}
      >
        <div className="su-media-track" style={{ transform: `translateX(-${active * 100}%)` }}>
          {media.items.map((item, index) => (
            <div
              key={item.logo}
              className="su-media-item"
              role="group"
              aria-roledescription="slide"
              aria-label={`${index + 1} von ${count}`}
              aria-hidden={index !== active}
            >
              <div>
                <Image src={item.logo} alt="" width={760} height={760} draggable={false} />
              </div>
              <div>
                <p>{item.text}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="su-media-dots">
        {media.items.map((item, index) => (
          <button
            key={item.logo}
            type="button"
            aria-label={`Slide ${index + 1}`}
            aria-current={index === active}
            onClick={() => setActive(index)}
          />
        ))}
      </div>
    </div>
  );
}
