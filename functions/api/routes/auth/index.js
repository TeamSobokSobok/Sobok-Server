var express = require('express');
const authController = require('../../../controller/authController');
var router = express.Router();

router.post('/signup', authController.signUp);
router.get('/signin', authController.signIn);

module.exports = router;
