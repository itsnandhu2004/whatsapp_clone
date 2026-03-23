const jwt = require("jsonwebtoken");
const User = require("../models/User");

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || "fallback_secret", {
    expiresIn: "7d",
  });
};

// @desc    Register a new user
// @route   POST /api/users/register
// @access  Public
const register = async (req, res) => {
  try {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "Please provide username, email, and password",
      });
    }

    const userExists = await User.findOne({ $or: [{ email }, { username }] });
    if (userExists) {
      return res.status(400).json({
        success: false,
        message:
          userExists.email === email
            ? "Email already in use"
            : "Username already taken",
      });
    }

    const user = await User.create({ username, email, password });

    res.status(201).json({
      success: true,
      data: {
        user,
        token: generateToken(user._id),
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Login user
// @route   POST /api/users/login
// @access  Public
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Please provide email and password",
      });
    }

    const user = await User.findOne({ email }).select("+password");
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    // Update online status
    user.isOnline = true;
    await user.save();

    res.json({
      success: true,
      data: {
        user,
        token: generateToken(user._id),
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get current user profile
// @route   GET /api/users/me
// @access  Private
const getMe = async (req, res) => {
  res.json({ success: true, data: req.user });
};

// @desc    Get all users except current user
// @route   GET /api/users
// @access  Private
const getAllUsers = async (req, res) => {
  try {
    const users = await User.find({ _id: { $ne: req.user._id } }).select(
      "-password"
    );
    res.json({ success: true, data: users });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Logout user
// @route   POST /api/users/logout
// @access  Private
const logout = async (req, res) => {
  try {
    await User.findByIdAndUpdate(req.user._id, {
      isOnline: false,
      lastSeen: new Date(),
    });
    res.json({ success: true, message: "Logged out successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update user status/avatar
// @route   PUT /api/users/me
// @access  Private
const updateProfile = async (req, res) => {
  try {
    const { status, avatar, username } = req.body;
    const updates = {};
    if (status !== undefined) updates.status = status;
    if (avatar !== undefined) updates.avatar = avatar;

    if (username !== undefined) {
      if (username.trim() === "") {
        return res.status(400).json({ success: false, message: "Username cannot be empty" });
      }
      const existingUser = await User.findOne({ username });
      if (existingUser && existingUser._id.toString() !== req.user._id.toString()) {
        return res.status(400).json({ success: false, message: "Username already taken" });
      }
      updates.username = username;
    }

    const user = await User.findByIdAndUpdate(req.user._id, updates, {
      new: true,
    });
    res.json({ success: true, data: user });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
// @desc    Upload user avatar
// @route   PUT /api/users/avatar
// @access  Private
const uploadAvatar = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: "No image provided" });
    }
    const avatarUrl = req.file.path;
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { avatar: avatarUrl },
      { new: true }
    );
    res.json({ success: true, data: user });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
// @desc    Block a user
// @route   PUT /api/users/block/:userId
// @access  Private
const blockUser = async (req, res) => {
  try {
    const { userId } = req.params;
    if (userId.toString() === req.user._id.toString()) {
      return res.status(400).json({ success: false, message: "Cannot block yourself" });
    }
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { $addToSet: { blockedUsers: userId } },
      { new: true }
    );
    res.json({ success: true, data: user });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Unblock a user
// @route   PUT /api/users/unblock/:userId
// @access  Private
const unblockUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { $pull: { blockedUsers: userId } },
      { new: true }
    );
    res.json({ success: true, data: user });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
// @desc    Archive a chat
// @route   PUT /api/users/archive/:userId
// @access  Private
const archiveChat = async (req, res) => {
  try {
    const { userId } = req.params;
    if (userId.toString() === req.user._id.toString()) {
      return res.status(400).json({ success: false, message: "Cannot archive yourself" });
    }
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { $addToSet: { archivedChats: userId } },
      { new: true }
    );
    res.json({ success: true, data: user });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Unarchive a chat
// @route   PUT /api/users/unarchive/:userId
// @access  Private
const unarchiveChat = async (req, res) => {
  try {
    const { userId } = req.params;
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { $pull: { archivedChats: userId } },
      { new: true }
    );
    res.json({ success: true, data: user });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { register, login, getMe, getAllUsers, logout, updateProfile, uploadAvatar, blockUser, unblockUser, archiveChat, unarchiveChat };
