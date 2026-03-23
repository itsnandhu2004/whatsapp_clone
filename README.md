# 💬 WhatsApp Web Clone (Advanced Architecture)

A feature-rich, full-stack WhatsApp Web clone built with the **MERN stack (MongoDB, Express, React, Node.js)**, **Socket.IO**, and **WebRTC**. Designed to demonstrate complex real-time systems, peer-to-peer media streaming, and modern UI/UX replication.

---

## ✨ Standout Features

This project goes beyond a standard chat application by implementing advanced features typically seen in enterprise communications:

- **WebRTC Audio & Video Calling** 📹📞
  - Implemented raw Peer-to-Peer (`RTCPeerConnection`) media streaming.
  - Global `CallContext` allows incoming calls to ring over any screen.
  - Tracks Call History (Missed, Rejected, Completed duration) using MongoDB.
- **24-Hour Ephemeral Statuses (Stories)** ⏳
  - Users can post text, image, or video statuses.
  - Utilizes **MongoDB TTL (Time-To-Live) Indexes** for automatic database cleanup.
  - Tracks exactly who viewed your status in real-time.
- **Real-time Emoji Reactions** ❤️😂
  - React to individual messages instantly without reloading, synced via Socket.IO.
- **Live Presence & Typing Indicators** 🟢
  - "Typing...", "Online", and dynamic "Last Seen at..." logic tracked via WebSocket connections.
- **Modern 3-Column Layout** 🖥️
  - Fully responsive, visually accurate replica of the newest WhatsApp Web vertical-rail interface.

---

## 🛠️ Tech Stack

| Layer     | Technology                          |
|-----------|-------------------------------------|
| Frontend  | React 18, React Router v6, Axios    |
| Signaling | Socket.IO (WebSockets)              |
| Media     | WebRTC (Native RTCPeerConnection)   |
| Styling   | Custom CSS (glassmorphism/dark mode)|
| Backend   | Node.js, Express.js                 |
| Database  | MongoDB with Mongoose               |
| Auth      | JWT + bcryptjs                      |
| Storage   | Cloudinary (Image/Video Uploads)    |

---

## 📁 Core Architecture Highlights

- **`SocketContext.jsx` & `CallContext.jsx`**: Global state providers that intercept WebSocket signals and automatically trigger UI changes (like incoming call overlays) regardless of the user's current route.
- **`socketHandler.js`**: A centralized signaling server routing Offer/Answer payloads, ICE candidates, and message updates in real-time.
- **Secure Authentication**: Uses HttpOnly-style JWT concepts and Bcrypt hashing to protect user data.

---

## ⚙️ Setup & Installation

### Prerequisites
- Node.js v18+
- MongoDB (local or Atlas)
- Cloudinary Account (for media uploads)

### 1. Backend Setup
```bash
cd backend
npm install
```
Edit `.env` with your values (Port, Mongo URI, JWT Secret, Cloudinary credentials).
```bash
npm run dev
```

### 2. Frontend Setup
```bash
cd frontend
npm install
```
Edit `.env` with your Socket/API URLs.
```bash
npm start
```

---

## 🧪 How to Verify / Test

1. Open `http://localhost:3000` in **two different browser windows** (or use incognito).
2. Register two different users (e.g., Alice & Bob).
3. **Test Messaging**: Watch the double grey ticks turn blue when the other window focuses the chat.
4. **Test Calling**: Click the Video Camera icon on User A. User B's screen will show a pulsing incoming call overlay. Accept it to establish a WebRTC connection!
5. **Test Statuses**: Upload an image to your status on User A. User B will see a green ring appear around your profile instantly.

---

## 👤 Author
Built to demonstrate proficiency in handling highly concurrent WebSocket connections, Peer-to-Peer media streaming, and complex React state management.
