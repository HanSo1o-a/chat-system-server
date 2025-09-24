const jwt = require('jsonwebtoken');

// Verify JWT
const verifyToken = (req, res, next) => {
  const token = req.header('Authorization')?.split(' ')[1];  // Extract Bearer token
  if (!token) {
    return res.status(403).json({ message: 'Access denied. No token provided.' });
  }

  try {
    const decoded = jwt.verify(token, '34fdg4rtzhs8t2#dfgdsf2!vkn34@123d');  // Verify token using the secret key
    req.user = decoded;  // Add decoded user information to the request
    next();  // Continue to the next middleware or route handler
  } catch (err) {
    res.status(400).json({ message: 'Invalid token' });
  }
};

module.exports = verifyToken;
