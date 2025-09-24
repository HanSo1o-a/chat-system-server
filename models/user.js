// server/models/user.js
const mongoose = require('mongoose');

// Define the user model
const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true }, // Username, unique
  email: { type: String, required: true, unique: true },    // Email, unique
  password: { type: String, required: true },               // Password
  roles: { type: [String], default: ['user'] },             // Roles, default is 'user'
  groups: { type: [String], default: [] },                  // Groups, groups the user is a part of
});

// Create and export the user model
const User = mongoose.model('User', userSchema);
module.exports = User;
