const Message = require("../models/Message");
const User = require("../models/User");

// @desc    Send a message
// @route   POST /api/messages
// @access  Private
const sendMessage = async (req, res) => {
  try {
    const { receiverId, content } = req.body;

    if (!receiverId) {
      return res.status(400).json({ success: false, message: "Receiver ID is required" });
    }

    const receiver = await User.findById(receiverId);
    if (!receiver) {
      return res.status(404).json({ success: false, message: "Receiver not found" });
    }

    if (receiverId === req.user._id.toString()) {
      return res.status(400).json({ success: false, message: "Cannot send message to yourself" });
    }

    const sender = await User.findById(req.user._id);

    // Check if sender has blocked receiver
    if (sender.blockedUsers && sender.blockedUsers.includes(receiverId)) {
      return res.status(403).json({ success: false, message: "You have blocked this contact" });
    }

    // Check if receiver has blocked sender
    if (receiver.blockedUsers && receiver.blockedUsers.includes(req.user._id)) {
      return res.status(403).json({ success: false, message: "You are blocked by this user" });
    }

    let attachmentData = null;
    if (req.file) {
      attachmentData = {
        url: req.file.path,
        public_id: req.file.filename,
        fileType: req.file.mimetype,
        fileName: req.file.originalname,
      };
    }

    if ((!content || content.trim() === "") && !attachmentData) {
      return res.status(400).json({ success: false, message: "Message cannot be empty" });
    }

    const message = await Message.create({
      sender: req.user._id,
      receiver: receiverId,
      content: content?.trim() || "",
      attachment: attachmentData,
    });

    const populated = await Message.findById(message._id)
      .populate("sender", "username avatar isOnline")
      .populate("receiver", "username avatar isOnline");

    // Emit via Socket.IO
    const io = req.io;
    if (io) {
      // Emit to sender and receiver rooms
      io.to(req.user._id.toString()).emit("new_message", populated);
      io.to(receiverId).emit("new_message", populated);
    }

    res.status(201).json({ success: true, data: populated });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get messages between current user and another user
// @route   GET /api/messages/:userId
// @access  Private
const getMessages = async (req, res) => {
  try {
    const { userId } = req.params;
    const currentUserId = req.user._id;

    const otherUser = await User.findById(userId);
    if (!otherUser) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const messages = await Message.find({
      $or: [
        { sender: currentUserId, receiver: userId },
        { sender: userId, receiver: currentUserId },
      ],
      deletedFor: { $ne: currentUserId }
    })
      .populate("sender", "username avatar isOnline")
      .populate("receiver", "username avatar isOnline")
      .sort({ createdAt: 1 });

    // Mark messages as read
    await Message.updateMany(
      { sender: userId, receiver: currentUserId, isRead: false },
      { isRead: true, readAt: new Date() }
    );

    res.json({ success: true, data: messages });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get all conversations for current user (last message per user)
// @route   GET /api/messages/conversations
// @access  Private
const getConversations = async (req, res) => {
  try {
    const currentUserId = req.user._id;

    // Get all unique user IDs the current user has chatted with
    const messages = await Message.find({
      $or: [{ sender: currentUserId }, { receiver: currentUserId }],
      deletedFor: { $ne: currentUserId }
    })
      .sort({ createdAt: -1 })
      .populate("sender", "username avatar isOnline lastSeen status")
      .populate("receiver", "username avatar isOnline lastSeen status");

    const conversationMap = new Map();

    messages.forEach((msg) => {
      // Add safety check for orphaned messages where receiver or sender was deleted
      if (!msg.sender || !msg.receiver) return;

      const otherUser =
        msg.sender._id.toString() === currentUserId.toString()
          ? msg.receiver
          : msg.sender;

      const otherId = otherUser._id.toString();

      if (!conversationMap.has(otherId)) {
        conversationMap.set(otherId, {
          user: otherUser,
          lastMessage: {
            content: msg.content,
            attachment: msg.attachment,
            createdAt: msg.createdAt,
            isRead: msg.isRead,
            isSentByMe:
              msg.sender._id.toString() === currentUserId.toString(),
          },
          unreadCount: 0,
        });
      }

      // Count unread messages
      if (
        !msg.isRead &&
        msg.receiver._id.toString() === currentUserId.toString()
      ) {
        const conv = conversationMap.get(otherId);
        conv.unreadCount += 1;
      }
    });

    const conversations = Array.from(conversationMap.values()).sort(
      (a, b) =>
        new Date(b.lastMessage.createdAt) - new Date(a.lastMessage.createdAt)
    );

    res.json({ success: true, data: conversations });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Mark messages as read
// @route   PUT /api/messages/read/:userId
// @access  Private
const markAsRead = async (req, res) => {
  try {
    const { userId } = req.params;
    await Message.updateMany(
      { sender: userId, receiver: req.user._id, isRead: false },
      { isRead: true, readAt: new Date() }
    );
    res.json({ success: true, message: "Messages marked as read" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete a message
// @route   DELETE /api/messages/:messageId
// @access  Private
const deleteMessage = async (req, res) => {
  try {
    const { messageId } = req.params;
    const { type } = req.body; // "me" or "everyone"
    const userId = req.user._id;

    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({ success: false, message: "Message not found" });
    }

    if (type === "everyone") {
      // Only sender can delete for everyone
      if (message.sender.toString() !== userId.toString()) {
        return res.status(403).json({ success: false, message: "Unauthorized to delete this message for everyone" });
      }

      message.isDeleted = true;
      message.content = ""; // Clear content
      // Could also clear attachment if needed, but keeping it simple
      await message.save();

      // Emit event
      const io = req.io;
      if (io) {
        io.to(message.sender.toString()).emit("message_deleted", { messageId: message._id });
        io.to(message.receiver.toString()).emit("message_deleted", { messageId: message._id });
      }

      return res.json({ success: true, message: "Message deleted for everyone" });
    } else if (type === "me") {
      // Anyone involved can delete for themselves
      if (message.sender.toString() !== userId.toString() && message.receiver.toString() !== userId.toString()) {
        return res.status(403).json({ success: false, message: "Unauthorized to delete this message" });
      }

      if (!message.deletedFor.includes(userId)) {
        message.deletedFor.push(userId);
        await message.save();
      }

      return res.json({ success: true, message: "Message deleted for you" });
    } else {
      return res.status(400).json({ success: false, message: "Invalid delete type" });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Edit a message
// @route   PUT /api/messages/:messageId
// @access  Private
const editMessage = async (req, res) => {
  try {
    const { messageId } = req.params;
    const { content } = req.body;
    const userId = req.user._id;

    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({ success: false, message: "Message not found" });
    }

    if (message.sender.toString() !== userId.toString()) {
      return res.status(403).json({ success: false, message: "Unauthorized to edit this message" });
    }

    if (message.isDeleted) {
      return res.status(400).json({ success: false, message: "Cannot edit a deleted message" });
    }

    message.content = content?.trim() || "";
    message.isEdited = true;
    await message.save();

    // Re-populate and emit
    const populated = await Message.findById(message._id)
      .populate("sender", "username avatar isOnline")
      .populate("receiver", "username avatar isOnline");

    const io = req.io;
    if (io) {
      io.to(message.sender._id.toString()).emit("message_edited", populated);
      io.to(message.receiver._id.toString()).emit("message_edited", populated);
    }

    res.json({ success: true, data: populated });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Clear chat with specific user
// @route   DELETE /api/messages/chat/:userId
// @access  Private
const clearChat = async (req, res) => {
  try {
    const { userId } = req.params;

    // Find all messages between the two users
    const messages = await Message.find({
      $or: [
        { sender: req.user._id, receiver: userId },
        { sender: userId, receiver: req.user._id },
      ],
      deletedFor: { $ne: req.user._id },
    });

    if (messages.length === 0) {
      return res.json({ success: true, message: "Chat already clear" });
    }

    // Add current user to deletedFor array of all found messages
    await Message.updateMany(
      { _id: { $in: messages.map(m => m._id) } },
      { $addToSet: { deletedFor: req.user._id } }
    );

    res.json({ success: true, message: "Chat cleared successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    React to a message
// @route   PUT /api/messages/:id/react
// @access  Private
const reactToMessage = async (req, res) => {
  try {
    const { emoji } = req.body;
    const messageId = req.params.id || req.params.messageId;
    const userId = req.user._id;

    if (!emoji) {
      return res.status(400).json({ success: false, message: "Emoji is required" });
    }

    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({ success: false, message: "Message not found" });
    }

    if (message.deletedFor.includes(userId)) {
      return res.status(400).json({ success: false, message: "Message unavailable" });
    }

    const existingReactionIndex = message.reactions.findIndex(
      (r) => r.user.toString() === userId.toString()
    );

    if (existingReactionIndex > -1) {
      if (message.reactions[existingReactionIndex].emoji === emoji) {
        message.reactions.splice(existingReactionIndex, 1);
      } else {
        message.reactions[existingReactionIndex].emoji = emoji;
      }
    } else {
      message.reactions.push({ emoji, user: userId });
    }

    await message.save();

    const updatedMessage = await Message.findById(messageId)
      .populate("sender", "username avatar")
      .populate("receiver", "username avatar");

    const io = req.io;
    if (io) {
      io.to(message.sender._id.toString()).emit("message_reaction", updatedMessage);
      io.to(message.receiver._id.toString()).emit("message_reaction", updatedMessage);
    }

    res.json({ success: true, data: updatedMessage });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { sendMessage, getMessages, getConversations, markAsRead, deleteMessage, editMessage, clearChat, reactToMessage };
