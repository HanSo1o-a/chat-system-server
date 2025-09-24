let groups = [];  // 用于存储所有群组的数据

// 添加群组
const addGroup = (group) => {
  groups.push(group);
  return group;
};

// 获取指定群组
const getGroup = (groupId) => {
  return groups.find(group => group.id === Number(groupId));
};

// 获取所有群组
const getAllGroups = () => {
  return groups;
};



// 创建群组
const createGroup = (name, description) => {
  if (user.roles[0] !== 'admin' && user.roles[0] !== 'superadmin') {
    throw new Error('Permission denied: You must be an admin or superadmin to create a group');
  }

  const existingGroup = getGroup(name);
  if (existingGroup) {
    throw new Error('Group already exists');
  }

  const newGroup = { id: Date.now(), name, description, admins: [], members: [] };
  addGroup(newGroup);

  return newGroup;
};

// 删除群组
const deleteGroup = (groupId) => {

  const group = getGroup(groupId);
  if (!group) {
    throw new Error('Group not found');
  }

  groups = groups.filter(gr => gr.id !== Number(groupId));
  return group;
};

// 添加管理员
const addAdmin = (groupId, userId) => {
  const group = getGroup(groupId);
  if (!group) {
    throw new Error('Group not found');
  }

  if (!group.admins.includes(userId)) {
    group.admins.push(userId);
  }
  return group;
};

// 移除管理员
const removeAdmin = (groupId, userId) => {
  const group = getGroup(groupId);
  if (!group) {
    throw new Error('Group not found');
  }


  group.admins = group.admins.filter(admin => admin !== userId);
  return group;
};

// 添加成员
const addMember = (groupId, userId) => {
  const group = getGroup(groupId);
  if (!group) {
    throw new Error('Group not found');
  }

  if (!group.members.includes(userId)) {
    group.members.push(userId);
  }

  return group;
};

// 移除成员
const removeMember = (groupId, userId) => {
  const group = getGroup(groupId);
  if (!group) {
    throw new Error('Group not found');
  }


  group.members = group.members.filter(member => member !== userId);
  return group;
};





module.exports = { 
  addGroup, getGroup, deleteGroup, getAllGroups, createGroup, 
  addAdmin, removeAdmin, addMember, removeMember
};
