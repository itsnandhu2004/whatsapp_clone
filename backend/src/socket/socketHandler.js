const User = require("../models/User");

const onlineUsers = new Map(); // userId -> socketId

const initSocket = (io) => {
  io.on("connection", (socket) => {
    console.log(`🔌 Socket connected: ${socket.id}`);

    // User joins with their userId
    socket.on("user_join", async (userId) => {
      if (!userId) return;

      onlineUsers.set(userId, socket.id);
      socket.join(userId); // Join room with userId

      try {
        await User.findByIdAndUpdate(userId, {
          isOnline: true,
          lastSeen: new Date(),
        });
      } catch (err) {
        console.error("Error updating user online status:", err.message);
      }

      // Broadcast online status to all
      io.emit("user_online", { userId, isOnline: true });
      console.log(`👤 User ${userId} is online`);
    });

    // Typing indicator
    socket.on("typing_start", ({ senderId, receiverId }) => {
      socket.to(receiverId).emit("typing_start", { senderId });
    });

    socket.on("typing_stop", ({ senderId, receiverId }) => {
      socket.to(receiverId).emit("typing_stop", { senderId });
    });

    // Message read receipt
    socket.on("message_read", ({ senderId, receiverId }) => {
      socket.to(senderId).emit("message_read", { receiverId });
    });

    // WebRTC Signaling
    socket.on("call_user", ({ userToCall, signalData, from, name, isVideoCall }) => {
      socket.to(userToCall).emit("call_incoming", { signal: signalData, from, name, isVideoCall });
    });

    socket.on("answer_call", ({ to, signal }) => {
      socket.to(to).emit("call_accepted", signal);
    });

    socket.on("end_call", ({ to }) => {
      socket.to(to).emit("call_ended");
    });

    socket.on("ice_candidate", ({ to, candidate }) => {
      socket.to(to).emit("ice_candidate_receive", candidate);
    });

    socket.on("new_call_logged", ({ receiverId }) => {
      socket.to(receiverId).emit("call_history_updated");
      socket.emit("call_history_updated");
    });

    // Handle disconnect
    socket.on("disconnect", async () => {
      let disconnectedUserId = null;

      for (const [userId, socketId] of onlineUsers.entries()) {
        if (socketId === socket.id) {
          disconnectedUserId = userId;
          onlineUsers.delete(userId);
          break;
        }
      }

      if (disconnectedUserId) {
        try {
          await User.findByIdAndUpdate(disconnectedUserId, {
            isOnline: false,
            lastSeen: new Date(),
          });
        } catch (err) {
          console.error("Error updating user offline status:", err.message);
        }

        io.emit("user_online", {
          userId: disconnectedUserId,
          isOnline: false,
          lastSeen: new Date().toISOString()
        });
        console.log(`👤 User ${disconnectedUserId} went offline`);
      }

      console.log(`🔌 Socket disconnected: ${socket.id}`);
    });
  });
};

module.exports = { initSocket, onlineUsers };
