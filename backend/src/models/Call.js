const mongoose = require("mongoose");

const callSchema = new mongoose.Schema(
  {
    caller: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    receiver: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    callType: {
      type: String,
      enum: ["audio", "video"],
      required: true,
    },
    status: {
      type: String,
      enum: ["completed", "missed", "rejected"],
      required: true,
    },
    duration: {
      type: Number, // in seconds
      default: 0,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Call", callSchema);
