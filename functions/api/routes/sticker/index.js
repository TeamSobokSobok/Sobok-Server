const express = require('express');
const stickerController = require('../../../controller/stickerController');
const { checkUser } = require('../../../middlewares/auth');
const router = express.Router();

router.get('/', checkUser, stickerController.getAllSticker);
// 해당 약 스케줄의 모든 스티커 불러오기
router.get('/:scheduleId', checkUser, stickerController.getStickerBySchedule);

// 스티커 전송하기
router.post('/:scheduleId', checkUser, stickerController.sendSticker);

// 내가 보낸 스티커 수정하기
router.put('/my/:likeScheduleId', checkUser, stickerController.updateSendSticker);

module.exports = router;
