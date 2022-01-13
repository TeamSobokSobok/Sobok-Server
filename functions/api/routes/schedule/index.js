const express = require('express');
const { checkUser } = require('../../../middlewares/auth');
const router = express.Router();

router.get('/:memberId', checkUser, require('./scheduleByMemberIdGET'));
router.get('/:memberId/detail', checkUser, require('./scheduleByMemberIdDetailGET'));

module.exports = router;
