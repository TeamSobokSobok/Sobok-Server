const express = require('express');
const { checkUser } = require('../../../middlewares/auth');
const router = express.Router();

router.get('/:memberId', checkUser, require('./scheduleMemberIdGET'));

module.exports = router;
