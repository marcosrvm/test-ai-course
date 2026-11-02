"use client";

import { useRef } from "react";

// Replaces the live page's lity lightbox: a poster tile that opens the video in a native <dialog>.
export function VideoLightbox({ poster, src, label }: { poster: string; src: string; label: string }) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  const open = () => {
    dialogRef.current?.showModal();
    void videoRef.current?.play().catch(() => {});
  };

  return (
    <>
      <button
        type="button"
        className="su-box-video"
        style={{ backgroundImage: `url(${poster})` }}
        onClick={open}
      >
        <span className="su-sr-only">{label}</span>
      </button>
      <dialog
        ref={dialogRef}
        className="su-lightbox"
        aria-label={label}
        onClose={() => videoRef.current?.pause()}
        onClick={(event) => {
          if (event.target === dialogRef.current) dialogRef.current.close();
        }}
      >
        <button type="button" className="su-lightbox-close" onClick={() => dialogRef.current?.close()}>
          <span aria-hidden="true">×</span>
          <span className="su-sr-only">Schließen</span>
        </button>
        <video ref={videoRef} src={src} loop playsInline controls preload="none" />
      </dialog>
    </>
  );
}
