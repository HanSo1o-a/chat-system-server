// src/routes/userRoutes.js
const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const verifyToken = require('../middleware/verifyToken');  // Import verifyToken middleware

// Register user
router.post('/register', userController.registerUser);

// Get all users
router.get('/users', verifyToken, userController.getAllUsers);

// Login user
router.post('/login', userController.loginUser);  // Added login route
router.get('/getUsernameByPeerId/:peerId', userController.getUsernameByPeerId);

module.exports = router;
