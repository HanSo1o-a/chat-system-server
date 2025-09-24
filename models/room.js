const mongoose = require('mongoose');

const roomSchema = new mongoose.Schema({
  roomId: { type: String, required: true, unique: true },
  users: [{ peerId: String, username: String,socketId: String}] ,
});

const Room = mongoose.model('Room', roomSchema);

module.exports = Room;
