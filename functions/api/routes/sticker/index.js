const express = require('express');
const { checkUser } = require('../../../middlewares/auth');
const router = express.Router();

router.get('/', checkUser, require('./stickerGET'));
// 해당 약 스케줄의 모든 스티커 불러오기
router.get('/:scheduleId', checkUser, require('./stickerByScheduleIdGET'));

// 스티커 전송하기
router.post('/:scheduleId', checkUser, require('./stickerByScheduleIdPOST'));

// 내가 보낸 스티커 수정하기
router.put('/my/:likeScheduleId', checkUser, require('./stickerByLikeScheduleIdPUT'));

module.exports = router;
