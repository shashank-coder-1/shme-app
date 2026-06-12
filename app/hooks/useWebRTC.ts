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
      try {
        const stream =
          await navigator.mediaDevices.getUserMedia({
            video: true,
            audio: true,
          });

        localStreamRef.current = stream;

        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }

        socket.emit("join-room", roomId);

        socket.on("all-users", (users: string[]) => {
          console.log("ALL USERS:", users);

          if (users.length > 0) {
            const peer = createPeer(
              users[0],
              socket.id!,
              stream
            );

            peer.on("stream", (remoteStream) => {
              console.log("REMOTE STREAM RECEIVED");

              if (mainScreenRef.current) {
                mainScreenRef.current.srcObject =
                  remoteStream;
              }

              if (partnerVideoRef.current) {
                partnerVideoRef.current.srcObject =
                  remoteStream;
              }
            });

            peerRef.current = peer;
          }
        });

        socket.on("user-joined", (userId: string) => {
            if (peerRef.current) return;
            console.log("USER JOINED:", userId);
            const peer = createPeer(
                userId,
                socket.id!,
                stream
            );
            peer.on("stream", (remoteStream) => {
                console.log("REMOTE STREAM RECEIVED");
                console.log(
                    "TRACKS:",
                    remoteStream.getTracks()
                );
                
                if (mainScreenRef.current) {
                    mainScreenRef.current.srcObject =
                    remoteStream;
                    
                    mainScreenRef.current
                    .play()
                    .catch(console.error);
                }
                
                if (partnerVideoRef.current) {
                    partnerVideoRef.current.srcObject =
                    remoteStream;
                    
                    partnerVideoRef.current
                    .play()
                    .catch(console.error);
                }
            });
            
            peerRef.current = peer;
        });

        socket.on(
          "receiving-signal",
          (payload: {
            signal: any;
            callerId: string;
          }) => {
            console.log(
              "RECEIVED SIGNAL",
              payload
            );

            const peer = addPeer(
              payload.signal,
              payload.callerId,
              stream
            );

            peer.on("stream", (remoteStream) => {
              console.log("REMOTE STREAM RECEIVED");

              if (mainScreenRef.current) {
                mainScreenRef.current.srcObject =
                  remoteStream;
              }

              if (partnerVideoRef.current) {
                partnerVideoRef.current.srcObject =
                  remoteStream;
              }
            });

            peerRef.current = peer;
          }
        );

        socket.on(
            "signal-returned",
            (payload: { signal: any }) => {
                console.log(
                    "SIGNAL RETURNED",
                    payload
                );
                
                if (!peerRef.current) return;
                
                try {
                    peerRef.current.signal(
                        payload.signal
                    );
                } catch (err) {
                    console.error(
                        "SIGNAL ERROR:",
                        err
                    );
                }
            }
        );
        
      } catch (err) {
        console.error(
          "Camera/Mic Error:",
          err
        );
      }
    };

    start();

    return () => {
      socket.off("all-users");
      socket.off("user-joined");
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
      config: {
        iceServers: [
          {
            urls:
              "stun:stun.l.google.com:19302",
          },
        ],
      },
    });

    peer.on("signal", (signal) => {
      console.log("SENDING SIGNAL");

      socket.emit("sending-signal", {
        userToSignal,
        callerId,
        signal,
      });
    });

    peer.on("connect", () => {
      console.log("PEER CONNECTED");
    });

    peer.on("error", (err) => {
      console.error(
        "PEER ERROR:",
        err
      );
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
      config: {
        iceServers: [
          {
            urls:
              "stun:stun.l.google.com:19302",
          },
        ],
      },
    });

    peer.on("signal", (signal) => {
      console.log("RETURNING SIGNAL");

      socket.emit("returning-signal", {
        signal,
        callerId,
      });
    });

    peer.on("connect", () => {
      console.log("PEER CONNECTED");
    });

    peer.on("error", (err) => {
      console.error(
        "PEER ERROR:",
        err
      );
    });

    peer.signal(incomingSignal);

    return peer;
  }

  const shareScreen = async () => {
    try {
      const screenStream =
        await navigator.mediaDevices.getDisplayMedia(
          {
            video: true,
            audio: true,
          }
        );

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
          sender.replaceTrack(
            screenTrack
          );
        }
      }

      if (mainScreenRef.current) {
        mainScreenRef.current.srcObject =
          screenStream;
      }

      screenTrack.onended = () => {
        window.location.reload();
      };
    } catch (err) {
      console.error(
        "Screen Share Error:",
        err
      );
    }
  };

  const toggleMute = () => {
    const stream = localStreamRef.current;

    if (!stream) return;

    stream
      .getAudioTracks()
      .forEach((track) => {
        track.enabled =
          !track.enabled;
      });

    setIsMuted(!isMuted);
  };

  const toggleCamera = () => {
    const stream = localStreamRef.current;

    if (!stream) return;

    stream
      .getVideoTracks()
      .forEach((track) => {
        track.enabled =
          !track.enabled;
      });

    setCameraOff(!cameraOff);
  };

  const endCall = () => {
    peerRef.current?.destroy();

    localStreamRef.current
      ?.getTracks()
      .forEach((track) =>
        track.stop()
      );

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