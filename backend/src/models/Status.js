const mongoose = require("mongoose");

const statusSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    mediaUrl: {
      type: String,
      required: false,
    },
    mediaType: {
      type: String,
      enum: ["image", "video", "text"],
      required: true,
    },
    content: {
      type: String,
      default: "", // Background text or caption
    },
    viewers: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    expiresAt: {
      type: Date,
      default: () => new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
      index: { expires: "0s" }, // Auto delete document when this date is reached
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Status", statusSchema);
