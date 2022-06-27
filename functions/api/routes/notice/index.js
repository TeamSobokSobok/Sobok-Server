const express = require('express');
const noticeController = require('../../../controller/noticeController');
const { checkUser } = require('../../../middlewares/auth');
const router = express.Router();

// 알림 정보 조회 관련 router
router.get('/list/:pillId', checkUser, noticeController.getPillInfo);
router.get('/list', checkUser, noticeController.getNoticeList);

// 알림 정보 수정 관련 router
router.put('/', checkUser, require('./pillInfoPUT'));

module.exports = router;
