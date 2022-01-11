const functions = require('firebase-functions');
const admin = require('firebase-admin');
const util = require('../../../lib/util');
const statusCode = require('../../../constants/statusCode');
const responseMessage = require('../../../constants/responseMessage');
const db = require('../../../db/db');

const { pillDB } = require('../../../db');

module.exports = async (req, res) => {
  const { receiverId } = req.params;
  let client;

  try {
    client = await db.connect(req);

    const pillCount = await pillDB.getPillCountById(client, receiverId);
    const possiblePillCount = 5 - pillCount[0].count;

    // 성공
    res.status(statusCode.OK).send(util.success(statusCode.OK, responseMessage.PILL_COUNT_SUCCESS, {"pillCount" : possiblePillCount}));
  } catch (error) {
    functions.logger.error(`[ERROR] [${req.method.toUpperCase()}] ${req.originalUrl}`, `[CONTENT] ${error}`);
    console.log(error);

    res.status(statusCode.INTERNAL_SERVER_ERROR).send(util.fail(statusCode.INTERNAL_SERVER_ERROR, responseMessage.INTERNAL_SERVER_ERROR));
  } finally {
    client.release();
  }
}