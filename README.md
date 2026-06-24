# 🚀 CodeColab — Real-Time Collaborative Coding Platform

CodeColab is a real-time collaborative coding environment where multiple users can join a shared room, write code together, chat, and execute programs instantly — all synchronized live using WebSockets.

---

## ✨ Features

* 🧑‍🤝‍🧑 **Real-Time Collaboration**

  * Multiple users can edit code simultaneously
  * Instant synchronization across all clients

* 💬 **Live Chat**

  * Built-in communication within each room

* 📁 **Multi-File Support**

  * Create, edit, and switch between files

* ▶️ **Code Execution**

  * Supports multiple languages via Judge0 API

* 🏠 **Room-Based Sessions**

  * Unique shareable room links
  * Isolated environments per session

* 👑 **Host Control**

  * First user becomes host
  * Host reassignment on disconnect

---

## 🧠 Tech Stack

### Frontend

* React (Vite)
* Socket.io Client
* Monaco Editor

### Backend

* Node.js
* Express.js
* Socket.io

### Code Execution

* Judge0 API

---

## ⚙️ Architecture Overview

```text
Frontend (React)
      ↓
WebSocket (Socket.io)
      ↓
Backend (Node.js + Express)
      ↓
Judge0 API (Code Execution)
```

---

## 🔄 How It Works

1. User joins a room via a unique room ID
2. A WebSocket connection is established
3. Backend maintains in-memory room state:

   * users
   * files
   * host
4. Code changes are broadcast in real time
5. Chat messages are synced instantly
6. Code execution requests are sent to Judge0

---

## 🏗️ Project Structure

```text
CodeColab/
├── frontend/
│   ├── components/
│   ├── context/
│   ├── pages/
│   ├── socket/
│   └── App.jsx
│
├── backend/
│   ├── server.js
│   ├── routes.js
│   ├── executor.js
│   └── package.json
```

---

## 🚀 Getting Started

### 1️⃣ Clone the repository

```bash
git clone https://github.com/your-username/codecolab.git
cd codecolab
```

---

### 2️⃣ Install dependencies

#### Backend

```bash
cd backend
npm install
```

#### Frontend

```bash
cd frontend
npm install
```

---

### 3️⃣ Run locally

#### Start backend

```bash
cd backend
npm run dev
```

#### Start frontend

```bash
cd frontend
npm run dev
```

---

### 4️⃣ Open in browser

```
http://localhost:5173
```

---

## 🌐 Deployment

| Layer    | Platform |
| -------- | -------- |
| Frontend | Vercel   |
| Backend  | Render   |

---

## ⚠️ Limitations

* In-memory storage (data resets on server restart)
* No authentication system
* No persistent file storage

---

## 🔮 Future Improvements

* Database integration (MongoDB)
* User authentication (OAuth)
* Live cursor tracking
* File/folder hierarchy
* AI-assisted coding

---

## 🧪 Demo

1. Open the app in two tabs
2. Join the same room
3. Type code → see real-time sync
4. Send chat messages
5. Run code and view output

---

## 📊 Performance

* ~10–15 users per room (smooth real-time sync)
* ~100–200 concurrent users per server (approx.)

---

## 📌 Key Highlights

* Real-time synchronization using WebSockets
* Efficient in-memory room state management
* Scalable architecture (extendable with Redis/DB)
* Clean separation of frontend and backend

---

## 🤝 Contributing

Contributions are welcome!
Feel free to open issues or submit pull requests.

---

## 📄 License

MIT License

---

## 👨‍💻 Author

Built as a real-time systems project focusing on collaborative development tools.
