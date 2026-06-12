"use client";

import { useParams } from "next/navigation";
import { useRef, useState, useEffect } from "react";
import useWebRTC from "@/app/hooks/useWebRTC";
import {
  MonitorUp,
  Mic,
  MicOff,
  Video,
  VideoOff,
  Maximize,
  PhoneOff,
  Copy,
} from "lucide-react";


export default function RoomPage() {
  const params = useParams();

  const roomId =
    typeof params.id === "string"
      ? params.id
      : "";

  const movieContainerRef =
    useRef<HTMLDivElement>(null);

  const [isFullscreen, setIsFullscreen] =
    useState(false);

  const [copied, setCopied] =
  useState(false);

  const {
    localVideoRef,
    mainScreenRef,
    partnerVideoRef,

    shareScreen,
    toggleMute,
    toggleCamera,
    endCall,

    isMuted,
    cameraOff,
  } = useWebRTC(roomId);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(
        !!document.fullscreenElement
      );
    };

    document.addEventListener(
      "fullscreenchange",
      handleFullscreenChange
    );

    return () => {
      document.removeEventListener(
        "fullscreenchange",
        handleFullscreenChange
      );
    };
  }, []);

  const toggleFullscreen = async () => {
    if (!document.fullscreenElement) {
      await movieContainerRef.current?.requestFullscreen();
    } else {
      await document.exitFullscreen();
    }
  };
 
  const copyInviteLink = async () => {
  try {
    await navigator.clipboard.writeText(
      window.location.href
    );

    setCopied(true);

    setTimeout(() => {
      setCopied(false);
    }, 2000);
  } catch (error) {
    console.error(error);
  }
};

  return (
    <div className="relative min-h-screen overflow-hidden">

      {/* Background Video */}
      <video
        autoPlay
        muted
        loop
        playsInline
        className="
          absolute
          inset-0
          w-full
          h-full
          object-cover
          -z-20
        "
      >
        <source
          src="/videos/background.mp4"
          type="video/mp4"
        />
      </video>

      {/* Light Overlay */}
      <div
        className="
          absolute
          inset-0
          bg-black/30
          -z-10
        "
      />

      <div
  className="
    relative
    min-h-screen
    flex
    flex-col
    items-center
    justify-center
    text-white
    p-6
    space-y-6
  "
>
    {copied && (
    <div
      className="
        fixed
        top-6
        right-6
        z-50
        px-4
        py-2
        rounded-full
        bg-green-500
        text-white
        shadow-lg
      "
    >
      Invite Link Copied ✓
    </div>
  )}

        {/* Movie Container */}
        <div
          ref={movieContainerRef}
          className="
            relative
            w-[1400px]
            h-[800px]
            overflow-hidden
            rounded-[40px]
            bg-white/10
            backdrop-blur-xl
            border
            border-white/30
            shadow-[0_20px_80px_rgba(0,0,0,0.35)]
          "
        >

          {/* Main Screen */}
          <video
            ref={mainScreenRef}
            autoPlay
            playsInline
            className="w-full h-full object-cover"
          />

          {/* Soft Gradient Overlay */}
          <div
            className="
              absolute
              inset-0
              bg-gradient-to-t
              from-black/30
              via-transparent
              to-transparent
            "
          />

          {/* Local Bubble */}
          <div className="absolute bottom-6 left-6 z-20">
            <video
              ref={localVideoRef}
              autoPlay
              muted
              playsInline
              className="
                w-36
                h-36
                rounded-full
                object-cover
                border-4
                border-white
                shadow-[0_0_35px_rgba(255,255,255,0.4)]
              "
            />
          </div>

          {/* Partner Bubble */}
          <div className="absolute bottom-6 right-6 z-20">
            <video
              ref={partnerVideoRef}
              autoPlay
              playsInline
              className="
                w-36
                h-36
                rounded-full
                object-cover
                border-4
                border-white
                shadow-[0_0_35px_rgba(255,255,255,0.4)]
              "
            />
          </div>

          {/* Fullscreen X */}
          {isFullscreen && (
            <button
              onClick={() =>
                document.exitFullscreen()
              }
              className="
                absolute
                top-5
                right-5
                z-50
                w-12
                h-12
                rounded-full
                bg-black/40
                backdrop-blur-md
                border
                border-white/20
                text-white
                text-xl
                hover:scale-110
                transition
              "
            >
              ✕
            </button>
          )}
        </div>

        {/* Controls */}
<div
  className="
    flex
    gap-3
    p-3
    rounded-full
    bg-white/10
    backdrop-blur-2xl
    border
    border-white/20
    shadow-xl
  "
>

  {/* Share Screen */}
  <button
    onClick={shareScreen}
    className="
      w-14
      h-14
      rounded-full
      flex
      items-center
      justify-center
      bg-gradient-to-r
      from-blue-400
      to-white
      hover:scale-110
      transition
    "
  >
    <MonitorUp size={22} />
  </button>

  {/* Mute */}
  <button
    onClick={toggleMute}
    title={isMuted ? "Unmute" : "Mute"}
    className="
      w-14
      h-14
      rounded-full
      flex
      items-center
      justify-center
      bg-white/15
      hover:bg-white/25
      transition
    "
  >
    {isMuted ? (
      <MicOff size={22} />
    ) : (
      <Mic size={22} />
    )}
  </button>

  {/* Camera */}
  <button
    onClick={toggleCamera}
    title={
      cameraOff
        ? "Camera On"
        : "Camera Off"
    }
    className="
      w-14
      h-14
      rounded-full
      flex
      items-center
      justify-center
      bg-white/15
      hover:bg-white/25
      transition
    "
  >
    {cameraOff ? (
      <VideoOff size={22} />
    ) : (
      <Video size={22} />
    )}
  </button>


<button
  onClick={copyInviteLink}
  title="Copy Invite Link"
  className="
    w-14
    h-14
    rounded-full
    flex
    items-center
    justify-center
    bg-white/15
    hover:bg-white/25
    transition
  "
>
  <Copy size={22} />
</button>

  {/* Fullscreen */}
  <button
    onClick={toggleFullscreen}
    title="Fullscreen"
    className="
      w-14
      h-14
      rounded-full
      flex
      items-center
      justify-center
      bg-white/15
      hover:bg-white/25
      transition
      transition
    "
  >
    <Maximize size={22} />
  </button>

  {/* End Call */}
  <button
    onClick={endCall}
    className="
      flex
      items-center
      gap-2
      px-6
      py-3
      rounded-full
      bg-gradient-to-r
      from-rose-500
      to-red-600
      hover:scale-105
      transition
      font-medium
    "
  >
    <PhoneOff size={18} />
    <span>Leave</span>
  </button>

</div>

      </div>
    </div>
  );
}