const express = require('express');
const userContoller = require('../../../controller/userContoller');
const { checkUser } = require('../../../middlewares/auth');
const router = express.Router();

router.get('/', checkUser, userContoller.getUsername);
router.get('/info', checkUser, userContoller.getUserInfo);
router.get('/pill', checkUser, userContoller.getPillList);
router.get('/pill/:pillId', checkUser, userContoller.getPillInformation);
router.get('/share/:memberId', checkUser, userContoller.isCalendarShare);

// 닉네임 중복검사
router.post('/name', userContoller.checkUsername);

// 유저 닉네임 변경 라우터
router.put('/nickname', checkUser, userContoller.updateUsername);

module.exports = router;
