const express = require('express');
const { checkUser } = require('../../../middlewares/auth');
const router = express.Router();

// 캘린더 가져오기
router.get('/calendar', checkUser, require('./scheduleCalendarGET'));
router.get('/:memberId/calendar', checkUser, require('./scheduleByMemberIdCalendarGET'));
router.get('/detail', checkUser, require('./scheduleDetailGET'));
router.get('/:memberId/detail', checkUser, require('./scheduleByMemberIdDetailGET'));

// 약 스케줄 체크하기
router.put('/check/:scheduleId', checkUser, require('./scheduleCheckByScheduleIdPUT'));
router.put('/uncheck/:scheduleId', checkUser, require('./scheduleUnCheckByScheduleIdPUT'));

module.exports = router;
