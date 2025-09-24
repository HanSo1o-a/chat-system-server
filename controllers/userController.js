// server/controllers/userController.js
const User = require('../models/user');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Room = require('../models/room');

// Register user
exports.registerUser = async (req, res) => {
  try {
    const { username, email, password } = req.body;

    // Check if the username already exists
    const existingUsername = await User.findOne({ username });
    if (existingUsername) {
      return res.status(400).json({ message: 'Username is already taken' });
    }

    // Check if the email already exists
    const existingEmail = await User.findOne({ email });
    if (existingEmail) {
      return res.status(400).json({ message: 'Email is already registered' });
    }

    // Encrypt the password using bcrypt
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create a new user and save
    const user = new User({ username, email, password: hashedPassword });
    await user.save();

    res.status(201).json(user);
  } catch (error) {
    console.log('Error occurred during registration:', error);  // Log detailed error
    res.status(500).json({ message: 'Server error', error });
  }
};

// Get username by peerId
exports.getUsernameByPeerId = async (req, res) => {
  const { peerId } = req.params;
  try {
    // Search inside Room.users for the matching peerId
    const room = await Room.findOne({ "users.peerId": peerId });

    if (!room) {
      return res.status(404).json({ message: 'User not found' });
    }

    const user = room.users.find(u => u.peerId === peerId);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    console.log(user.username);
    res.status(200).json({ username: user.username });
  } catch (err) {
    console.error('❌ getUsernameByPeerId error:', err);
    res.status(500).json({ message: 'Error fetching username' });
  }
};

// Get all users
exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.find();
    res.status(200).json(users);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};

// Login user
exports.loginUser = async (req, res) => {
  const { username, password } = req.body;

  try {
    // Find the user
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    console.log(user);

    // Compare password
    const isPasswordMatch = await bcrypt.compare(password, user.password);
    if (!isPasswordMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Handle role: If the role is an array, get the first role
    const role = Array.isArray(user.roles) ? user.roles[0] : user.roles;
    console.log(role);

    // Generate JWT containing userId, username, and role
    const token = jwt.sign(
      { 
        userId: user._id, 
        username: user.username, 
        role: role
      },
      '34fdg4rtzhs8t2#dfgdsf2!vkn34@123d',  // Secret key
      { expiresIn: '1h' }  // Set expiration time
    );

    // Successful login, return token and role
    res.status(200).json({
      message: 'Login successful!',
      token: token,
      role: role,
      username: user.username, 
    });

  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err });
  }
};
