import { io } from "socket.io-client";

export const socket = io(
  "https://shme-app-production.up.railway.app",
  {
    transports: ["websocket", "polling"],
  }
);