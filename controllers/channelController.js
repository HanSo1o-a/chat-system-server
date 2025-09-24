const { addChannel,deleteChannel, getChannel, getAllChannels } = require('../models/channel');
const { getUser } = require('../models/user'); // 假设用户信息存储在内存中
const multer = require('multer'); // 用于文件上传
const { v4: uuidv4 } = require('uuid'); // 用于生成唯一文件名
const { addChannelToGroup } = require('../controllers/groupController');

// 创建频道
exports.createChannel = async (req, res) => {
  const { name, description, groupId } = req.body;  // 接收 groupId，表示该频道所属的群组

  try {
    // 检查频道是否已经存在
    const existingChannel = getChannel(name);
    if (existingChannel) {
      return res.status(400).json({ message: 'Channel already exists' });
    }

    // 创建新频道
    const newChannel = { 
      id: Date.now(), 
      name, 
      description, 
      admins: [], 
      members: [] 
    };
    
    // 将该频道添加到指定的群组中
    await addChannelToGroup(newChannel, groupId);  // 将频道添加到群组

    res.status(201).json(newChannel);  // 返回创建的频道
  } catch (error) {
    console.error('Error creating channel:', error);
    res.status(500).json({ message: 'Error creating channel', error });
  }
};

exports.deleteChannel = async (req, res) => {
  try {
    const { channelId } = req.body;

    const channel = deleteChannel(req.user, channelId);  // 权限检查和删除逻辑移到 model 里

    res.status(200).json({ message: 'Channel deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting channel', error: error.message });
  }
};

// 获取所有频道
exports.getAllChannels = async (req, res) => {
  try {

    const role = req.role || 'user';  // 获取用户角色
    const username = req.user.username;  // 获取用户ID
    let channels = [];
  
   
    if (role === 'superadmin') {
      channels = getAllChannels();  // 超级管理员查看所有频道
    } else if (role === 'admin') {
      channels = getAllChannels().filter(channel =>
        channel.admins.includes(username) || channel.members.includes(username)
      );
    } else {
      channels = getAllChannels().filter(channel => channel.members.includes(username));
    }

    res.status(200).json(channels);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching channels', error });
  }
};

// 获取指定频道
exports.getChannel = async (req, res) => {
  const channel = getChannel(req.params.channelId);

  if (!channel) {
    return res.status(404).json({ message: 'Channel not found' });
  }

  res.status(200).json(channel);
};

// 添加成员
exports.addMember = async (req, res) => {
  try {
    const { channelId, userId } = req.body;
    let channel = getChannel(channelId);

    if (!channel) {
      return res.status(404).json({ message: 'Channel not found' });
    }

    if (!channel.members.includes(userId)) {
      channel.members.push(userId);
    }

    res.status(200).json(channel);
  } catch (error) {
    res.status(500).json({ message: 'Error adding member', error });
  }
};
