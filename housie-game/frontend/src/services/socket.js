import { io } from 'socket.io-client';

const prodHostname = 'game-kuyp.onrender.com';
const isDev = window.location.hostname !== prodHostname && !window.location.hostname.includes('vercel.app') && !window.location.hostname.includes('onrender.com');
const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || (isDev ? `http://${window.location.hostname}:8000` : `https://${prodHostname}`);

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
      transports: ["websocket", "polling"]
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