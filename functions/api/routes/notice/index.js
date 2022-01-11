const express = require('express');
const router = express.Router();

router.get('/:pillId', require('./pillInfoGET'));

module.exports = router;