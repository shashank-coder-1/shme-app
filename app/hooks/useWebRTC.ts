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

        console.log("DEBUG VERSION 3");

        socket.emit("join-room", roomId);

        socket.on("disconnect", (reason) => {
          console.log(
            "SOCKET DISCONNECTED:",
            reason
          );
        });

        socket.on("connect", () => {
          console.log(
            "SOCKET CONNECTED:",
            socket.id
          );
        });

        socket.on("all-users", (users: string[]) => {
  console.log("ALL USERS:", users);

  if (users.length === 0) return;

  if (peerRef.current) {
    console.log("Peer already exists");
    return;
  }

  const peer = createPeer(
    users[0],
    socket.id!,
    stream
  );

  peerRef.current = peer;
});

        socket.on("user-joined", (userId: string) => {
  console.log("USER JOINED:", userId);

  // Do NOT create a peer here.
  // The existing user will answer when
  // "receiving-signal" arrives.
});

        socket.on("receiving-signal", (payload) => {
  console.log("RECEIVED SIGNAL", payload);

  if (
    peerRef.current &&
    (peerRef.current as any)._initiator
  ) {
    console.log(
      "Initiator already exists"
    );
    return;
  }

  const peer = addPeer(
    payload.signal,
    payload.callerId,
    stream
  );

  peerRef.current = peer;
});

        socket.on("signal-returned", (payload) => {
  console.log(
    "SIGNAL RETURNED",
    payload.signal.type
  );

  if (!peerRef.current) return;

  const pc = (peerRef.current as any)._pc;

  console.log(
    "SIGNAL STATE:",
    pc.signalingState
  );

  if (pc.signalingState !== "have-local-offer") {
    console.log(
      "Ignoring duplicate answer"
    );
    return;
  }

  peerRef.current.signal(
    payload.signal
  );
});

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
  socket.off("connect");
  socket.off("disconnect");

  peerRef.current?.destroy();

  peerRef.current = null;
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
(peer as any)._initiator = true;

(peer as any)._pc.oniceconnectionstatechange =
  () => {
    console.log(
      "ICE STATE:",
      (peer as any)._pc.iceConnectionState
    );
  };

(peer as any)._pc.onconnectionstatechange =
  () => {
    console.log(
      "CONNECTION STATE:",
      (peer as any)._pc.connectionState
    );
  };

  peer.on("stream", (remoteStream) => {
  console.log(
    "REMOTE STREAM RECEIVED",
    remoteStream.id
  );

  if (mainScreenRef.current) {
  mainScreenRef.current.srcObject =
    remoteStream;

  mainScreenRef.current
    .play()
    .catch(console.error);

  console.log("MAIN VIDEO ASSIGNED");
}

  if (partnerVideoRef.current) {
  partnerVideoRef.current.srcObject =
    remoteStream;

  partnerVideoRef.current
    .play()
    .catch(console.error);

  console.log("PARTNER VIDEO ASSIGNED");
}
});

  peer.on("signal", (signal) => {
  console.log(
    "CREATE PEER SIGNAL:",
    signal.type
  );

  socket.emit("sending-signal", {
    userToSignal,
    callerId,
    signal,
  });
});

    peer.on("connect", () => {
  console.log("PEER CONNECTED");
  (peer as any)._connected = true;
});

    peer.on("error", (err) => {
      console.error(
        "PEER ERROR:",
        err
      );
    });

    peer.on("close", () => {
  console.log("PEER CLOSED");
  if (peerRef.current === peer) {
    peerRef.current = null;
  }
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
(peer as any)._initiator = false;

(peer as any)._pc.oniceconnectionstatechange =
  () => {
    console.log(
      "ICE STATE:",
      (peer as any)._pc.iceConnectionState
    );
  };

(peer as any)._pc.onconnectionstatechange =
  () => {
    console.log(
      "CONNECTION STATE:",
      (peer as any)._pc.connectionState
    );
  };

peer.on("stream", (remoteStream) => {
  console.log(
    "REMOTE STREAM RECEIVED",
    remoteStream.id
  );

  if (mainScreenRef.current) {
  mainScreenRef.current.srcObject =
    remoteStream;

  mainScreenRef.current
    .play()
    .catch(console.error);

  console.log("MAIN VIDEO ASSIGNED");
}

  if (partnerVideoRef.current) {
  partnerVideoRef.current.srcObject =
    remoteStream;

  partnerVideoRef.current
    .play()
    .catch(console.error);

  console.log("PARTNER VIDEO ASSIGNED");
}
});

  peer.on("signal", (signal) => {
  console.log(
    "ADD PEER SIGNAL:",
    signal.type
  );

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

    peer.on("close", () => {
  console.log("PEER CLOSED");

  if (peerRef.current === peer) {
    peerRef.current = null;
  }
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