const express = require('express');
const { checkUser } = require('../../../middlewares/auth');
const router = express.Router();

router.get('/', checkUser, require('./stickerGET'));
router.get('/:scheduleId', checkUser, require('./stickerByScheduleIdGET'));

module.exports = router;