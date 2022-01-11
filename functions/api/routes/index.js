const express = require('express');
const router = express.Router();

router.use('/auth', require('./auth'));
router.use('/pill', require('./pill'));

module.exports = router;
