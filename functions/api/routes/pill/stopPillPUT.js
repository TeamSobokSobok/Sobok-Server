const functions = require('firebase-functions');
const util = require('../../../lib/util');
const statusCode = require('../../../constants/statusCode');
const responseMessage = require('../../../constants/responseMessage');
const db = require('../../../db/db');
const { pillDB, scheduleDB } = require('../../../db');
const slackAPI = require('../../../middlewares/slackAPI');

module.exports = async (req, res) => {
  const { user } = req.header;
  const { pillId } = req.params;
  const { date } = req.query;

  if (!pillId) return res.status(statusCode.BAD_REQUEST).send(util.fail(statusCode.BAD_REQUEST, responseMessage.OUT_OF_VALUE));

  let client;

  try {
    client = await db.connect(req);

    const pillCheck = await pillDB.getPillById(client, pillId);
    if (pillCheck.length === 0) {
      return res.status(statusCode.BAD_REQUEST).send(util.fail(statusCode.BAD_REQUEST, responseMessage.OUT_OF_VALUE));
    }

    const checkUser = await pillDB.getUserIdByPillId(client, pillId);
    if (checkUser[0].userId !== user.id) {
      return res.status(statusCode.UNAUTHORIZED).send(util.fail(statusCode.UNAUTHORIZED, responseMessage.NO_AUTHENTICATED));
    }

    if (pillCheck[0].isStop === true) {
      return res.status(statusCode.CONFLICT).send(util.fail(statusCode.CONFLICT, responseMessage.ALREADY_PILL_STOP));
    }

    const { stopPill } = await pillDB.stopPillByPillId(client, pillId);
    const { deleteSchedule } = await scheduleDB.deleteScheduleByDate(client, pillId, date);

    res.status(statusCode.OK).send(util.success(statusCode.OK, responseMessage.PILL_STOP_SUCCESS));
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
