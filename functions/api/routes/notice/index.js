const express = require('express');
const router = express.Router();

router.get('/', require('./pillInfoGET'));
router.put('/', require('./pillInfoPUT'));

module.exports = router;
