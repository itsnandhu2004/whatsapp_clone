const express = require("express");
const router = express.Router();
const {
  register,
  login,
  getMe,
  getAllUsers,
  logout,
  updateProfile,
  uploadAvatar,
  blockUser,
  unblockUser,
  archiveChat,
  unarchiveChat,
} = require("../controllers/userController");
const { protect } = require("../middleware/auth");
const { upload } = require("../utils/cloudinary");

router.post("/register", register);
router.post("/login", login);
router.post("/logout", protect, logout);
router.get("/me", protect, getMe);
router.put("/me", protect, updateProfile);
router.put("/avatar", protect, upload.single("avatar"), uploadAvatar);
router.get("/", protect, getAllUsers);
router.put("/block/:userId", protect, blockUser);
router.put("/unblock/:userId", protect, unblockUser);
router.put("/archive/:userId", protect, archiveChat);
router.put("/unarchive/:userId", protect, unarchiveChat);

module.exports = router;
