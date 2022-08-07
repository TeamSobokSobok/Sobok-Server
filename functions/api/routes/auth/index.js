var express = require('express');
const authController = require('../../../controller/authController');
const { checkUser } = require('../../../middlewares/auth');
var router = express.Router();

router.post('/signup', authController.signUp);
router.post('/logout', checkUser, authController.logout);

router.get('/signin', authController.signIn);

module.exports = router;
