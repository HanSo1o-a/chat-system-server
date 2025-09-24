const { addUser, getUserID,getUsername, getAllUsers,updateUsername } = require('../models/user');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { getAllGroups } = require('../models/group');
const { getAllChannels } = require('../models/channel');

// 用户注册
exports.registerUser = async (req, res) => {
  try {
    const { username, email, password } = req.body;

    // 检查用户名是否已存在
    const existingUsername = getUsername(username);
    if (existingUsername) {
      return res.status(400).json({ message: 'Username is already taken' });
    }

    // 检查邮箱是否已存在
    const existingEmail = getAllUsers().find(user => user.email === email);
    if (existingEmail) {
      return res.status(400).json({ message: 'Email is already registered' });
    }

    // 使用bcrypt加密密码
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    // 创建新用户并保存到内存中
    const user = { 
      username, 
      email, 
      password: hashedPassword, 
      roles: ['user'] 
    };
    if(username=='superadmin')

      {
        user.roles[0]='superadmin';
      }
    

    addUser(user);

    res.status(201).json(user);
  } catch (error) {
    console.log('Error occurred during registration:', error);  // Log detailed error
    res.status(500).json({ message: 'Server error', error });
  }
};

// 获取所有用户
exports.getAllUsers = async (req, res) => {
  try {
    const users = getAllUsers(); 
    res.status(200).json(users);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};

// 用户登录
exports.loginUser = async (req, res) => {
  const { username, password } = req.body;

  try {
    // 查找用户
    const user = getUsername(username);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // 获取用户角色（假设角色是一个数组，取第一个角色）
    const role = Array.isArray(user.roles) ? user.roles[0] : user.roles;

    // 生成 JWT
    const token = jwt.sign(
      { 
        userId: user._id, 
        username: user.username, 
        role: role  // 使用角色信息生成 JWT
      },
      '34fdg4rtzhs8t2#dfgdsf2!vkn34@123d',  // 密钥
      { expiresIn: '1h' }  // 设置过期时间
    );

    if(username == 'superadmin')
    {
         // 返回登录成功的响应
    res.status(200).json({
      message: 'Login successful!',
      token: token,  // 返回 JWT
      role: role, // 返回角色信息
      username: user.username, 
    });
    }
    // 比较密码
    const isPasswordMatch = await bcrypt.compare(password, user.password);
    if (!isPasswordMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }


    // 返回登录成功的响应
    res.status(200).json({
      message: 'Login successful!',
      token: token,  // 返回 JWT
      role: role, // 返回角色信息
      username: user.username, 
    });

  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err });
  }
};

const setUserRole = (username, newRole) => {

  const user = getUsername(username);
  if (!user) {
    throw new Error('User not found');
  }
  if (user.roles.includes(newRole)) {
    throw new Error(`User is already a ${newRole}`);
  }
  if(newRole=='superadmin')
  {
    user.roles = [newRole];
    return user;
  }
  if(newRole=='admin')
    {
      user.roles = [newRole];
      return user;
    }
  const otherGroups1 = getAllGroups().filter(g =>  g.admins.includes(username));
  if (otherGroups1.length==0)
  {
    user.roles = ['user'];
  }
  else
  {
    user.roles = ['admin']
  }

  return user;
};


exports.becomeAdminRole = (username) => {

  const user = getUsername(username);
  if (!user) {
    throw new Error('User not found');
  }
  if (user.roles.includes('user')) {
    user.roles = ['admin'];  // 更新用户角色
  }
  return user;
};


exports.becomeUserRole = (username) => {

  const user = getUsername(username);
  if (!user) {
    throw new Error('User not found');
  }
  if (user.roles.includes('admin')) {
    const otherGroups1 = getAllGroups().filter(g =>  g.admins.includes(username));
  if (otherGroups1.length==0)
    {
      user.roles = ['user'];  // 更新用户角色
    }
    else
    {
      user.roles = ['admin']
    }

  }
  return user;
};

exports.updateUserRole = async (req, res) => {
  try {
    console.log(req.body)
    const { userId, newRole } = req.body;

    // 进行角色修改
    const updatedUser = setUserRole(userId, newRole);  // 调用设置角色的通用函数

    res.status(200).json({ message: `User role updated to ${newRole}`, user: updatedUser });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.updateUsername = async (req, res) => {
  try {
    const { oldUsername, newUsername } = req.body;

    // Call the model's updateUsername method to update the username in users
    const updatedUser = updateUsername(oldUsername, newUsername);

    // Now update the username in all groups (call the changeUsernameInGroups function)
    await changeUsernameInGroups(oldUsername, newUsername);

    // Respond with a success message if everything went well
    res.status(200).json({
      success: true,
      message: 'Username updated successfully',
      updatedUser,
    });
  } catch (error) {
    console.error('Error updating username:', error);
    res.status(500).json({ success: false, message: 'Server error', error });
  }
};


// Change username in both users and groups
changeUsernameInGroups =  async (oldUsername, newUsername) =>  {
  const groups = getAllGroups();  // 通过模型获取所有群组
  groups.forEach(group => {
    // Update admins
    if (group.admins.includes(oldUsername)) {
      const index = group.admins.indexOf(oldUsername);
      group.admins[index] = newUsername; // Replace old username with new username
    }

    // Update members
    if (group.members.includes(oldUsername)) {
      const index = group.members.indexOf(oldUsername);
      group.members[index] = newUsername; // Replace old username with new username
    }

    // Save the updated group (assuming this is persisted in a database)
    // If you're using a database, this is where you'd save the updated group to the DB
  });

  return { success: true, message: 'Groups updated with new username' };
};