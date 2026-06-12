"use client";

import { RefObject } from "react";

interface Props {
  videoRef: RefObject<HTMLVideoElement | null>;
}

export default function LocalVideo({ videoRef }: Props) {
  return (
    <video
      ref={videoRef}
      autoPlay
      muted
      playsInline
      className="w-80 rounded-xl border-2 border-black"
    />
  );
}