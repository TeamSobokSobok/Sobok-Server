var express = require('express');
const { checkUser } = require('../../../middlewares/auth');
var router = express.Router();

router.get('/', checkUser, require('./groupGET'));

module.exports = router;
