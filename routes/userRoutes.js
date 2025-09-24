const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');

// 用户注册
router.post('/register', userController.registerUser);

// 获取所有用户
router.get('/users', userController.getAllUsers);

// 用户登录
router.post('/login', userController.loginUser);  // 登录路由

router.post('/update-username', userController.updateUsername);  // 登录路由

module.exports = router;
