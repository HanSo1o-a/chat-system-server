// src/app/controllers/groupController.js
const Group = require('../models/group');
const User = require('../models/user');
const Channel = require('../models/channel');

// Permission check: Verify if the user is an admin or superadmin
const checkAdminOrSuperadmin = async (req) => {
  let userRole;

  // If req.user exists, directly get the role from req.user
  if (req.user && req.user.roles) {
    userRole = req.user.roles[0];
  }

  // Check user role, ensuring it is either admin or superadmin
  if (userRole === 'superadmin' || userRole === 'admin') {
    return userRole;
  }

  throw new Error('Access denied. You need to be an admin or superadmin to perform this action.');
};

const getGroupChannels = async (req, res) => {
  try {
    const group = await Group.findById(req.params.groupId).populate('channels');
    if (!group) return res.status(404).json({ error: 'Group not found' });

    res.json(group.channels);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get all groups with role-based access
const getAllGroups = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    let groups;

    if (req.user.roles.includes('superadmin')) {
      // ✅ Superadmin: can view all groups
      groups = await Group.find()
        .populate('admins', 'username')
        .populate('members', 'username')
        .populate('channels', 'name description');
    } else if (req.user.roles.includes('admin')) {
      // ✅ Admin: can view groups they manage or belong to
      groups = await Group.find({
        $or: [{ admins: req.user._id }, { members: req.user._id }]
      })
        .populate('admins', 'username')
        .populate('members', 'username')
        .populate('channels', 'name description');
    } else {
      // ✅ Regular user: can only view groups they belong to
      groups = await Group.find({ members: req.user._id })
        .populate('admins', 'username')
        .populate('members', 'username')
        .populate('channels', 'name description');
    }

    res.status(200).json(groups);
  } catch (err) {
    console.error('[getAllGroups] Error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// Get groups managed by the user (filtered by admin role)
const getAdminGroups = async (req, res) => {
  try {
    await checkAdminOrSuperadmin(req);

    const userId = req.params.userId;
    const groups = await Group.find({ admins: userId })
      .populate('admins', 'username')
      .populate('members', 'username')
      .populate('channels', 'name description');

    if (!groups) {
      return res.status(404).json({ success: false, message: 'No groups found for this admin.' });
    }
    res.status(200).json(groups);
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Create new group
const createGroup = async (req, res) => {
  try {
    await checkAdminOrSuperadmin(req);  // Permission check inside controller

    const { name, description, adminIds } = req.body;
    const group = new Group({
      name,
      description,
      admins: adminIds,  // Admin ID array
      members: adminIds,  // Initially, admins are also members
    });

    await group.save();
    res.status(200).json({ success: true, group });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Delete group
const deleteGroup = async (req, res) => {
  try {
    await checkAdminOrSuperadmin(req);

    const groupId = req.params.id;
    await Group.findByIdAndDelete(groupId);
    res.status(200).json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Add member to group
const addMemberToGroup = async (req, res) => {
  try {
    await checkAdminOrSuperadmin(req);

    const { groupId, userId } = req.body;
    const group = await Group.findById(groupId);
    if (!group) {
      return res.status(404).json({ success: false, message: 'Group not found' });
    }

    if (!group.members.includes(userId)) {
      group.members.push(userId);  // Add user to members
      await group.save();
      res.status(200).json({ success: true, group });
    } else {
      res.status(400).json({ success: false, message: 'User is already a member' });
    }
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Add admin to group
const addAdminToGroup = async (req, res) => {
  try {
    await checkAdminOrSuperadmin(req);

    const { groupId, userId } = req.body;
    const group = await Group.findById(groupId);
    const user = await User.findById(userId);

    if (!group) {
      return res.status(404).json({ success: false, message: 'Group not found' });
    }

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Add as admin if not already
    if (!group.admins.includes(userId)) {
      group.admins.push(userId);
      // Remove from members list if present
      const memberIndex = group.members.indexOf(userId);
      if (memberIndex !== -1) {
        group.members.splice(memberIndex, 1);
      }
      await group.save();

      // Update user role to admin if needed
      if (user.roles[0] === 'user') {
        user.roles[0] = 'admin';
        await user.save();
      }

      res.status(200).json({ success: true, group });
    } else {
      res.status(400).json({ success: false, message: 'User is already an admin' });
    }
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Remove admin from group
const removeAdminFromGroup = async (req, res) => {
  try {
    await checkAdminOrSuperadmin(req);

    const { groupId, userId } = req.body;
    const group = await Group.findById(groupId);
    const user = await User.findById(userId);

    if (!group) {
      return res.status(404).json({ success: false, message: 'Group not found' });
    }

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Remove user from admins
    const adminIndex = group.admins.indexOf(userId);
    if (adminIndex !== -1) {
      group.admins.splice(adminIndex, 1);
      await group.save();

      // Check if user is still admin in other groups/channels
      const otherGroups = await Group.find({ admins: userId });
      const otherChannels = await Channel.find({ admins: userId });
      if (otherGroups.length === 0 && otherChannels.length === 0) {
        if (user.roles[0] === 'admin') {
          user.roles[0] = 'user';
          await user.save();
        }
      }

      res.status(200).json({ success: true, group });
    } else {
      res.status(400).json({ success: false, message: 'User is not an admin' });
    }
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Remove member from group
const removeMemberFromGroup = async (req, res) => {
  try {
    await checkAdminOrSuperadmin(req);

    const { groupId, userId } = req.body;
    const group = await Group.findById(groupId);
    if (!group) {
      return res.status(404).json({ success: false, message: 'Group not found' });
    }

    const memberIndex = group.members.indexOf(userId);
    if (memberIndex !== -1) {
      group.members.splice(memberIndex, 1);  // Remove from members
      await group.save();
      res.status(200).json({ success: true, group });
    } else {
      res.status(400).json({ success: false, message: 'User is not a member' });
    }
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Create a channel inside a group
const createChannelInGroup = async (req, res) => {
  const { groupId } = req.params;
  const { name, description } = req.body;

  try {
    const group = await Group.findById(groupId);
    if (!group) {
      return res.status(404).json({ success: false, message: 'Group not found' });
    }

    const channel = new Channel({ name, description, group: groupId });
    await channel.save();

    group.channels.push(channel._id);
    await group.save();

    res.json({ success: true, channel });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({ success: false, message: 'Channel name already exists in this group!' });
    }
    console.error('[createChannelInGroup] Error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// Delete a channel from a group
const deleteChannelInGroup = async (req, res) => {
  const { groupId, channelId } = req.params;

  try {
    const group = await Group.findById(groupId);
    if (!group) {
      return res.status(404).json({ success: false, message: 'Group not found' });
    }

    // Remove channel reference from group
    group.channels = group.channels.filter(ch => ch.toString() !== channelId);
    await group.save();

    // Delete channel document
    await Channel.findByIdAndDelete(channelId);

    res.json({ success: true, message: 'Channel deleted successfully' });
  } catch (err) {
    console.error('[deleteChannelInGroup] Error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Regular user leaves a group
const leaveGroup = async (req, res) => {
  try {
    const userId = req.user.id;
    const { groupId } = req.params;

    const group = await Group.findById(groupId);
    if (!group) {
      return res.status(404).json({ success: false, message: 'Group not found' });
    }

    // If user is a member, remove them
    group.members = group.members.filter(m => m.toString() !== userId);

    await group.save();

    res.json({ success: true, message: 'Left group successfully' });
  } catch (err) {
    console.error('[leaveGroup] Error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// Admin leaves a group
const leaveGroupAdmin = async (req, res) => {
  try {
    const userId = req.user.id;
    const { groupId } = req.params;

    const group = await Group.findById(groupId);
    if (!group) {
      return res.status(404).json({ success: false, message: 'Group not found' });
    }

    // If user is an admin, remove them
    group.admins = group.admins.filter(a => a.toString() !== userId);
    await group.save();

    // Check if user is still admin in other groups
    const otherAdminGroups = await Group.find({ admins: userId });
    if (otherAdminGroups.length === 0) {
      // If not admin anywhere else, downgrade to user
      await User.findByIdAndUpdate(userId, { roles: ['user'] });
    }

    res.json({ success: true, message: 'Left group as admin successfully' });
  } catch (err) {
    console.error('[leaveGroupAdmin] Error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = {
  checkAdminOrSuperadmin,
  getAllGroups,
  getAdminGroups,
  createGroup,
  deleteGroup,
  addMemberToGroup,
  addAdminToGroup,
  removeAdminFromGroup,
  removeMemberFromGroup,
  getGroupChannels,
  createChannelInGroup,
  deleteChannelInGroup,
  leaveGroupAdmin,
  leaveGroup
};
