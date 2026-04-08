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
      reconnectionAttempts: 20,
      reconnectionDelay: 1000,
      timeout: 30000,
      transports: ["websocket"]
    });


    socket.on("connect", () => {
      console.log("🟢 SOCKET CONNECTED:", socket.id);
    });

    socket.on("connect_error", (err) => {
      console.error("🔴 SOCKET CONNECT ERROR:", err.message);
    });

    socket.on("disconnect", (reason) => {
      console.warn("🟡 SOCKET DISCONNECTED:", reason);
    });

    socket.on("join_room_socket", (data) => {
      console.log("📥 RECEIVED join_room_socket:", data);
    });

    socket.on("room_state", (data) => {
      console.log("📥 RECEIVED room_state:", data);
    });

    socket.on("players_list", (data) => {
      console.log("📥 RECEIVED players_list:", data);
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