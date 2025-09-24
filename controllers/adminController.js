// src/app/controllers/adminController.js
const Channel = require('../models/channel');
const User = require('../models/user');
const Group = require('../models/group');

// Create Channel
exports.createChannel = async (req, res) => {
  try {
    const { name, description } = req.body;
    // Verify if the requester is an admin
    if (req.user.roles[0] !== 'admin' && req.user.roles[0] !== 'superadmin') {
      return res.status(403).json({ message: 'Permission denied' });
    }

    // Create new channel
    const newChannel = new Channel({ name, description });
    await newChannel.save();

    res.status(201).json(newChannel);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};

// Add Admin to Channel
exports.addAdmin = async (req, res) => {
  try {
    const { channelId, userId } = req.body;
    const channel = await Channel.findById(channelId);
    const user = await User.findById(userId);
    if (!channel) {
      return res.status(404).json({ message: 'Channel not found' });
    }

    // Verify if the requester is a superadmin
    if (req.user.roles[0] !== 'superadmin') {
      return res.status(403).json({ message: 'Permission denied' });
    }

    if (!channel.admins.includes(userId)) {
      channel.admins.push(userId);  // Add user as admin
      await channel.save();
      if (user.roles[0] !== 'admin') user.roles[0] = 'admin';

      await user.save();
      res.status(200).json({ message: 'User added as admin', channel });
    } else {
      res.status(400).json({ message: 'User is already an admin' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};

// Remove Admin from Channel and Demote if Not Admin in Any Channel
exports.removeAdmin = async (req, res) => {
  try {
    const { channelId, userId } = req.body;

    const channel = await Channel.findById(channelId).populate('admins');
    const user = await User.findById(userId);

    if (!channel) {
      return res.status(404).json({ message: 'Channel not found' });
    }

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Verify if the requester is a superadmin
    if (req.user.roles[0] !== 'superadmin') {
      return res.status(403).json({ message: 'Permission denied' });
    }

    // Check if the user is currently an admin in the channel
    if (channel.admins.some(admin => admin._id.toString() === userId)) {
      // Remove user from admins in this channel
      channel.admins = channel.admins.filter(admin => admin._id.toString() !== userId);
      await channel.save();

      // Check if the user is still an admin in any other channel or group
      const otherChannels = await Channel.find({ admins: userId });
      const otherGroups = await Group.find({ admins: userId });

      if (otherChannels.length === 0 && otherGroups === 0) {
        // If the user is not an admin anywhere else, demote them to 'user'
        user.roles[0] = 'user';
        await user.save();
      }

      res.status(200).json({ message: 'User removed as admin and role updated', channel, user });
    } else {
      res.status(400).json({ message: 'User is not an admin' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};

// Add Member to Channel
exports.addMember = async (req, res) => {
  try {
    const { channelId, userId } = req.body;
    const channel = await Channel.findById(channelId);

    if (!channel) {
      return res.status(404).json({ message: 'Channel not found' });
    }

    // Verify if the requester is an admin of the channel
    if (req.user.roles[0] !== 'admin' && req.user.roles[0] !== 'superadmin') {
      return res.status(403).json({ message: 'Permission denied' });
    }

    if (!channel.members.includes(userId)) {
      channel.members.push(userId);  // Add user as member
      await channel.save();
      res.status(200).json({ message: 'User added as member', channel });
    } else {
      res.status(400).json({ message: 'User is already a member' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};

// Delete Channel
exports.deleteChannel = async (req, res) => {
  try {
    const { channelId } = req.body;  // Get channelId from request body

    // Verify if the requester is an admin
    if (req.user.roles[0] !== 'admin' && req.user.roles[0] !== 'superadmin') {
      return res.status(403).json({ message: 'Permission denied' });
    }

    const channel = await Channel.findByIdAndDelete(channelId);
    if (!channel) {
      return res.status(404).json({ message: 'Channel not found' });
    }

    res.status(200).json({ message: 'Channel deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};

// Remove Member from Channel
exports.removeMember = async (req, res) => {
  try {
    const { channelId, userId } = req.body;
    const channel = await Channel.findById(channelId);

    if (!channel) {
      return res.status(404).json({ message: 'Channel not found' });
    }

    // Verify if the requester is an admin of the channel
    if (req.user.roles[0] !== 'admin' && req.user.roles[0] !== 'superadmin') {
      return res.status(403).json({ message: 'Permission denied' });
    }

    if (channel.members.includes(userId)) {
      channel.members = channel.members.filter(id => id.toString() !== userId);  // Remove user from members
      await channel.save();
      res.status(200).json({ message: 'User removed from channel', channel });
    } else {
      res.status(400).json({ message: 'User is not a member' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};

// Get all users
exports.getAllUsers = async (req, res) => {
  try {
    const userId = req.user._id; 
    const users = await User.find();  // Exclude current user
    res.status(200).json(users);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};

// Get all channels
exports.getAllChannels = async (req, res) => {
  try {
    const role = req.user.roles[0];  // Get the role from the authenticated user
    const userId = req.user._id;     // Get the user ID from the request

    let channels = [];

    if (role === 'superadmin') {
      // Superadmin can see all channels
      channels = await Channel.find()
        .populate('members', 'username roles')
        .populate('admins', 'username roles');
    } else if (role === 'admin') {
      // Admin can only see the channels they are a part of (as admin or member)
      channels = await Channel.find({
        $or: [
          { admins: userId },   // Channels where the user is an admin
          { members: userId }   // Channels where the user is a member
        ]
      })
        .populate('members', 'username roles')
        .populate('admins', 'username roles');
    } else {
      // Regular users only see the channels they are members of
      channels = await Channel.find({ members: userId })
        .populate('members', 'username roles')
        .populate('admins', 'username roles');
    }
   
    res.status(200).json(channels);  // Send the filtered list of channels
  } catch (error) {
    res.status(500).json({ message: 'Error fetching channels', error });
  }
};

// Update user role
exports.updateUserRole = async (req, res) => {
  try {
    const { userId, newRole } = req.body;
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (newRole === 'user') {
      // ✅ Check if this user is still an admin of any group/channel
      const isGroupAdmin = await Group.exists({ admins: userId });
      if (isGroupAdmin) {
        user.roles = ['admin']; // Demote to admin
      } else {
        user.roles = ['user'];  // No admin duties, fully demote to user
      }
    } else {
      // For other roles, directly assign
      user.roles = [newRole];
    }

    await user.save();
    res.json({ success: true, user });
  } catch (err) {
    console.error('[updateUserRole] Error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};
