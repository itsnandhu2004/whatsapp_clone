import React, { createContext, useContext, useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";
import { useAuth } from "./AuthContext";

const SocketContext = createContext();

const SOCKET_URL = process.env.REACT_APP_SOCKET_URL || "http://localhost:5000";

export const SocketProvider = ({ children }) => {
  const { user } = useAuth();
  const socketRef = useRef(null);
  const [onlineUsers, setOnlineUsers] = useState({});
  const [lastSeenMap, setLastSeenMap] = useState({});
  const [typingUsers, setTypingUsers] = useState({});

  useEffect(() => {
    if (!user) {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
      return;
    }

    const socket = io(SOCKET_URL, { transports: ["websocket", "polling"] });
    socketRef.current = socket;

    socket.on("connect", () => {
      socket.emit("user_join", user._id);
    });

    socket.on("user_online", ({ userId, isOnline, lastSeen }) => {
      setOnlineUsers((prev) => ({ ...prev, [userId]: isOnline }));
      if (lastSeen) {
        setLastSeenMap((prev) => ({ ...prev, [userId]: lastSeen }));
      }
    });

    socket.on("typing_start", ({ senderId }) => {
      setTypingUsers((prev) => ({ ...prev, [senderId]: true }));
    });

    socket.on("typing_stop", ({ senderId }) => {
      setTypingUsers((prev) => {
        const updated = { ...prev };
        delete updated[senderId];
        return updated;
      });
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [user]);

  const emitTypingStart = (receiverId) => {
    socketRef.current?.emit("typing_start", {
      senderId: user._id,
      receiverId,
    });
  };

  const emitTypingStop = (receiverId) => {
    socketRef.current?.emit("typing_stop", {
      senderId: user._id,
      receiverId,
    });
  };

  const emitMessageRead = (senderId, receiverId) => {
    socketRef.current?.emit("message_read", { senderId, receiverId });
  };

  return (
    <SocketContext.Provider
      value={{
        socket: socketRef.current,
        onlineUsers,
        lastSeenMap,
        typingUsers,
        emitTypingStart,
        emitTypingStop,
        emitMessageRead,
      }}
    >
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => {
  const ctx = useContext(SocketContext);
  if (!ctx) throw new Error("useSocket must be used within SocketProvider");
  return ctx;
};
