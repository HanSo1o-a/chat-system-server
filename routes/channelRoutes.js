// server/routes/channelRoutes.js
const express = require('express');
const router = express.Router();
const channelController = require('../controllers/channelController');
const verifyToken = require('../middleware/verifyToken'); 
const { v4: uuidv4 } = require('uuid'); // Used to generate unique filenames
const multer = require('multer');
const Room = require('../models/room');
const authMiddleware = require('../middleware/authMiddleware'); 
const { createChannel, getChannel } = require('../controllers/channelController');

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, './server/public/uploads/');  // Set the storage directory for uploaded files
  },
  filename: function (req, file, cb) {
    const fileExtension = file.originalname.split('.').pop();  
    const uniqueFilename = `${uuidv4()}.${fileExtension}`;  
    cb(null, uniqueFilename);  
  }
});

const upload = multer({ storage });  

// Upload an image
router.post('/upload-image', verifyToken, upload.single('image'), (req, res) => {
  channelController.uploadImage(req, res);
});

// Upload a video
router.post('/upload-video', verifyToken, upload.single('video'), (req, res) => {
  channelController.uploadVideo(req, res);
});


// Get all channels
router.get('/', verifyToken, (req, res) => {    
  channelController.getAllChannels(req, res);
});

// Create a channel inside a group
router.post('/groups/:groupId/channels', createChannel);

// Get a single channel by ID
router.get('/:channelId', getChannel);

// Add a member to a channel
router.post('/:channelId/addMember', verifyToken, channelController.addMember);

// Delete a channel
router.delete('/:channelId', verifyToken, channelController.deleteChannel);

// Upload PeerId to a channel
router.post('/uploadPeerId', verifyToken, channelController.uploadPeerId);

// Notify the server when a user leaves the room
router.post('/userLeftPeer', verifyToken, channelController.deletePeerId);

// Get all peerIds in a channel room
router.get('/getPeerIds/:channelId', verifyToken, channelController.getPeerIdsInRoom);

// Leave a channel
router.post('/leave', verifyToken, channelController.leaveChannel);

module.exports = router;
