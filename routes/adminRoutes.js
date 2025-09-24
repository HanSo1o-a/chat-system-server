const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const authMiddleware = require('../middleware/authMiddleware'); 
const userController = require('../controllers/userController'); 

// 创建频道
router.post('/create',authMiddleware, adminController.createChannel);

// 删除频道
router.post('/channels/delete',authMiddleware, adminController.deleteChannel);

// 获取所有频道
router.get('/',authMiddleware, adminController.getAllChannels);

// 获取所有用户
router.get('/users',authMiddleware, adminController.getAllUsers); 

// 添加管理员到频道
router.post('/add-admin',authMiddleware, adminController.addAdmin);

// 从频道中移除管理员
router.post('/remove-admin',authMiddleware, adminController.removeAdmin);

// 添加成员到频道
router.post('/add-member',authMiddleware, adminController.addMember);

// 从频道中移除成员
router.post('/remove-member',authMiddleware, adminController.removeMember);

router.post('/update-role',authMiddleware, userController.updateUserRole);

module.exports = router;
