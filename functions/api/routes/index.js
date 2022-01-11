const express = require('express');
const { checkUser } = require('../../middlewares/auth');
const router = express.Router();

router.use('/auth', require('./auth'));
router.use('/group', require('./group'));

module.exports = router;
