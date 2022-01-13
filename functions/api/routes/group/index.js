const express = require('express');
const { checkUser } = require('../../../middlewares/auth');
const router = express.Router();

router.get('/', checkUser, require('./groupGET'));
router.put('/name/:groupId', checkUser, require('./groupNamePUT'));

module.exports = router;
