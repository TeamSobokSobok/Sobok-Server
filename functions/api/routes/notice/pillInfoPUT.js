const functions = require('firebase-functions');
const util = require('../../../lib/util');
const statusCode = require('../../../constants/statusCode');
const responseMessage = require('../../../constants/responseMessage');
const db = require('../../../db/db');
const { sendPillDB, scheduleDB, pillDB } = require('../../../db');

module.exports = async (req, res) => {
  const senderId = req.param('senderId');
  const receiverId = req.param('receiverId');
  const { isOkay } = req.body;

  let client;
  try {
    client = await db.connect(req);

    const pillId = await sendPillDB.getPillIdByMemberId(client, senderId, receiverId);

    for (let pillCount = 0; pillCount < pillId.length; pillCount++) {
      if (isOkay) {
        let acceptSendPill = await sendPillDB.acceptSendPillByPillId(client, pillId[pillCount].pillId);
        let acceptSchedule = await scheduleDB.acceptPillByPillId(client, receiverId, pillId[pillCount].pillId);
        let acceptPill = await pillDB.acceptPillByPillId(client, receiverId, pillId[pillCount].pillId);
      } else {
        let refuseSendPill = await sendPillDB.refuseSendPillByPillId(client, pillId[pillCount].pillId);
      }
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
