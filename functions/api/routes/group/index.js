const express = require('express');
const { checkUser } = require('../../../middlewares/auth');
const router = express.Router();

router.get('/', checkUser, require('./groupGET'));
router.put('/:groupId/name', checkUser, require('./groupByGroupIdNamePUT'));

module.exports = router;
