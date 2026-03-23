const mongoose = require('mongoose');
require('dotenv').config();

const User = require('./src/models/User');
const Message = require('./src/models/Message');

async function test() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to MongoDB");
    const userCount = await User.countDocuments();
    const messageCount = await Message.countDocuments();
    console.log(`Users: ${userCount}, Messages: ${messageCount}`);
    
    // Sample a few users
    const users = await User.find().limit(2);
    console.log("Sample Users:", users.map(u => u.username));
    
    // Sample a few messages
    const msgs = await Message.find().limit(2).populate('sender', 'username').populate('receiver', 'username');
    console.log("Sample Messages:", msgs.map(m => `${m.sender?.username} -> ${m.receiver?.username}: ${m.content}`));
    
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}
test();
