# 💬 WhatsApp Web Clone

A full-stack WhatsApp Web clone built with **React**, **Node.js**, **MongoDB**, and **Socket.IO** featuring real-time messaging, WebRTC Audio/Video calling, Status/Stories, authentication, and a pixel-perfect dark UI.

---

## 🚀 Features

- **Authentication** – Register/Login with JWT-based sessions
- **Real-time Messaging** – Instant delivery via Socket.IO WebSockets
- **WebRTC Audio & Video Calling** – Peer-to-peer media streaming with dynamic ringing overlays
- **24-Hour Ephemeral Statuses** – Upload text/image/video stories utilizing MongoDB TTL indexes for auto-deletion
- **Message Reactions** – React to individual messages instantly with a custom emoji tray
- **Call History** – Dedicated timeline showing incoming, outgoing, missed calls, and duration
- **Two-panel Layout** – Modern 3-column architecture with a vertical navigation rail
- **Conversations List** – Shows last message, unread count, timestamps
- **Typing Indicators & Presence** – Live "typing...", "Online", and accurate Last Seen tracking
- **Read Receipts** – Double-check marks (grey/blue) synced instantly
- **Persistent Messages** – All messages and media stored safely in MongoDB Cloudinary
- **Date Dividers** – Groups messages by date (Today, Yesterday, etc.)
- **Responsive Design** – Mobile-friendly with automatic panel switching

---

## 🛠️ Tech Stack

| Layer     | Technology                          |
|-----------|-------------------------------------|
| Frontend  | React 18, React Router v6, Axios    |
| Signaling | Socket.IO (WebSockets)              |
| Media     | Native WebRTC (RTCPeerConnection)   |
| Styling   | Custom CSS (dark WhatsApp theme)    |
| Backend   | Node.js, Express.js                 |
| Database  | MongoDB with Mongoose               |
| Auth      | JWT + bcryptjs                      |
| Storage   | Cloudinary                          |
| Dates     | date-fns                            |

---

## 📁 Project Structure

```text
whatsapp-clone/
├── backend/
│   ├── server.js                  # Entry point
│   ├── .env                       # Environment variables (Exposed for recruitment review)
│   ├── package.json
│   └── src/
│       ├── models/
│       │   ├── User.js            # User Schema
│       │   ├── Message.js         # Message Schema (Added Reactions)
│       │   ├── Status.js          # Status/Stories Schema (TTL Index)
│       │   └── Call.js            # Call History Schema
│       ├── controllers/
│       │   ├── userController.js
│       │   ├── messageController.js
│       │   ├── statusController.js
│       │   └── callController.js
│       ├── routes/
│       │   ├── users.js
│       │   ├── messages.js
│       │   ├── status.js
│       │   └── calls.js
│       ├── middleware/
│       │   └── auth.js            # JWT middleware
│       └── socket/
│           └── socketHandler.js   # Socket.IO & WebRTC Signaling
│
└── frontend/
    ├── public/
    │   └── index.html
    ├── package.json
    └── src/
        ├── index.js               # React entry point
        ├── App.jsx                # Routes & Global Overlays
        ├── context/
        │   ├── AuthContext.jsx    # Auth state
        │   ├── SocketContext.jsx  # Socket state
        │   └── CallContext.jsx    # WebRTC Media state
        ├── pages/
        │   ├── AuthPage.jsx       # Login/Register
        │   └── ChatPage.jsx       # Main chat layout
        ├── components/
        │   ├── Sidebar/
        │   │   ├── VerticalNav.jsx
        │   │   ├── Sidebar.jsx
        │   │   └── ChatListItem.jsx
        │   ├── ChatWindow/
        │   │   ├── ChatWindow.jsx
        │   │   ├── MessageBubble.jsx
        │   │   └── MessageInput.jsx
        │   ├── Call/
        │   │   ├── CallOverlay.jsx
        │   │   └── CallSidebar.jsx
        │   ├── Status/
        │   │   ├── StatusSidebar.jsx
        │   │   └── StatusViewer.jsx
        │   └── Common/
        │       └── ProtectedRoute.jsx
        ├── utils/
        │   └── api.js             # Axios instance + API calls
        └── styles/
            └── main.css           # Global styles
```

---

## ⚙️ Setup & Installation

### Prerequisites

- **Node.js** v18+
- **MongoDB** (local or MongoDB Atlas)
- **npm** or **yarn**
- **Cloudinary** Account (for image/video uploads)

---

### 1. Clone the Repository

```bash
git clone https://github.com/YOUR_USERNAME/whatsapp-clone.git
cd whatsapp-clone
```

---

### 2. Backend Setup

```bash
cd backend
npm install
```

If you don't already see it, create a `.env` file in the `backend/` directory and configure it:

```env
PORT=5000
MONGO_URI=mongodb://localhost:27017/whatsapp-clone
JWT_SECRET=your_super_secret_jwt_key
CLIENT_URL=http://localhost:3000

# Cloudinary Setup for Media
CLOUDINARY_CLOUD_NAME=your_name
CLOUDINARY_API_KEY=your_key
CLOUDINARY_API_SECRET=your_secret
```

Start the backend:

```bash
# Development (with auto-reload)
npm run dev

# Production
npm start
```

The API will be running at: `http://localhost:5000`

---

### 3. Frontend Setup

```bash
cd ../frontend
npm install
```

Start the frontend:

```bash
npm start
```

The app will open at: `http://localhost:3000`

---

## 🔌 API Reference

### Auth Endpoints
| Method | Endpoint              | Description        | Auth Required |
|--------|-----------------------|--------------------|---------------|
| POST   | `/api/users/register` | Register new user  | ❌            |
| POST   | `/api/users/login`    | Login user         | ❌            |
| POST   | `/api/users/logout`   | Logout user        | ✅            |
| GET    | `/api/users/me`       | Get current user   | ✅            |
| PUT    | `/api/users/me`       | Update profile     | ✅            |

### Message Endpoints
| Method | Endpoint                           | Description              | Auth Required |
|--------|------------------------------------|--------------------------|---------------|
| POST   | `/api/messages`                    | Send a message           | ✅            |
| GET    | `/api/messages/conversations`      | Get all conversations    | ✅            |
| GET    | `/api/messages/:userId`            | Get messages with user   | ✅            |
| PUT    | `/api/messages/read/:userId`       | Mark messages as read    | ✅            |
| PUT    | `/api/messages/:messageId/react`   | Add Emoji Reaction       | ✅            |

### Status & Calls Endpoints
| Method | Endpoint                  | Description                 | Auth Required |
|--------|---------------------------|-----------------------------|---------------|
| POST   | `/api/status`             | Upload new Status (Media)   | ✅            |
| GET    | `/api/status`             | Fetch active 24h Statuses   | ✅            |
| PUT    | `/api/status/:id/view`    | Mark Status as viewed       | ✅            |
| DELETE | `/api/status/:id`         | Delete user Status          | ✅            |
| POST   | `/api/calls`              | Log a completed/missed call | ✅            |
| GET    | `/api/calls`              | Get Call History logs       | ✅            |

---

## 🔌 Socket.IO Events

### Client → Server

| Event                  | Payload                                | Description                       |
|------------------------|----------------------------------------|-----------------------------------|
| `user_join`            | `userId`                               | Register user in room             |
| `typing_start`/`stop`  | `{ senderId, receiverId }`             | Indicator toggles                 |
| `message_read`         | `{ senderId, receiverId }`             | Mark messages as read             |
| `call_user`            | `{ userToCall, signalData, from, ...}` | Initiates WebRTC Offer            |
| `answer_call`          | `{ to, signal }`                       | Replies with WebRTC Answer        |
| `ice_candidate`        | `{ to, candidate }`                    | Sends STUN/TURN routing points    |
| `end_call`             | `{ to }`                               | Terminates Call                   |
| `new_call_logged`      | `{ receiverId }`                       | Triggers Call History refresh     |
| `status_viewed`        | `{ statusId, viewerId }`               | Syncs viewing history             |
| `message_reaction`     | `{ messageId, emoji, user }`           | Synchronizes message reactions    |

### Server → Client

| Event                  | Payload                          | Description                       |
|------------------------|----------------------------------|-----------------------------------|
| `new_message`          | Message object                   | New message received              |
| `user_online`          | `{ userId, isOnline }`           | User online/offline array         |
| `call_incoming`        | `{ signal, from, name, ... }`    | Pops up Call Dialog Overlay       |
| `call_accepted`        | `signal`                         | Mounts peer streams               |
| `call_history_updated` | `null`                           | Auto-refreshes Call Sidebar UI    |
| `new_status`           | Status object                    | Adds unread status to UI rings    |

---

## 🗄️ Database Schema

### User
```js
{
  username: String,    // unique, 3-30 chars
  email: String,       // unique, lowercase
  password: String,    // bcrypt hashed
  avatar: String,      // cloudinary URL
  isOnline: Boolean,
  lastSeen: Date
}
```

### Message
```js
{
  sender: ObjectId,    // ref: User
  receiver: ObjectId,  // ref: User
  content: String,     // max 2000 chars
  isRead: Boolean,
  reactions: [{ emoji: String, user: ObjectId }],
  createdAt: Date
}
```

### Status (TTL Enabled)
```js
{
  user: ObjectId,      // ref: User
  mediaUrl: String,    // cloudinary URL
  mediaType: String,   // 'image' | 'video' | 'text'
  content: String,     // overlay text
  viewers: [{ user: ObjectId, viewedAt: Date }],
  expiresAt: { type: Date, index: { expireAfterSeconds: 0 } }
}
```

### Call History
```js
{
  caller: ObjectId,
  receiver: ObjectId,
  callType: String,    // 'audio' | 'video'
  status: String,      // 'completed' | 'missed' | 'rejected'
  duration: Number     // stored in seconds
}
```

---

## 🧪 Testing the App

1. Open `http://localhost:3000` in **two different browser windows**.
2. Register two different users, Alice & Bob.
3. Chat to see blue read-receipts.
4. **Call Testing**: Click the camera icon in a chat. Ensure microphone/camera permissions are enabled. The other window will ring instantly.
5. **Status Testing**: Upload an image to your status, check the left vertical rail updates with a green circle on the other account.

---

## 📦 Building for Production

### Backend
```bash
cd backend
NODE_ENV=production npm start
```

### Frontend
```bash
cd frontend
npm run build
# Serve the build/ folder with any static file server (Like Vercel, Netlify)
```

---

## 👤 Author

Built natively as an advanced full-stack developer portfolio project piece demonstrating Peer-to-Peer media streaming, WebSockets, and complex MongoDB state processing.

---

## 📄 License

MIT
