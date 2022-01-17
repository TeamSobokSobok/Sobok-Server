const express = require('express');
const { checkUser } = require('../../../middlewares/auth');
const router = express.Router();

// 약 정보 조회 관련 router
router.get('/:userId/count', checkUser, require('./pillByUserIdCountGET'));
router.get('/count', checkUser, require('./pillCountGET'));

// 약 추가 관련 router
router.post('/', checkUser, require('./pillAditionalPOST'));
router.post('/member/:receiverId', checkUser, require('./friendPillAditionalPOST'));

// 약 정보 수정 관련 router
router.put('/:pillId', checkUser, require('./pillModifyPUT'));
router.put('/stop/:pillId', checkUser, require('./stopPillPUT.js'));

// 약 삭제 관련 router
router.delete('/:pillId', checkUser, require('./deleteMyPillDELETE'));

module.exports = router;
