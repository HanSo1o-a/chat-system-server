const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const authMiddleware = require('../middleware/authMiddleware'); // Middleware to verify permissions

// Create channel
router.post('/create', authMiddleware, adminController.createChannel);

// Delete channel
router.post('/channels/delete', authMiddleware, adminController.deleteChannel);

// Get all channels
router.get('/', authMiddleware, adminController.getAllChannels);

// Get all users
router.get('/users', authMiddleware, adminController.getAllUsers); 

// Add admin to channel
router.post('/add-admin', authMiddleware, adminController.addAdmin);

// Remove admin from channel
router.post('/remove-admin', authMiddleware, adminController.removeAdmin);

// Add member to channel
router.post('/add-member', authMiddleware, adminController.addMember);

// Remove member from channel
router.post('/remove-member', authMiddleware, adminController.removeMember);

// Update user role
router.post('/update-role', authMiddleware, adminController.updateUserRole);

module.exports = router;
