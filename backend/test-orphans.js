const mongoose = require('mongoose');
require('dotenv').config();

const User = require('./src/models/User');
const Message = require('./src/models/Message');

async function test() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    const msgs = await Message.find().populate('sender').populate('receiver');
    let orphaned = 0;
    for (const msg of msgs) {
      if (!msg.sender || !msg.receiver) {
        orphaned++;
        console.log(`Orphaned message: ${msg._id}, sender: ${msg.sender ? msg.sender._id : 'null'}, receiver: ${msg.receiver ? msg.receiver._id : 'null'}`);
      }
    }
    console.log(`Found ${orphaned} orphaned messages out of ${msgs.length}`);
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}
test();
