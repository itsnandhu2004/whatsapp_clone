const Status = require("../models/Status");
const User = require("../models/User");

// @desc    Create a new status
// @route   POST /api/status
// @access  Private
const createStatus = async (req, res) => {
  try {
    const { content, mediaType } = req.body;
    let mediaUrl = "";

    if (req.file) {
      mediaUrl = req.file.path;
    }

    if (!mediaUrl && (!content || content.trim() === "")) {
      return res.status(400).json({ success: false, message: "Status cannot be empty" });
    }

    const mType = mediaType || (mediaUrl ? "image" : "text");

    const status = await Status.create({
      user: req.user._id,
      mediaUrl,
      mediaType: mType,
      content: content?.trim() || "",
    });

    const populatedStatus = await Status.findById(status._id).populate("user", "username avatar");

    // Optionally emit event via socket
    const io = req.io;
    if (io) {
      io.emit("new_status", populatedStatus);
    }

    res.status(201).json({ success: true, data: populatedStatus });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get all active statuses grouped by user
// @route   GET /api/status
// @access  Private
const getStatuses = async (req, res) => {
  try {
    // Fetch statuses that haven't expired
    const activeStatuses = await Status.find({
      expiresAt: { $gt: new Date() }
    })
      .populate("user", "username avatar")
      .populate("viewers", "username avatar")
      .sort({ createdAt: 1 });

    // Group by user
    const userGroups = {};
    activeStatuses.forEach((status) => {
      // Ensure user exists (handle orphaned statuses just in case)
      if (!status.user) return;
      
      const userId = status.user._id.toString();
      if (!userGroups[userId]) {
        userGroups[userId] = {
          user: status.user,
          statuses: [],
        };
      }
      userGroups[userId].statuses.push(status);
    });

    // Convert to array and put the current user first, then sort by latest update
    const groupedArray = Object.values(userGroups).sort((a, b) => {
      const aIsMe = a.user._id.toString() === req.user._id.toString();
      const bIsMe = b.user._id.toString() === req.user._id.toString();
      if (aIsMe) return -1;
      if (bIsMe) return 1;
      
      const aLatest = new Date(a.statuses[a.statuses.length - 1].createdAt);
      const bLatest = new Date(b.statuses[b.statuses.length - 1].createdAt);
      return bLatest - aLatest;
    });

    res.json({ success: true, data: groupedArray });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Mark a status as viewed
// @route   PUT /api/status/:id/view
// @access  Private
const viewStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    const status = await Status.findById(id);
    if (!status) {
      return res.status(404).json({ success: false, message: "Status not found" });
    }

    if (!status.viewers.includes(userId) && status.user.toString() !== userId.toString()) {
      status.viewers.push(userId);
      await status.save();
      
      const io = req.io;
      if (io) {
        io.emit("status_viewed", { statusId: status._id });
      }
    }

    res.json({ success: true, data: status });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete a status
// @route   DELETE /api/status/:id
// @access  Private
const deleteStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const status = await Status.findById(id);

    if (!status) {
      return res.status(404).json({ success: false, message: "Status not found" });
    }

    if (status.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: "Not authorized to delete this status" });
    }

    await status.deleteOne();

    const io = req.io;
    if (io) {
      io.emit("status_deleted", { statusId: id, userId: req.user._id });
    }

    res.json({ success: true, message: "Status deleted" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { createStatus, getStatuses, viewStatus, deleteStatus };
