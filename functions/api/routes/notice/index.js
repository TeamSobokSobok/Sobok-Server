const express = require('express');
const noticeController = require('../../../controller/noticeController');
const { checkUser } = require('../../../middlewares/auth');
const router = express.Router();

// 알림 정보 전체 조회 router
router.get('/list', checkUser, noticeController.getNoticeList);

// 알림 정보 조회 관련 router
router.get('/list/:noticeId/:pillId', checkUser, noticeController.getPillInfo);

// 알림 정보 수정 관련 router
router.put('/list/:pillId', checkUser, noticeController.updateSendPill);

module.exports = router;
