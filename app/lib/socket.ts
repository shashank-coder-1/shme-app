import { io } from "socket.io-client";

export const socket = io(
  "https://shme-app-production.up.railway.app"
);

socket.on("connect", () => {
  console.log("Socket Connected:", socket.id);
});

socket.on("connect_error", (err) => {
  console.log("Socket Error:", err);
});