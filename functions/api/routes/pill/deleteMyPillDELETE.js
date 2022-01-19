const functions = require('firebase-functions');
const util = require('../../../lib/util');
const statusCode = require('../../../constants/statusCode');
const responseMessage = require('../../../constants/responseMessage');
const db = require('../../../db/db');
const { pillDB } = require('../../../db');
const slackAPI = require('../../../middlewares/slackAPI');

module.exports = async (req, res) => {
  const { user } = req.header;
  const { pillId } = req.params;

  if (!pillId) return res.status(statusCode.BAD_REQUEST).send(util.fail(statusCode.BAD_REQUEST, responseMessage.OUT_OF_VALUE));

  let client;

  try {
    client = await db.connect(req);

    const userCheck = await pillDB.getUserIdByPillId(client, pillId);

    if (userCheck[0].userId === 0) {
      return res.status(statusCode.BAD_REQUEST).send(util.fail(statusCode.BAD_REQUEST, responseMessage.OUT_OF_VALUE));
    }

    if (userCheck[0].userId !== user.id) {
      return res.status(statusCode.UNAUTHORIZED).send(util.fail(statusCode.UNAUTHORIZED, responseMessage.NO_AUTHENTICATED));
    }

    const deletePill = await pillDB.deletePillByPillId(client, pillId);

    res.status(statusCode.OK).send(util.success(statusCode.OK, responseMessage.PILL_DELETE_SUCCESS));
  } catch (error) {
    functions.logger.error(`[ERROR] [${req.method.toUpperCase()}] ${req.originalUrl}`, `[CONTENT] ${error}`);
    console.log(error);

    const slackMessage = `[ERROR] [${req.method.toUpperCase()}] ${req.originalUrl} ${req.user ? `uid:${req.user.id}` : 'req.user 없음'} ${JSON.stringify(error)}`;
    slackAPI.sendMessageToSlack(slackMessage, slackAPI.DEV_WEB_HOOK_ERROR_MONITORING);

    res.status(statusCode.INTERNAL_SERVER_ERROR).send(util.fail(statusCode.INTERNAL_SERVER_ERROR, responseMessage.INTERNAL_SERVER_ERROR));
  } finally {
    client.release();
  }
};
