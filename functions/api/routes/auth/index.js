var express = require('express');
const authController = require('../../../controller/authController');
var router = express.Router();

router.post('/', authController.signUp);
router.post('/login/email', authController.authEmail);

module.exports = router;
