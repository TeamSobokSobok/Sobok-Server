const functions = require('firebase-functions');
const admin = require('firebase-admin');
const util = require('../../../lib/util');
const statusCode = require('../../../constants/statusCode');
const responseMessage = require('../../../constants/responseMessage');
const db = require('../../../db/db');
const slackAPI = require('../../../middlewares/slackAPI');

const { pillDB, userDB } = require('../../../db');

module.exports = async (req, res) => {
  const { userId } = req.params;
  let client;

  try {
    client = await db.connect(req);

    const userCheck = await userDB.findUserById(client, userId);

    if (!userCheck) return res.status(statusCode.BAD_REQUEST).send(util.fail(statusCode.BAD_REQUEST, responseMessage.NO_USER));

    const pillCount = await pillDB.getPillCountById(client, userId);
    const possiblePillCount = 5 - pillCount[0].count;

    // 성공
    res.status(statusCode.OK).send(util.success(statusCode.OK, responseMessage.PILL_COUNT_SUCCESS, { pillCount: possiblePillCount }));
  } catch (error) {
    functions.logger.error(`[ERROR] [${req.method.toUpperCase()}] ${req.originalUrl}`, `[CONTENT] ${error}`);
    console.log(error);

    const slackMessage = `[ERROR] [${req.method.toUpperCase()}] ${req.originalUrl} ${req.header.user ? `uid:${req.header.user.id}` : 'req.user 없음'} ${JSON.stringify(error)}`;
    slackAPI.sendMessageToSlack(slackMessage, slackAPI.DEV_WEB_HOOK_ERROR_MONITORING);

    res.status(statusCode.INTERNAL_SERVER_ERROR).send(util.fail(statusCode.INTERNAL_SERVER_ERROR, responseMessage.INTERNAL_SERVER_ERROR));
  } finally {
    client.release();
  }
};
