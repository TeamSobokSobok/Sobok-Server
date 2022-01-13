const express = require('express');
const router = express.Router();

router.get('/', require('./pillInfoGET'));

module.exports = router;