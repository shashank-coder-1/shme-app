import express from "express";
import http from "http";
import { Server } from "socket.io";
import cors from "cors";

const app = express();

app.use(cors());

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  socket.on("join-room", (roomId: string) => {
    console.log("join-room:", roomId, socket.id);

    socket.join(roomId);

    const room = io.sockets.adapter.rooms.get(roomId);

    const users = room ? Array.from(room) : [];

    console.log("Users in room:", users);

    socket.emit(
      "all-users",
      users.filter((id) => id !== socket.id)
    );

    socket.to(roomId).emit("user-joined", socket.id);
  });

  socket.on("sending-signal", (payload: any) => {
    console.log(
      "sending-signal:",
      payload.callerId,
      "->",
      payload.userToSignal
    );

    io.to(payload.userToSignal).emit(
      "receiving-signal",
      {
        signal: payload.signal,
        callerId: payload.callerId,
      }
    );
  });

  socket.on("returning-signal", (payload: any) => {
    console.log(
      "returning-signal:",
      socket.id,
      "->",
      payload.callerId
    );

    io.to(payload.callerId).emit(
      "signal-returned",
      {
        signal: payload.signal,
        id: socket.id,
      }
    );
  });

  socket.on("disconnect", (reason) => {
  console.log(
    "User disconnected:",
    socket.id,
    reason
  );
});
});

const PORT = process.env.PORT || 5001;

server.listen(PORT, () => {
  console.log(
    `Server running on port ${PORT}`
  );
});