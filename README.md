# 💬 WhatsApp Web Clone

A full-stack WhatsApp Web clone built with **React**, **Node.js**, **MongoDB**, and **Socket.IO** featuring real-time messaging, authentication, and a pixel-perfect dark UI.

---

## 🚀 Features

- **Authentication** – Register/Login with JWT-based sessions
- **Real-time Messaging** – Instant delivery via Socket.IO WebSockets
- **Two-panel Layout** – Sidebar with chat/people tabs + chat window
- **Conversations List** – Shows last message, unread count, timestamps
- **Typing Indicators** – Live "typing..." status
- **Online Presence** – Real-time online/offline detection
- **Read Receipts** – Double-check marks (grey/blue)
- **Persistent Messages** – All messages stored in MongoDB
- **Auto-scroll** – Always jumps to latest message
- **Date Dividers** – Groups messages by date (Today, Yesterday, etc.)
- **Responsive Design** – Mobile-friendly with panel switching

---

## 🛠️ Tech Stack

| Layer     | Technology                          |
|-----------|-------------------------------------|
| Frontend  | React 18, React Router v6, Axios    |
| Styling   | Custom CSS (dark WhatsApp theme)    |
| Backend   | Node.js, Express.js                 |
| Database  | MongoDB with Mongoose               |
| Realtime  | Socket.IO                           |
| Auth      | JWT + bcryptjs                      |
| Dates     | date-fns                            |

---

## 📁 Project Structure

```
whatsapp-clone/
├── backend/
│   ├── server.js                  # Entry point
│   ├── .env.example               # Environment variables template
│   ├── package.json
│   └── src/
│       ├── models/
│       │   ├── User.js            # User schema
│       │   └── Message.js         # Message schema
│       ├── controllers/
│       │   ├── userController.js
│       │   └── messageController.js
│       ├── routes/
│       │   ├── users.js
│       │   └── messages.js
│       ├── middleware/
│       │   └── auth.js            # JWT middleware
│       └── socket/
│           └── socketHandler.js   # Socket.IO events
│
└── frontend/
    ├── public/
    │   └── index.html
    ├── package.json
    └── src/
        ├── index.js               # React entry point
        ├── App.jsx                # Routes
        ├── context/
        │   ├── AuthContext.jsx    # Auth state
        │   └── SocketContext.jsx  # Socket state
        ├── pages/
        │   ├── AuthPage.jsx       # Login/Register
        │   └── ChatPage.jsx       # Main chat layout
        ├── components/
        │   ├── Sidebar/
        │   │   ├── Sidebar.jsx
        │   │   ├── ChatListItem.jsx
        │   │   └── UserListItem.jsx
        │   ├── ChatWindow/
        │   │   ├── ChatWindow.jsx
        │   │   ├── MessageBubble.jsx
        │   │   └── MessageInput.jsx
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
- **MongoDB** (local or [MongoDB Atlas](https://www.mongodb.com/atlas))
- **npm** or **yarn**

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

Create a `.env` file in the `backend/` directory:

```bash
cp .env.example .env
```

Edit `.env` with your values:

```env
PORT=5000
MONGO_URI=mongodb://localhost:27017/whatsapp-clone
JWT_SECRET=your_super_secret_jwt_key_change_this_in_production
CLIENT_URL=http://localhost:3000
```

> **Using MongoDB Atlas?** Replace `MONGO_URI` with your Atlas connection string:
> `MONGO_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/whatsapp-clone`

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

Create a `.env` file in the `frontend/` directory:

```env
REACT_APP_API_URL=http://localhost:5000/api
REACT_APP_SOCKET_URL=http://localhost:5000
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
| GET    | `/api/users`          | Get all users      | ✅            |

### Message Endpoints

| Method | Endpoint                         | Description              | Auth Required |
|--------|----------------------------------|--------------------------|---------------|
| POST   | `/api/messages`                  | Send a message           | ✅            |
| GET    | `/api/messages/conversations`    | Get all conversations    | ✅            |
| GET    | `/api/messages/:userId`          | Get messages with user   | ✅            |
| PUT    | `/api/messages/read/:userId`     | Mark messages as read    | ✅            |

---

## 🔌 Socket.IO Events

### Client → Server

| Event          | Payload                        | Description             |
|----------------|-------------------------------|--------------------------|
| `user_join`    | `userId`                      | Register user in room    |
| `typing_start` | `{ senderId, receiverId }`    | User started typing      |
| `typing_stop`  | `{ senderId, receiverId }`    | User stopped typing      |
| `message_read` | `{ senderId, receiverId }`    | Mark messages as read    |

### Server → Client

| Event          | Payload                        | Description              |
|----------------|-------------------------------|--------------------------|
| `new_message`  | Message object                | New message received     |
| `user_online`  | `{ userId, isOnline }`        | User online/offline      |
| `typing_start` | `{ senderId }`                | Someone is typing        |
| `typing_stop`  | `{ senderId }`                | Someone stopped typing   |
| `message_read` | `{ receiverId }`              | Messages were read       |

---

## 🗄️ Database Schema

### User
```js
{
  username: String,    // unique, 3-30 chars
  email: String,       // unique, lowercase
  password: String,    // bcrypt hashed
  avatar: String,      // optional URL
  status: String,      // profile status
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
  readAt: Date,
  createdAt: Date,
  updatedAt: Date
}
```

---

## 🧪 Testing the App

1. Open `http://localhost:3000` in **two different browser windows** (or use incognito)
2. Register two different users (e.g., Alice & Bob)
3. Go to the **People** tab and select the other user
4. Start chatting in real-time!

---

## 🌐 Environment Variables

### Backend (`backend/.env`)

| Variable     | Description                    | Default                                      |
|--------------|--------------------------------|----------------------------------------------|
| `PORT`       | Server port                    | `5000`                                       |
| `MONGO_URI`  | MongoDB connection string      | `mongodb://localhost:27017/whatsapp-clone`   |
| `JWT_SECRET` | Secret for JWT signing         | (required – set a strong random string)      |
| `CLIENT_URL` | Frontend URL for CORS          | `http://localhost:3000`                      |

### Frontend (`frontend/.env`)

| Variable                | Description            | Default                        |
|-------------------------|------------------------|--------------------------------|
| `REACT_APP_API_URL`     | Backend API base URL   | `http://localhost:5000/api`    |
| `REACT_APP_SOCKET_URL`  | Socket.IO server URL   | `http://localhost:5000`        |

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
# Serve the build/ folder with any static file server
```

---

## 👤 Author

Built as a full-stack developer assessment task.

---

## 📄 License

MIT
