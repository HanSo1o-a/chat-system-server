let users = [{
  username:'superadmin',
  email: 'nZ9Oz@example.com',
  password: '123', 
  roles: ['superadmin'] }
]; 

// 添加用户
const addUser = (user) => {
  users.push(user);
  return user;
};

// 获取用户
const getUsername = (username) => {
  return users.find(user => user.username === username);
};

const getUserID = (userId) => {
  return users.find(user => user.id === userId);
};

// 获取所有用户
const getAllUsers = () => {
  return users;
};


const updateUsername = (oldUsername, newUsername) => {
  const user = users.find(user => user.username === oldUsername);

  if (!user) {
    throw new Error('User not found');
  }

  // Check if the new username is already taken
  const existingUser = users.find(user => user.username === newUsername);
  if (existingUser) {
    throw new Error('Username already taken');
  }

  // Update the username
  user.username = newUsername;

  

  return user;
};


module.exports = { addUser, getUsername,getUserID, getAllUsers,updateUsername };
