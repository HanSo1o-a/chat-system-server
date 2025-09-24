const express = require('express');
const router = express.Router();
const groupController = require('../controllers/groupController');
const authMiddleware = require('../middleware/authMiddleware'); 
// 获取所有群组
router.get('/all',authMiddleware, groupController.getAllGroups);

// 获取用户管理的群组（通过管理员角色过滤）
router.get('/admin/:userId', authMiddleware,groupController.getAdminGroups);

// 创建新群组
router.post('/create', authMiddleware,groupController.createGroup);

// 删除群组
router.delete('/delete/:id',authMiddleware, groupController.deleteGroup);

// 向群组添加成员
router.post('/add-member', authMiddleware,groupController.addMemberToGroup);

// 向群组添加管理员
router.post('/add-admin', authMiddleware,groupController.addAdminToGroup);

// 从群组中移除管理员
router.post('/remove-admin', authMiddleware,groupController.removeAdminFromGroup);

// 从群组中移除成员
router.post('/remove-member',authMiddleware, groupController.removeMemberFromGroup);

router.post('/delete-channel',authMiddleware, groupController.deleteChannelFromGroup);


router.post('/exit-group', groupController.exitGroup);

module.exports = router;
