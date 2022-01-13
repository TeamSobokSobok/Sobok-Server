const express = require('express');
const { checkUser } = require('../../../middlewares/auth');
const router = express.Router();

router.get('/my', checkUser, require('./scheduleMyGET'));
router.get('/:memberId', checkUser, require('./scheduleMemberIdGET'));
router.get('/:memberId/detail', checkUser, require('./scheduleMemberIdDetailGET'));

module.exports = router;
