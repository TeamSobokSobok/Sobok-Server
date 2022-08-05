const express = require('express');
const userContoller = require('../../../controller/userContoller');
const { checkUser } = require('../../../middlewares/auth');
const router = express.Router();

router.get('/', checkUser, userContoller.getUsername);

// 닉네임 중복검사
router.post('/name', userContoller.checkUsername);

router.get('/pill', checkUser, userContoller.getPillList);
router.get('/pill/:pillId', checkUser, userContoller.getPill);

module.exports = router;
