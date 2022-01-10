var express = require('express');
var router = express.Router();

router.post('/', require('./authSignupPOST'));

module.exports = router;
