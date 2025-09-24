// server/middleware/authMiddleware.js
const jwt = require('jsonwebtoken');
const User = require('../models/user');
const { getUsername,getUserID } = require('../models/user'); // 假设用户信息存储在内存中

module.exports = async (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');

  if (!token) {
    return res.status(401).json({ message: 'No token, authorization denied' });
  }

  try {
    const decoded = jwt.verify(token, '34fdg4rtzhs8t2#dfgdsf2!vkn34@123d'); 

    let user = getUsername(decoded.username);
    
    const role = user.roles[0];

    req.user = user;
    req.role = role;

    next();
  } catch (err) {
    res.status(401).json({ message: 'Token is not valid' });
  }
};
