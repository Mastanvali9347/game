import { io } from 'socket.io-client';

const isDev = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || (isDev ? 'http://localhost:8000' : 'https://game-kuyp.onrender.com');

let socket = null;

export const connectSocket = () => {
  if (!socket) {
    socket = io(SOCKET_URL, {
      path: "/socket.io",
      secure: SOCKET_URL.startsWith('https'),
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      timeout: 20000,
      transports: ["websocket"]
    });

    socket.on("connect", () => {
      console.log("Socket connected:", socket.id);
    });

    socket.on("connect_error", (err) => {
      console.error("Socket connect error:", err.message);
    });

    socket.on("disconnect", (reason) => {
      console.warn("Socket disconnected:", reason);
    });
  }

  return socket;
};

export const getSocket = () => {
  if (!socket) {
    return connectSocket();
  }
  return socket;
};