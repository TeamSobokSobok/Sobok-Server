var express = require('express');
const { checkUser } = require('../../../middlewares/auth');
var router = express.Router();

router.get('/:memberId', checkUser, require('./scheduleMemberIdGET'));

module.exports = router;
