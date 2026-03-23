const express = require("express");
const router = express.Router();
const { createStatus, getStatuses, viewStatus, deleteStatus } = require("../controllers/statusController");
const { protect } = require("../middleware/auth");
const { upload } = require("../utils/cloudinary");

router.post("/", protect, upload.single("media"), createStatus);
router.get("/", protect, getStatuses);
router.put("/:id/view", protect, viewStatus);
router.delete("/:id", protect, deleteStatus);

module.exports = router;
