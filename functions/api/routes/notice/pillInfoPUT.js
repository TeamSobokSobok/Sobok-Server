const functions = require('firebase-functions');
const util = require('../../../lib/util');
const statusCode = require('../../../constants/statusCode');
const responseMessage = require('../../../constants/responseMessage');
const db = require('../../../db/db');
const { sendPillDB, scheduleDB, pillDB } = require('../../../db');

module.exports = async (req, res) => {
  const { senderId, receiverId, createdAt } = req.query;
  const { isOkay } = req.body;

  let client;

  try {
    client = await db.connect(req);

    const pillId = await sendPillDB.getPillIdByMemberId(client, senderId, receiverId, createdAt);

    // 이미 요청이 처리된 약인지 확인
    if (pillId.length === 0) return res.status(statusCode.CONFLICT).send(util.fail(statusCode.CONFLICT, responseMessage.ALREADY_PILL_ACCEPT));

    for (let pillCount = 0; pillCount < pillId.length; pillCount++) {
      let acceptSendPill = await sendPillDB.updateSendPillByPillId(client, pillId[pillCount].pillId, isOkay);
      let acceptSchedule = await scheduleDB.acceptPillByPillId(client, receiverId, pillId[pillCount].pillId);
      let acceptPill = await pillDB.acceptPillByPillId(client, receiverId, pillId[pillCount].pillId);
    }

    if (isOkay) {
      res.status(statusCode.OK).send(util.success(statusCode.OK, responseMessage.PILL_ACCEPT_SUCCESS));
    } else {
      res.status(statusCode.OK).send(util.success(statusCode.OK, responseMessage.PILL_REFUSE_SUCCESS));
    }
  } catch (error) {
    functions.logger.error(`[ERROR] [${req.method.toUpperCase()}] ${req.originalUrl}`, `[CONTENT] ${error}`);
    console.log(error);

    res.status(statusCode.INTERNAL_SERVER_ERROR).send(util.fail(statusCode.INTERNAL_SERVER_ERROR, responseMessage.INTERNAL_SERVER_ERROR));
  } finally {
    client.release();
  }
};
