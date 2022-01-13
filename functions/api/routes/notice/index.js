const express = require('express');
const { checkUser } = require('../../../middlewares/auth');
const router = express.Router();

router.get('/', require('./pillInfoGET'));
router.get('/list', checkUser, require('./pillListGET'));
router.put('/', require('./pillInfoPUT'));

module.exports = router;
