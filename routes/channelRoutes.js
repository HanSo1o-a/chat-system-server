const express = require('express');
const router = express.Router();
const channelController = require('../controllers/channelController');
const verifyToken = require('../middleware/verifyToken'); 
const { v4: uuidv4 } = require('uuid');  // 用于生成唯一的文件名
const multer = require('multer');
const authMiddleware = require('../middleware/authMiddleware'); 
// 设置文件存储配置
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, './server/public/uploads/');  // 设置上传文件的存储目录
  },
  filename: function (req, file, cb) {
    const fileExtension = file.originalname.split('.').pop();  // 获取文件扩展名
    const uniqueFilename = `${uuidv4()}.${fileExtension}`;  // 使用 uuid 生成唯一文件名
    cb(null, uniqueFilename);  
  }
});

const upload = multer({ storage });  

// 上传图片
router.post('/upload-image', upload.single('image'), (req, res) => {
  channelController.uploadImage(req, res);  // 上传图片
});

// 上传视频
router.post('/upload-video', upload.single('video'), (req, res) => {
  channelController.uploadVideo(req, res);  // 上传视频
});

// 创建频道
router.post('/create',authMiddleware, channelController.createChannel);

// 获取所有频道
router.get('/',   
  authMiddleware,channelController.getAllChannels  );

// 获取指定频道
router.get('/:channelId', authMiddleware,channelController.getChannel);  // 获取指定频道

// 添加成员到频道
router.post('/:channelId/addMember',authMiddleware, channelController.addMember);  // 添加成员

// 删除频道
router.delete('/:channelId', authMiddleware,channelController.deleteChannel);  // 删除频道


module.exports = router;
