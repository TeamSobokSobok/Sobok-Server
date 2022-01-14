const express = require('express');
const { checkUser } = require('../../../middlewares/auth');
const router = express.Router();

// 그룹 멤버 가져오기
router.get('/', checkUser, require('./groupGET'));

// 캘린더 공유 요청하기
router.post('/:memberId', checkUser, require('./groupByMemberIdPOST'));

// 그룹 멤버 이름 수정하기
router.put('/:groupId/name', checkUser, require('./groupByGroupIdNamePUT'));

module.exports = router;
