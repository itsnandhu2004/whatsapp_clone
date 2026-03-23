const express = require("express");
const router = express.Router();
const {
  sendMessage,
  getMessages,
  getConversations,
  markAsRead,
  deleteMessage,
  editMessage,
  clearChat,
  reactToMessage,
} = require("../controllers/messageController");
const { protect } = require("../middleware/auth");
const { uploadAttachment } = require("../utils/cloudinary");

router.use(protect);

router.get("/conversations", getConversations);
router.post("/", uploadAttachment.single("attachment"), sendMessage);
router.get("/:userId", getMessages);
router.put("/read/:userId", markAsRead);
router.delete("/:messageId", deleteMessage);
router.delete("/chat/:userId", clearChat);
router.put("/:messageId", editMessage);
router.put("/:messageId/react", reactToMessage);

module.exports = router;
