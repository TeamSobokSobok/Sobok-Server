const express = require('express');
const { checkUser } = require('../../../middlewares/auth');
const router = express.Router();

// 알림 정보 조회 관련 router
router.get('/', checkUser, require('./pillInfoGET'));
router.get('/list', checkUser, require('./noticeListGET'));

// 알림 정보 수정 관련 router
router.put('/', checkUser, require('./pillInfoPUT'));

module.exports = router;
