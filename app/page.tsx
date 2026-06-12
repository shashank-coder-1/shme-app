"use client";

import { useRouter } from "next/navigation";
import { v4 as uuidv4 } from "uuid";
import { useState } from "react";
import Image from "next/image";

export default function Home() {
  const router = useRouter();

  const [showJoinPanel, setShowJoinPanel] =
  useState(false);

  const [joinRoomId, setJoinRoomId] =
    useState("");

  const createRoom = () => {
    const roomId = uuidv4();
    router.push(`/room/${roomId}`);
  };

  const joinRoom = () => {
    if (!joinRoomId.trim()) return;

    let roomId = joinRoomId.trim();

    if (roomId.includes("/room/")) {
      roomId =
        roomId.split("/room/")[1];
    }

    router.push(`/room/${roomId}`);
  };

  return (
    <main className="relative min-h-screen overflow-hidden">

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

      {/* Dark Overlay */}
      <div
        className="
          absolute
          inset-0
          bg-black/60
          -z-10
        "
      />

      {/* Main Content */}
      <div
        className="
          min-h-screen
          flex
          flex-col
          items-center
          justify-center
          px-6
          text-white
        "
      >

        {/* Logo */}
       <div className="relative mb-2 flex justify-center -mt-12">

  {/* Glow layer */}
  <div
    className="
      absolute
      w-[600px]
      h-[250px]
      bg-cyan-400/40
      blur-[160px]
      rounded-full
      animate-pulse
    "
  />

  <Image
    src="/logo.png"
    alt="Logo"
    width={650}
    height={260}
    priority
    className="
      relative
      z-10
      object-contain
      drop-shadow-[0_0_30px_white]
    "
  />

</div>

        <p
          className="
            text-xl
            text-white/80
            text-center
            max-w-2xl
            mb-2
          "
        >
          Watch movies together,
          share screens and spend
          time with people you love.
        </p>

        {/* Buttons */}
<div className="flex flex-col items-center gap-6 mb-16">

  <div className="flex gap-4">

    <button
      onClick={createRoom}
      className="
        px-8
        py-4
        rounded-full
        bg-gradient-to-r
        from-blue-400
        to-white
        text-white
        font-semibold
        shadow-xl
        hover:scale-105
        transition
      "
    >
      Create Room
    </button>

    <button
      onClick={() =>
        setShowJoinPanel(!showJoinPanel)
      }
      className="
        px-8
        py-4
        rounded-full
        bg-white/10
        backdrop-blur-xl
        border
        border-white/20
        text-white
        hover:bg-white/20
        transition
      "
    >
      Join Room
    </button>

  </div>

  {showJoinPanel && (
    <div
      className="
        w-[500px]
        rounded-3xl
        bg-black/40
        backdrop-blur-2xl
        border
        border-white/10
        p-6
        animate-in
        fade-in
      "
    >

      <input
        value={joinRoomId}
        onChange={(e) =>
          setJoinRoomId(e.target.value)
        }
        placeholder="Paste Room ID or Invite Link"
        className="
          w-full
          h-14
          px-5
          rounded-2xl
          bg-white/10
          border
          border-white/10
          text-white
          placeholder:text-white/40
          outline-none
        "
      />

      <button
        onClick={joinRoom}
        className="
          mt-4
          w-full
          h-14
          rounded-2xl
          bg-gradient-to-r
          from-blue-400
          to-white
          text-white
          font-semibold
          hover:scale-[1.02]
          transition
        "
      >
        Join Room
            </button>

    </div>
  )}

</div>

      </div>

    </main>
  );
}