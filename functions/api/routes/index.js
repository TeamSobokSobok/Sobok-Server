const express = require('express');
const router = express.Router();

router.use('/auth', require('./auth'));
router.use('/group', require('./group'));
router.use('/pill', require('./pill'));
router.use('/notice', require('./notice'));
router.use('/schedule', require('./schedule'));
router.use('/sticker', require('./sticker'));
router.use('/user', require('./user'));

module.exports = router;
