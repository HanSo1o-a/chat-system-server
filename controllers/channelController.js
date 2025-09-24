// src/app/controllers/channelController.js
const Channel = require('../models/channel');
const User = require('../models/user');
const fs = require('fs'); // Used for file operations
const path = require('path');
const { v4: uuidv4 } = require('uuid'); // Used for generating unique filenames
const Room = require('../models/room');

// Get all peerIds and usernames in the room
exports.getPeerIdsInRoom = async (req, res) => {
  let { channelId } = req.params;
  if (channelId instanceof Object) {
    channelId = channelId.toString();
  }

  try {
    const room = await Room.findOne({ roomId: channelId });

    if (!room) {
      return res.status(404).send({ message: 'Room not found' });
    }

    const users = room.users.map(user => ({
      peerId: user.peerId,
      username: user.username,
    }));

    res.status(200).send(users);
  } catch (err) {
    console.error(err);
    res.status(500).send({ message: 'Error fetching peer IDs' });
  }
};

// Upload peerId to the specified room
exports.uploadPeerId = async (req, res) => {
  const { peerId, channelId, socketId } = req.body;
  const username = req.user.username;  // Extract username from token

  try {
    let room = await Room.findOne({ roomId: channelId });

    if (!room) {
      // If room does not exist, create a new one
      room = new Room({
        roomId: channelId,
        users: [{ peerId, username, socketId }]
      });
      await room.save();
    } else {
      // If room exists, check if user already joined
      const userExists = room.users.some(u => u.peerId === peerId);
      if (!userExists) {
        room.users.push({ peerId, username, socketId });
        await room.save();
      }
    }

    // ✅ Return the updated user list so the frontend always has the latest roomUsers
    res.status(200).json({
      message: '✅ Peer ID uploaded successfully',
      users: room.users
    });
  } catch (err) {
    console.error('❌ uploadPeerId error:', err);
    res.status(500).json({ message: 'Error uploading Peer ID' });
  }
};

// Delete peerId from room
exports.deletePeerId = async (req, res) => {
  const peerId   = req.body.peerId;
  const channelId  = req.body.channelId;

  const currentUser = req.user.username; 
  
  try {
    // Find the room and remove the user
    const room = await Room.findOne({ roomId: channelId });

    if (!room) {
      return res.status(404).send({ message: 'Room not found' });
    }

    // Remove the user by peerId
    room.users = room.users.filter(user => user.peerId !== peerId);
    await room.save();

    res.status(200).send({ message: 'User removed from room' });
  } catch (err) {
    console.error(err);
    res.status(500).send({ message: 'Error removing user from room' });
  }
};

// Image upload with multer
const multer = require('multer'); // Import multer
// Initialize multer storage configuration
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'public/uploads/');  // Set upload directory
  },
  filename: function (req, file, cb) {
    const fileExtension = file.originalname.split('.').pop();  // Extract file extension
    const uniqueFilename = `${uuidv4()}.${fileExtension}`;     // Generate unique filename
    cb(null, uniqueFilename);
  }
});
const upload = multer({ storage: storage });

// Upload image
exports.uploadImage = (req, res) => {
  const username = req.user.username;  // Extract username from token
  
  if (!req.file) {
    return res.status(400).json({ success: false, message: 'No file uploaded' });
  }

  const imageUrl = `/uploads/${req.file.filename}`;  // URL of uploaded image

  res.status(200).json({
    success: true,
    fileUrl: imageUrl,
    username
  });
};

// Upload video
exports.uploadVideo = (req, res) => {
  const username = req.user.username;  // Extract username from token
  
  if (!req.file) {
    return res.status(400).json({ success: false, message: 'No file uploaded' });
  }

  const videoUrl = `/uploads/${req.file.filename}`;  // URL of uploaded video

  res.status(200).json({
    success: true,
    fileUrl: videoUrl,
    username
  });
};

// Create a new channel under a group
exports.createChannel = async (req, res) => {
  try {
    const { groupId } = req.params;
    const { name, description } = req.body;

    const group = await Group.findById(groupId);
    if (!group) return res.status(404).json({ error: 'Group not found' });

    // Only superadmin or group admin can create channels
    if (!(req.user.role === 'superadmin' || group.admins.includes(req.user._id))) {
      return res.status(403).json({ error: 'No permission' });
    }

    const channel = await Channel.create({
      name,
      description,
      createdBy: req.user._id,
      group: group._id
    });

    group.channels.push(channel._id);
    await group.save();

    res.json(channel);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get all channels (filtered by role)
exports.getAllChannels = async (req, res) => {
  try {
    const role = req.headers.role || 'user';  // Role comes from headers
    const userId = req.user.userId;           // User ID extracted from token

    let channels = [];

    if (role === 'superadmin') {
      // Superadmins see all channels
      channels = await Channel.find();
    } else if (role === 'admin') {
      // Admins see only channels they manage or have joined
      channels = await Channel.find({
        $or: [
          { admins: userId },
          { members: userId }
        ]
      });
    } else {
      // Regular users see only channels they are members of
      channels = await Channel.find({ members: userId });
    }

    res.status(200).json(channels);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching channels', error });
  }
};

// Get a specific channel
exports.getChannel = async (req, res) => {
  try {
    const channel = await Channel.findById(req.params.channelId).populate('group');
    if (!channel) return res.status(404).json({ error: 'Channel not found' });

    res.json(channel);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Add member to channel
exports.addMember = async (req, res) => {
  try {
    const channel = await Channel.findById(req.params.channelId);
    if (!channel) {
      return res.status(404).json({ message: 'Channel not found' });
    }
    const user = await User.findById(req.body.userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    channel.members.push(user._id);
    await channel.save();
    res.status(200).json(channel);
  } catch (error) {
    res.status(500).json({ message: 'Error adding member', error });
  }
};

// Delete channel
exports.deleteChannel = async (req, res) => {
  try {
    const channel = await Channel.findByIdAndDelete(req.params.channelId);
    if (!channel) {
      return res.status(404).json({ message: 'Channel not found' });
    }
    res.status(200).json({ message: 'Channel deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting channel', error });
  }
};

// Leave channel
exports.leaveChannel = async (req, res) => {
  try {
    const userId = req.user.id;   // Extracted from token
    const { channelId } = req.body;

    if (!channelId) {
      return res.status(400).json({ success: false, message: 'channelId is required' });
    }

    // Remove user from channel members
    await Channel.findByIdAndUpdate(
      channelId,
      { $pull: { members: userId } },
      { new: true }
    );

    // Also remove channel from user's document (if channels field exists)
    await User.findByIdAndUpdate(
      userId,
      { $pull: { channels: channelId } },
      { new: true }
    );

    return res.status(200).json({ success: true, message: 'Left channel successfully' });
  } catch (err) {
    console.error('[leaveChannel] Error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};
