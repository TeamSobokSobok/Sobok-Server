const express = require('express');
const { checkUser } = require('../../../middlewares/auth');
const router = express.Router();

router.post('/', checkUser, require('./pillAditionalPOST'));
router.get('/:userId', checkUser, require('./pillCountGET'));
router.get('/my/count', checkUser, require('./myPillCountGET'));
router.post('/member/:receiverId', checkUser, require('./friendPillAditionalPOST'));
router.put('/:pillId', checkUser, require('./pillModifyPUT'));

module.exports = router;
