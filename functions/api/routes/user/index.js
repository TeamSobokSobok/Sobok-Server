const express = require('express');
const userContoller = require('../../../controller/userContoller');
const { checkUser } = require('../../../middlewares/auth');
const router = express.Router();

router.get('/', checkUser, userContoller.getUsername);
router.get('/info', checkUser, userContoller.getUserInfo)
router.get('/pill', checkUser, userContoller.getPillList);
router.get('/pill/:pillId', checkUser, userContoller.getPill);

// 닉네임 중복검사
router.post('/name', userContoller.checkUsername);

router.put('/nickname', checkUser, userContoller.updateUsername);


module.exports = router;
