const express = require('express');
const noticeController = require('../../../controller/noticeController');
const { checkUser } = require('../../../middlewares/auth');
const router = express.Router();

// 그룹 멤버 가져오기
router.get('/', checkUser, noticeController.getMember);

// 캘린더 공유 요청하기
router.post('/', checkUser, noticeController.sendGroup);
router.put('/:sendGroupId', checkUser, noticeController.updateIsOkay);

// 그룹 멤버 이름 수정하기
router.put('/:groupId/name', checkUser, noticeController.updateMemberName);

module.exports = router;
