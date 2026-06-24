import { io } from "socket.io-client";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:5000";
export const YJS_WS_URL = BACKEND_URL.replace(/^http/, 'ws') + '/yjs';

// autoConnect: true means it connects immediately.
// Socket.io buffers events emitted before connection — they fire once connected.
export const socket = io(BACKEND_URL, {
  transports: ["websocket"],
  autoConnect: true,
  reconnectionAttempts: 10,
  reconnectionDelay: 1000,
});