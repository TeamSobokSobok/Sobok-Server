const express = require('express');
const pillController = require('../../../controller/pillController');
const { checkUser } = require('../../../middlewares/auth');
const router = express.Router();

// 약 정보 조회 관련 router
router.get('/count', checkUser, require('./pillCountGET'));
router.get('/:userId/count', require('./pillByUserIdCountGET'));

// 약 추가 관련 router
router.post('/', checkUser, pillController.addPill);
router.post('/member/:memberId', checkUser, pillController.addMemberPill);

// 약 정보 수정 관련 router
router.put('/:pillId', checkUser, require('./pillModifyPUT'));
router.put('/stop/:pillId', checkUser, require('./stopPillPUT.js'));

// 약 삭제 관련 router
router.delete('/:pillId', checkUser, require('./deleteMyPillDELETE'));

module.exports = router;
