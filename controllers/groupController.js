const { addGroup, getGroup, getAllGroups, deleteGroup,addAdmin, }  = require('../models/group'); // 使用模型中的方法
const { getUser,becomeAdminRole,becomeUserRole } = require('../controllers/userController'); // 假设用户信息存储在内存中


const checkAdminOrSuperadmin = async (req) => {
  let userRole;

  if (req.user && req.user.roles) {
    userRole = req.user.roles[0];
  }

  if (userRole === 'superadmin' || userRole === 'admin') {
    return userRole;
  }

  throw new Error('Access denied. You need to be an admin or superadmin to perform this action.');
};

// 获取所有群组
exports.getAllGroups = async (req, res) => {
  try {
   
    const groups = getAllGroups();  // 通过模型获取所有群组
    res.status(200).json(groups);
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// 获取用户管理的群组
exports.getAdminGroups = async (req, res) => {
  try {
    await checkAdminOrSuperadmin(req);  // 检查权限
    const userId = req.params.userId;
    
    const groups = getAllGroups().filter(group => group.admins.includes(userId));

    if (!groups.length) {
      return res.status(404).json({ success: false, message: 'No groups found for this admin.' });
    }

    res.status(200).json(groups);
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
// Create Group
exports.createGroup = async (req, res) => {
  try {
    const userRole = await checkAdminOrSuperadmin(req);  // Check role

    const { name, description, adminIds } = req.body;
    if (!name) {
      return res.status(400).json({ success: false, message: "Group name is required" });
    }

    let group = {
      id: Date.now(),
      name,
      description,
      admins: [],
      members: [],
      channels: []
    };

    if (userRole === "admin") {
      group.admins = [req.user.username];
    } 

    await addGroup(group);  // Save the group
    return res.status(200).json({ success: true, group });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// 删除群组
exports.deleteGroup = async (req, res) => {
  try {
    await checkAdminOrSuperadmin(req);
    const groupId = req.params.id;
    

    deleteGroup(groupId);  // 使用模型删除群组
    res.status(200).json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// 添加成员到群组
exports.addMemberToGroup = async (req, res) => {
  try {
    await checkAdminOrSuperadmin(req); 

    const { groupId, userId } = req.body;
    let group = getGroup(groupId);

    if (!group) {
      return res.status(404).json({ success: false, message: 'Group not found' });
    }

    if (!group.members.includes(userId)) {
      group.members.push(userId);  // 将用户添加到群组成员列表
    }


    res.status(200).json({ success: true, group });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// 添加管理员到群组
exports.addAdminToGroup = async (req, res) => {
  try {
    await checkAdminOrSuperadmin(req); 

    const { groupId, userId } = req.body;

    addAdmin(groupId, userId);  
    becomeAdminRole(userId);
    res.status(200).json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// 从群组中移除管理员
exports.removeAdminFromGroup = async (req, res) => {
  try {
    await checkAdminOrSuperadmin(req); 

    const { groupId, userId } = req.body;
    let group = getGroup(groupId);

    if (!group) {
      return res.status(404).json({ success: false, message: 'Group not found' });
    }

    if (group.admins.includes(userId)) {
      group.admins = group.admins.filter(admin => admin !== userId); 
      const otherGroups = getAllGroups().filter(g => g.id !== groupId && g.admins.includes(userId));
      
      if (otherGroups.length==0)
      {
        becomeUserRole(userId);
      }

      res.status(200).json({ success: true, group });
    } else {
      res.status(400).json({ success: false, message: 'User is not an admin' });
    }
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// 从群组中移除成员
exports.removeMemberFromGroup = async (req, res) => {
  try {
    await checkAdminOrSuperadmin(req);  // 检查权限

    const { groupId, userId } = req.body;
    let group = getGroup(groupId);

    if (!group) {
      return res.status(404).json({ success: false, message: 'Group not found' });
    }

    if (group.members.includes(userId)) {
      group.members = group.members.filter(member => member !== userId);  // 从成员列表中移除用户
      res.status(200).json({ success: true, group });
    } else {
      res.status(400).json({ success: false, message: 'User is not a member' });
    }
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// 从群组中移除频道
exports.deleteChannelFromGroup = async (req, res) => {
  try {
    await checkAdminOrSuperadmin(req);  // 检查权限

    const { groupId, channelId } = req.body;
    
    // 获取群组
    let group = getGroup(groupId);
    
    if (!group) {
      return res.status(404).json({ success: false, message: 'Group not found' });
    }

    // 查找并移除指定频道
    group.channels = group.channels.filter(channel => channel.id !== channelId);  // Remove channel by ID

    // 返回成功信息
    res.status(200).json({ success: true, message: 'Channel removed successfully', group });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.addChannelToGroup = async (channel, groupId) => {

  try {

    let group = getGroup(groupId);
    

    if (!group) {
      return res.status(404).json({ message: 'Group not found' });
    }

    group.channels.push(channel);

  } catch (error) {
    res.status(500).json({ message: 'Error adding channel to group', error });
  }
};

// Exit a group
exports.exitGroup = async (req, res) => {
  try {
    const { groupId, username } = req.body;  // Get groupId and username from the request body

    const group = await getGroup(groupId);  // Fetch the group using groupId
    if (!group) {
      return res.status(404).json({ message: 'Group not found' });
    }

    // Ensure the user is either an admin or a member of the group
    if (!group.admins.includes(username) && !group.members.includes(username)) {
      return res.status(400).json({ message: 'User is not part of this group' });
    }

    // Remove the user from the group (both admins and members)
    group.admins = group.admins.filter(admin => admin !== username);
    group.members = group.members.filter(member => member !== username);


    res.status(200).json({ success: true, message: 'Exited the group successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Error exiting the group' });
  }
};

