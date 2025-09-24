const express = require('express');
const router = express.Router();
const groupController = require('../controllers/groupController');
const authMiddleware = require('../middleware/authMiddleware');

// Get all groups
router.get('/all', authMiddleware, groupController.getAllGroups);

// Get groups managed by the user (filtered by admin role)
router.get('/admin/:userId', authMiddleware, groupController.getAdminGroups);

// Get all channels in a group
router.get('/:groupId/channels', groupController.getGroupChannels);

// Create a new group
router.post('/create', authMiddleware, groupController.createGroup);

// Delete a group
router.delete('/delete/:id', authMiddleware, groupController.deleteGroup);

// Add a member to a group
router.post('/add-member', authMiddleware, groupController.addMemberToGroup);

// Add an admin to a group
router.post('/add-admin', authMiddleware, groupController.addAdminToGroup);

// Remove an admin from a group
router.post('/remove-admin', authMiddleware, groupController.removeAdminFromGroup);

// Remove a member from a group
router.post('/remove-member', authMiddleware, groupController.removeMemberFromGroup);

// Create a new channel inside a group
router.post('/:groupId/channels/create', authMiddleware, groupController.createChannelInGroup);

// Delete a channel inside a group
router.delete('/:groupId/channels/delete/:channelId', authMiddleware, groupController.deleteChannelInGroup);

// Leave group as an admin
router.post('/:groupId/leaveAdmin', authMiddleware, groupController.leaveGroupAdmin);

// Leave group as a member
router.post('/:groupId/leave', authMiddleware, groupController.leaveGroup);

module.exports = router;
