const express = require('express');
const scheduleController = require('../../../controller/scheduleController');
const { checkUser } = require('../../../middlewares/auth');
const router = express.Router();

// 캘린더 가져오기
router.get('/calendar', checkUser, scheduleController.getMyCalendar);

// 날짜별 약 스케줄 가져오기
router.get('/detail', checkUser, scheduleController.getMySchedule);

router.get('/:memberId/calendar', checkUser, scheduleController.getMemberCalendar);
router.get('/:memberId/detail', checkUser, scheduleController.getMemberSchedule);

// 약 스케줄 체크하기
router.put('/check/:scheduleId', checkUser, scheduleController.checkSchedule);
router.put('/uncheck/:scheduleId', checkUser, scheduleController.unCheckSchedule);

module.exports = router;
