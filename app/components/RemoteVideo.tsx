"use client";

import { RefObject } from "react";

interface Props {
  videoRef: RefObject<HTMLVideoElement | null>;
}

export default function RemoteVideo({ videoRef }: Props) {
  return (
    <video
      ref={videoRef}
      autoPlay
      playsInline
      className="w-full h-full object-cover"
    />
  );
}