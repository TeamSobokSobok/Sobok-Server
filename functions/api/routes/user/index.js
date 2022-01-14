const express = require('express');
const { checkUser } = require('../../../middlewares/auth');
const router = express.Router();

router.get('/', checkUser, require('./userGET'));

// 닉네임 중복검사
router.post('/name', require('./userNamePOST'));

module.exports = router;
