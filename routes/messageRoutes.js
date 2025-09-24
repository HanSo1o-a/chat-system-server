const express = require('express');
const router = express.Router();
const { getMessages, sendMessage } = require('../controllers/messageController');


router.get('/channels/:channelId/messages', getMessages);

router.post('/channels/:channelId/messages', sendMessage);

module.exports = router;
