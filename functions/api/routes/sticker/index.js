const express = require('express');
const { checkUser } = require('../../../middlewares/auth');
const router = express.Router();

router.get('/:scheduleId', checkUser, require('./stickerByScheduleIdGET'));

module.exports = router;
