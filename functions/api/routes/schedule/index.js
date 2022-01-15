const express = require('express');
const { checkUser } = require('../../../middlewares/auth');
const router = express.Router();

// 캘린더 가져오기
router.get('/my', checkUser, require('./scheduleMyGET'));
router.get('/:memberId', checkUser, require('./scheduleByMemberIdGET'));
// 약 세부 스케줄 가져오기
router.get('/my/detail', checkUser, require('./scheduleMyDetailGET'));
router.get('/:memberId/detail', checkUser, require('./scheduleByMemberIdDetailGET'));

module.exports = router;
