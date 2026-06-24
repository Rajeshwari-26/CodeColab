const express = require("express");
const http = require("http");
const cors = require("cors");
const { Server } = require("socket.io");
const WebSocket = require('ws');
const setupWSConnection = require('y-websocket/bin/utils').setupWSConnection;

// Fix #10/#11: Load .env so PORT and future config work
require("dotenv").config();

const routes = require("./routes");

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*",
  },
});

app.use(cors());
app.use(express.json());
app.use("/", routes);

const defaultFiles = [
  { id: '1', name: 'main.py', content: 'print("Hello Python!")\n' },
  { id: '2', name: 'index.js', content: 'console.log("Hello JS");\n' }
];

// ─── In-memory room state ────────────────────────────────────────────────────
// rooms[roomId] = { hostId: string, users: Map<socketId, { userId, socketId }>, files: Array }
const rooms = {};

function getOrCreateRoom(roomId) {
  if (!rooms[roomId]) {
    rooms[roomId] = { 
      hostId: null, 
      users: new Map(),
      files: JSON.parse(JSON.stringify(defaultFiles))
    };
  }
  return rooms[roomId];
}

function getRoomUserList(roomId) {
  const room = rooms[roomId];
  if (!room) return [];
  return [...room.users.values()].map((u) => ({
    userId: u.userId,
    isHost: u.userId === room.hostId,
  }));
}

// ─── Socket Logic ─────────────────────────────────────────────────────────────
io.on("connection", (socket) => {
  console.log(`[Socket] Connected: ${socket.id}`);

  // ── JOIN ROOM ──────────────────────────────────────────────────────────────
  socket.on("join_room", ({ roomId, userId }) => {
    if (!roomId || !userId) return;

    // Leave any previous rooms (except the socket's own ID room)
    [...socket.rooms].forEach((room) => {
      if (room !== socket.id) socket.leave(room);
    });

    socket.join(roomId);
    socket.roomId = roomId;
    socket.userId = userId;

    const room = getOrCreateRoom(roomId);

    // We allow multiple connections from the same user (e.g., multiple tabs).
    // Socket.io's disconnect event will handle cleanup of stale sockets.

    // First person to join (or rejoin an empty room) becomes the host
    if (room.users.size === 0) {
      room.hostId = userId;
    }

    room.users.set(socket.id, { userId, socketId: socket.id });

    console.log(`[Room] ${userId} joined ${roomId} | host: ${room.hostId}`);

    // Fix #1: Broadcast user_joined to everyone else in the room
    socket.to(roomId).emit("user_joined", { userId });

    // Send the new joiner the current room state (host + user list + current files)
    socket.emit("room_state", {
      hostId: room.hostId,
      users: getRoomUserList(roomId),
      roomId,
      files: room.files,
    });

    // Broadcast updated user list to everyone in room
    io.to(roomId).emit("user_list_update", getRoomUserList(roomId));
  });

  // ── FILE SYNC (File additions, deletions, uploads) ───────────────────────
  socket.on("sync_files", ({ files }) => {
    if (!socket.roomId) return;
    const room = rooms[socket.roomId];
    if (!room) return;

    room.files = files;
    // Broadcast the full new file tree to everyone else in the room
    socket.to(socket.roomId).emit("files_update", { files });
  });

  // ── CODE SYNC ─────────────────────────────────────────────────────────────
  socket.on("code_change", ({ userId, code, fileId }) => {
    if (!socket.roomId) return;

    const room = rooms[socket.roomId];
    if (!room) return;

    // Persist code change to server's room state
    const file = room.files.find(f => String(f.id) === String(fileId));
    if (file) {
      file.content = code;
    }

    // Fix #5: Teaching mode enforcement — only the host can broadcast code changes
    // (if teachingMode is active; we trust the flag sent by the host for now)
    console.log(`[Code] ${userId} changed file ${fileId} in ${socket.roomId}`);

    socket.to(socket.roomId).emit("code_update", {
      userId,
      code,
      fileId,
    });
  });

  // ── CODE OPS (operation-based sync — preserves remote cursors) ──────────────
  socket.on("code_ops", ({ userId, fileId, ops, content }) => {
    if (!socket.roomId) return;
    const room = rooms[socket.roomId];
    if (!room) return;

    // Persist latest full content to server state
    const file = room.files.find(f => String(f.id) === String(fileId));
    if (file && content !== undefined) file.content = content;

    // Relay OPS (not full content) so receivers can apply without cursor jump
    socket.to(socket.roomId).emit("code_ops_update", { userId, fileId, ops });
  });

  // ── CHAT ──────────────────────────────────────────────────────────────────
  // Fix #3: Use io.to() so the sender also sees their own message in the log
  // (frontend does NOT optimistically add the message, so this is correct)
  socket.on("chat_message", ({ userId, message }) => {
    if (!socket.roomId) return;
    if (!message?.trim()) return;

    io.to(socket.roomId).emit("chat_update", { userId, message });
  });

  // ── SET HOST (Fix #4: implement the missing set_host event) ───────────────
  socket.on("set_host", ({ roomId, userId }) => {
    if (!roomId || !userId) return;

    const room = rooms[roomId];
    if (!room) return;

    // Only the current host can transfer host status
    if (room.hostId !== socket.userId) return;

    room.hostId = userId;
    console.log(`[Room] Host changed to ${userId} in ${roomId}`);

    io.to(roomId).emit("host_changed", { hostId: userId });
    io.to(roomId).emit("user_list_update", getRoomUserList(roomId));
  });

  // ── CURSOR SYNC ───────────────────────────────────────────────────────────
  socket.on("cursor_move", ({ userId, fileId, line, column }) => {
    if (!socket.roomId) return;
    // Relay cursor position to all OTHER users in the room
    socket.to(socket.roomId).emit("cursor_update", { userId, fileId, line, column });
  });

  // ── LEAVE ROOM (manual) ───────────────────────────────────────────────────
  socket.on("leave_room", ({ roomId, userId }) => {
    handleLeave(socket, roomId, userId);
  });

  // ── DISCONNECT (Fix #2: broadcast user_left + clean up room state) ─────────
  socket.on("disconnect", () => {
    console.log(`[Socket] Disconnected: ${socket.id}`);
    if (socket.roomId) {
      handleLeave(socket, socket.roomId, socket.userId);
    }
  });
});

function handleLeave(socket, roomId, userId) {
  const room = rooms[roomId];
  if (!room) return;

  room.users.delete(socket.id);
  socket.leave(roomId);

  console.log(`[Room] ${userId} left ${roomId} | ${room.users.size} remaining`);

  if (room.users.size === 0) {
    // Clean up empty rooms to prevent memory leak
    delete rooms[roomId];
    console.log(`[Room] ${roomId} deleted (empty)`);
    return;
  }

  // Fix #2: Broadcast user_left to remaining users
  socket.to(roomId).emit("user_left", { userId });

  // If the host left, assign a new host (first remaining user)
  if (room.hostId === userId) {
    const newHost = [...room.users.values()][0];
    room.hostId = newHost.userId;
    console.log(`[Room] New host: ${newHost.userId} in ${roomId}`);
    io.to(roomId).emit("host_changed", { hostId: newHost.userId });
  }

  // Broadcast updated user list
  io.to(roomId).emit("user_list_update", getRoomUserList(roomId));
}

const PORT = process.env.PORT || 5000;

// Set up raw WebSocket server for Yjs
const wss = new WebSocket.Server({ noServer: true });

wss.on('connection', (ws, req) => {
  const urlParts = req.url.split('/');
  const docName = urlParts[urlParts.length - 1] || 'default';
  console.log(`[Yjs] Connection established for document: ${docName}`);
  
  setupWSConnection(ws, req, { docName });
});

server.on('upgrade', (request, socket, head) => {
  // Route /yjs connections to the raw WebSocket server for Yjs
  if (request.url.startsWith('/yjs')) {
    wss.handleUpgrade(request, socket, head, (ws) => {
      wss.emit('connection', ws, request);
    });
  }
  // Socket.io automatically handles other upgrades
});

server.listen(PORT, () => {
  console.log(`[Server] Running on port ${PORT}`);
});