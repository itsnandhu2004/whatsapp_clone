const Call = require("../models/Call");

// @desc    Log a call
// @route   POST /api/calls
// @access  Private
const logCall = async (req, res) => {
  try {
    const { receiverId, callType, status, duration } = req.body;
    
    const call = await Call.create({
      caller: req.user._id,
      receiver: receiverId,
      callType,
      status, // "completed", "missed", "rejected"
      duration: duration || 0
    });
    
    res.status(201).json({ success: true, data: call });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get user's call history
// @route   GET /api/calls
// @access  Private
const getCallHistory = async (req, res) => {
  try {
    const calls = await Call.find({
      $or: [{ caller: req.user._id }, { receiver: req.user._id }]
    })
      .populate("caller", "username avatar")
      .populate("receiver", "username avatar")
      .sort({ createdAt: -1 });

    res.json({ success: true, data: calls });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { logCall, getCallHistory };
