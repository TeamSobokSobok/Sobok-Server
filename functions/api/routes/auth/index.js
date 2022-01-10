var express = require('express');
var router = express.Router();

router.post('/', require('./authSignupPOST'));
router.post('/login/email', require('./authLoginEmailPOST'));

module.exports = router;
