"use client";

import { useEffect, useRef, useState } from "react";
import Peer from "simple-peer";
import { socket } from "@/app/lib/socket";

export default function useWebRTC(roomId: string) {
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const mainScreenRef = useRef<HTMLVideoElement>(null);
  const partnerVideoRef = useRef<HTMLVideoElement>(null);

  const peerRef = useRef<Peer.Instance | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);

  const [isMuted, setIsMuted] = useState(false);
  const [cameraOff, setCameraOff] = useState(false);

  useEffect(() => {
    if (!roomId) return;

    const start = async () => {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });

      localStreamRef.current = stream;

      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }

      socket.emit("join-room", roomId);

      socket.on("all-users", (users: string[]) => {
        if (users.length > 0) {
          const peer = createPeer(
            users[0],
            socket.id!,
            stream
          );

          peer.on("stream", (remoteStream) => {
            if (mainScreenRef.current) {
              mainScreenRef.current.srcObject = remoteStream;
            }

            if (partnerVideoRef.current) {
              partnerVideoRef.current.srcObject = remoteStream;
            }
          });

          peerRef.current = peer;
        }
      });

      socket.on(
        "receiving-signal",
        (payload: {
          signal: any;
          callerId: string;
        }) => {
          const peer = addPeer(
            payload.signal,
            payload.callerId,
            stream
          );

          peer.on("stream", (remoteStream) => {
            if (mainScreenRef.current) {
              mainScreenRef.current.srcObject = remoteStream;
            }

            if (partnerVideoRef.current) {
              partnerVideoRef.current.srcObject = remoteStream;
            }
          });

          peerRef.current = peer;
        }
      );

      socket.on(
        "signal-returned",
        (payload: { signal: any }) => {
          peerRef.current?.signal(payload.signal);
        }
      );
    };

    start();

    return () => {
      socket.off("all-users");
      socket.off("receiving-signal");
      socket.off("signal-returned");

      peerRef.current?.destroy();
    };
  }, [roomId]);

  function createPeer(
    userToSignal: string,
    callerId: string,
    stream: MediaStream
  ) {
    const peer = new Peer({
      initiator: true,
      trickle: false,
      stream,
    });

    peer.on("signal", (signal) => {
      socket.emit("sending-signal", {
        userToSignal,
        callerId,
        signal,
      });
    });

    return peer;
  }

  function addPeer(
    incomingSignal: any,
    callerId: string,
    stream: MediaStream
  ) {
    const peer = new Peer({
      initiator: false,
      trickle: false,
      stream,
    });

    peer.on("signal", (signal) => {
      socket.emit("returning-signal", {
        signal,
        callerId,
      });
    });

    peer.signal(incomingSignal);

    return peer;
  }

  const shareScreen = async () => {
    const screenStream =
      await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: true,
      });

    const screenTrack =
      screenStream.getVideoTracks()[0];

    const peer = peerRef.current;

    if (peer) {
      const sender = (peer as any)
        ._pc.getSenders()
        .find(
          (s: RTCRtpSender) =>
            s.track?.kind === "video"
        );

      if (sender) {
        sender.replaceTrack(screenTrack);
      }
    }

    if (mainScreenRef.current) {
      mainScreenRef.current.srcObject =
        screenStream;
    }

    screenTrack.onended = () => {
      window.location.reload();
    };
  };

  const toggleMute = () => {
    const stream = localStreamRef.current;

    if (!stream) return;

    stream.getAudioTracks().forEach((track) => {
      track.enabled = !track.enabled;
    });

    setIsMuted(!isMuted);
  };

  const toggleCamera = () => {
    const stream = localStreamRef.current;

    if (!stream) return;

    stream.getVideoTracks().forEach((track) => {
      track.enabled = !track.enabled;
    });

    setCameraOff(!cameraOff);
  };

  const endCall = () => {
    peerRef.current?.destroy();

    localStreamRef.current
      ?.getTracks()
      .forEach((track) => track.stop());

    window.location.href = "/";
  };

  return {
    localVideoRef,
    mainScreenRef,
    partnerVideoRef,

    shareScreen,
    toggleMute,
    toggleCamera,
    endCall,

    isMuted,
    cameraOff,
  };
}