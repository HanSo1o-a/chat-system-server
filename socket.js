const socketIo = require('socket.io');

// 用内存替代数据库的频道和房间数据
let channels = {};  // 存储频道（房间）信息
let users = {};     // 存储 socket.id 和用户名的映射

module.exports = function (server) {
  const io = socketIo(server, {
    cors: {
      origin: "http://localhost:4200",  // 允许从前端的 Angular 应用进行访问
      methods: ["GET", "POST"],
      credentials: true  // 允许携带认证信息
    }
  });

  io.listen(3001);

  io.on('connection', (socket) => {
    const username = socket.handshake.query.username || 'Anonymous';  // 获取用户名
    users[socket.id] = username;  // 存储 socket.id 和用户名的映射

    console.log('A user connected:', socket.id, 'Username:', username);

    // 用户加入房间
    socket.on('joinRoom', (channelId) => {
      // 如果频道不存在，则初始化它

      if (!channels[channelId]) {
        channels[channelId] = { users: [], messages: [] };
      }

      console.log(channels,channelId)
      // 检查用户是否已经在频道中，如果在则退出并重新加入
      for (let prevChannelId in channels) {
        const index = channels[prevChannelId].users.indexOf(socket.id);
        if (index > -1) {
          channels[prevChannelId].users.splice(index, 1);  // 移除用户
          socket.leave(prevChannelId);  // 离开当前频道
          socket.to(prevChannelId).emit('receiveMessage', { username: 'System', content: `${users[socket.id]} left the channel.` });
          console.log(`User ${users[socket.id]} left channel ${prevChannelId}`);
        }
      }
      
      // 将用户加入频道
      channels[channelId].users.push(socket.id);
      socket.join(channelId);  // 加入频道
   
      // 给新加入的用户发送欢迎信息和最近10条消息
      const recentMessages = channels[channelId].messages.slice(-10);  // 获取最近的10条消息
      socket.emit('receiveMessage', { username: 'System', content: `Welcome to the channel` });

      recentMessages.forEach(msg => {
        socket.emit('receiveMessage', msg);  // 发送之前的消息
      });

    });

    // 发送消息到服务器
    socket.on('sendMessage', (channelId, message) => {
      const msg = { username: users[socket.id], content: message.content };
      console.log(channels,channelId)
      // 将消息保存到内存中的频道
      channels[channelId].messages.push(msg);

      // 广播消息到频道
      io.to(channelId).emit('receiveMessage', msg);
    });

    // 用户断开连接时触发
    socket.on('disconnect', () => {
      console.log('A user disconnected:', socket.id);

      // 从所有频道中移除用户
      for (let channelId in channels) {
        const index = channels[channelId].users.indexOf(socket.id);
        if (index > -1) {
          channels[channelId].users.splice(index, 1);  // 从频道中移除用户
        }
      }

      // 清除用户的映射
      delete users[socket.id];
    });
  });
};
