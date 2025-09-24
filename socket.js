const socketIo = require('socket.io');
const Channel = require('./models/channel');
const Message = require('./models/message');  // ✅ Message model for storing chat messages
const Room = require('./models/room');

module.exports = function (server) {
  const io = socketIo(server, {
    cors: {
      origin: "http://localhost:4200", // Allow Angular frontend
      methods: ["GET", "POST"],
      credentials: true
    }
  });

  let channels = {}; 
  let users = {};  // socket.id -> username

  io.listen(3001); // Start Socket.io server on port 3001

  io.on('connection', (socket) => {
    const username = socket.handshake.query.username || 'Anonymous';
    users[socket.id] = username;

    console.log('A user connected:', socket.id, 'Username:', username);

    // ========================
    // Join a channel (room)
    // ========================
    socket.on('joinRoom', async (channelId) => {
      if (!channels[channelId]) {
        channels[channelId] = [];
      }

      // Leave previous rooms
      for (let prevChannelId in channels) {
        const index = channels[prevChannelId].indexOf(socket.id);
        if (index > -1) {
          channels[prevChannelId].splice(index, 1);
          socket.leave(prevChannelId);
          socket.to(prevChannelId).emit('receiveMessage', { 
            username: 'System', 
            content: `${users[socket.id]} left the channel.` 
          });
        }
      }

      // If already in the channel, return
      if (channels[channelId].includes(socket.id)) {
        console.log(`User ${users[socket.id]} already in channel ${channelId}`);
        return;
      }

      // Join new channel
      channels[channelId].push(socket.id);
      socket.join(channelId);
      console.log(`User ${users[socket.id]} joined channel ${channelId}`);

      // Fetch recent messages (last 10)
      const recentMessages = await Message.find({ channel: channelId })
        .sort({ createdAt: -1 })
        .limit(10)
        .populate('sender', 'username');

      // Send welcome message
      socket.emit('receiveMessage', { username: 'System', content: `Welcome to channel ${channelId}` });

      // Send recent messages (reverse to chronological order)
      recentMessages.reverse().forEach(msg => {
        socket.emit('receiveMessage', { 
          username: msg.sender.username, 
          content: msg.content, 
          timestamp: msg.createdAt 
        });
      });

      // Notify others in the channel
      socket.to(channelId).emit('receiveMessage', { 
        username: 'System', 
        content: `${users[socket.id]} has joined the channel.` 
      });
    });

    // ========================
    // Send message
    // ========================
    socket.on('sendMessage', async (channelId, message) => {
      const msg = await Message.create({
        content: message.content,
        sender: message.userId,   // Frontend must provide userId
        channel: channelId
      });

      const populatedMsg = await msg.populate('sender', 'username');

      io.to(channelId).emit('receiveMessage', {
        username: populatedMsg.sender.username,
        content: populatedMsg.content,
        timestamp: populatedMsg.createdAt
      });
    });

    // ========================
    // Handle disconnect
    // ========================
    socket.on('disconnect', async () => {
      console.log('A user disconnected:', socket.id);

      // Remove user from all channels
      for (let channelId in channels) {
        const index = channels[channelId].indexOf(socket.id);
        if (index > -1) {
          channels[channelId].splice(index, 1);
          console.log(`User ${users[socket.id]} left channel ${channelId}`);
          socket.to(channelId).emit('receiveMessage', { 
            username: 'System', 
            content: `${users[socket.id]} left the channel.` 
          });
        }
      }

      delete users[socket.id];

      // Update Room model: remove user by socketId
      try {
        const updatedRoom = await Room.findOneAndUpdate(
          { 'users.socketId': socket.id }, // Find room containing this socketId
          { $pull: { users: { socketId: socket.id } } }, // Remove user from users array
          { new: true }
        );
    
        if (updatedRoom) {
          console.log(`Removed socket ${socket.id} from room ${updatedRoom.roomId}`);
        } else {
          console.log(`Socket ${socket.id} not found in any room.`);
        }
      } catch (err) {
        console.error('Error removing user from Room model:', err);
      }
    });
  });
};
