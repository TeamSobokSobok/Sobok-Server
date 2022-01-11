const express = require('express');
const { checkUser } = require('../../../middlewares/auth');
const router = express.Router();

router.post('/addition', checkUser, require('./pillAditionalPOST'));

module.exports = router;