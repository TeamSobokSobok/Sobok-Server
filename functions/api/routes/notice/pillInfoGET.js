const functions = require('firebase-functions');
const util = require('../../../lib/util');
const statusCode = require('../../../constants/statusCode');
const responseMessage = require('../../../constants/responseMessage');
const db = require('../../../db/db');

module.exports = async (req, res) => {
  let senderId = req.param('senderId');
  let receiverId = req.param('receiverId');

  let client;

  try {
    client = await db.connect(req);
    
  } catch (error) {

  } finally {
    client.release();
  }
}