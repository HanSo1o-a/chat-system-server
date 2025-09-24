const { addChannel, deleteChannel, getChannel, getAllChannels, addAdmin, removeAdmin, addMember, removeMember } = require('../models/channel');
const { addUser, getUsername, getUserID, getAllUsers } = require('../models/user');
const { getUser,becomeAdminRole,becomeUserRole } = require('../controllers/userController');
const { addChannelToGroup } = require('../controllers/groupController');

// 创建频道
exports.createChannel = async (req, res) => {
  try {
    const { name, description,groupId } = req.body;

    if (req.user.roles[0] !== 'admin' && req.user.roles[0] !== 'superadmin') {
      return res.status(403).json({ message: 'Permission denied' });
    }

    const newChannel = { id: Date.now(), name, description, admins: [], members: [] ,groupId};
    addChannel(newChannel);

    addChannelToGroup(newChannel, groupId);  // 将频道添加到群组

    res.status(201).json(newChannel);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};

// 添加管理员到频道
exports.addAdmin = async (req, res) => {
  try {
    const { channelId, userId } = req.body;

    const channel = addAdmin(req.user, channelId, userId);  // 权限检查由 model 进行处理


    if (!channel) {
      return res.status(404).json({ message: 'Channel not found' });
    }
    becomeAdminRole(userId); 
    res.status(200).json({ message: 'User added as admin', channel });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};


exports.getAllChannels = async (req, res) => 
  { try { console.log(req.user) ;
    const role = req.user.roles[0]; const userId = req.user.username; let channels = getAllChannels(); // 获取所有频道 
if (role === 'superadmin') { // 超级管理员查看所有频道 

}
 else if (role === 'admin') { 
  channels = channels.filter(channel => channel.admins.includes(userId) || channel.members.includes(userId) ); } 
  else { channels = channels.filter(channel => channel.members.includes(userId)); } 
  res.status(200).json(channels); } 
  catch (error) 
  { res.status(500).json({ message: 'Error fetching channels', error }); }
 };
 
exports.getAllUsers = async (req, res) => { try { const users = getAllUsers(); // 从内存中获取所有用户 
res.status(200).json(users); } catch (error) { res.status(500).json({ message: 'Server error', error }); } };

// 从频道中移除管理员
exports.removeAdmin = async (req, res) => {
  try {
    const { channelId, userId } = req.body;

    const channel = removeAdmin(req.user, channelId, userId);  // 权限检查由 model 进行处理
    const user = getUserID(userId);

    if (!channel) {
      return res.status(404).json({ message: 'Channel not found' });
    }
    const otherGroups = getAllChannels().filter(g => g.id !== channelId && g.admins.includes(userId));
    if (otherGroups.length==0)
    {
      becomeUserRole(userId);
    }
    
    res.status(200).json({ message: 'User removed as admin', channel });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// 添加成员到频道
exports.addMember = async (req, res) => {
  try {
    const { channelId, userId } = req.body;

    const channel = addMember(req.user, channelId, userId);  // 权限检查由 model 进行处理

    if (!channel) {
      return res.status(404).json({ message: 'Channel not found' });
    }

    res.status(200).json({ message: 'User added as member', channel });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// 删除频道
exports.deleteChannel = async (req, res) => {
  try {
    const { channelId } = req.body;

    if (req.user.roles[0] !== 'admin' && req.user.roles[0] !== 'superadmin') {
      return res.status(403).json({ message: 'Permission denied' });
    }

    const channel = getChannel(channelId);

    if (!channel) {
      return res.status(404).json({ message: 'Channel not found' });
    }

    deleteChannel(channelId);

    res.status(200).json({ message: 'Channel deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};

// 移除成员
exports.removeMember = async (req, res) => {
  try {
    const { channelId, userId } = req.body;

    const channel = removeMember(req.user, channelId, userId);  // 权限检查由 model 进行处理

    if (!channel) {
      return res.status(404).json({ message: 'Channel not found' });
    }

    res.status(200).json({ message: 'User removed from channel', channel });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};