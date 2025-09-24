// server/models/channel.js
const mongoose = require('mongoose');

const ChannelSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: String,
  group: { type: mongoose.Schema.Types.ObjectId, ref: 'Group', required: true },
  admins: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  members: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }]
});

ChannelSchema.index({ group: 1, name: 1 }, { unique: true });

module.exports = mongoose.model('Channel', ChannelSchema);
