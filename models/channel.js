let channels = [];  // 用于存储所有频道的数据

// 添加频道
const addChannel = (channel) => {
  channels.push(channel);
  return channel;
};

// 获取频道
const getChannel = (channelId) => {
  const channel = channels.find(c => c.id === channelId);
  return channel ? channel : null;
};

// 删除频道
const deleteChannel = (channelId) => {
  channels = channels.filter(ch => ch.id !== channelId);  // 从内存中删除频道
};

// 获取所有频道
const getAllChannels = () => {
  return channels;
};

// 权限检查：是否为超级管理员或管理员
const hasAdminPermission = (user, channel) => {
  return user.roles.includes('superadmin') || channel.admins.includes(user._id);
};

// 添加管理员
const addAdmin = (user, channelId, userId) => {
  const channel = getChannel(channelId);

  if (!channel) return null;

  if (!hasAdminPermission(user, channel)) {
    throw new Error('Permission denied: You must be an admin to add an admin.');
  }

  if (!channel.admins.includes(userId)) {
    channel.admins.push(userId);
  }

  return channel;
};

// 移除管理员
const removeAdmin = (user, channelId, userId) => {
  const channel = getChannel(channelId);

  if (!channel) return null;

  if (!hasAdminPermission(user, channel)) {
    throw new Error('Permission denied: You must be an admin to remove an admin.');
  }

  channel.admins = channel.admins.filter(admin => admin !== userId);

  return channel;
};

// 添加成员
const addMember = (user, channelId, userId) => {
  const channel = getChannel(channelId);

  if (!channel) return null;

  if (!hasAdminPermission(user, channel)) {
    throw new Error('Permission denied: You must be an admin to add a member.');
  }

  if (!channel.members.includes(userId)) {
    channel.members.push(userId);
  }

  return channel;
};

// 移除成员
const removeMember = (user, channelId, userId) => {
  const channel = getChannel(channelId);

  if (!channel) return null;

  if (!hasAdminPermission(user, channel)) {
    throw new Error('Permission denied: You must be an admin to remove a member.');
  }

  channel.members = channel.members.filter(member => member !== userId);

  return channel;
};

module.exports = { addChannel, getChannel, deleteChannel, getAllChannels, addAdmin, removeAdmin, addMember, removeMember };
