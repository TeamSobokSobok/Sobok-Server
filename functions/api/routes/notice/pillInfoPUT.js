const functions = require('firebase-functions');
const util = require('../../../lib/util');
const statusCode = require('../../../constants/statusCode');
const responseMessage = require('../../../constants/responseMessage');
const db = require('../../../db/db');
const { sendPillDB, scheduleDB, pillDB } = require('../../../db');

module.exports = async (req, res) => {
  const { user } = req.header;
  const { senderId, receiverId, createdAt } = req.query;
  const { isOkay } = req.body;

  let client;

  try {
    client = await db.connect(req);

    const findSendPill = await sendPillDB.getsendPillByCreatedAt(client, senderId, receiverId, createdAt);
    const findReceiver = findSendPill[0].receiverId;
    const findIsOkay = findSendPill[0].isOkay;

    // 약 요청을 수락하려는 사람과 받는 사람의 id 비교
    if (findReceiver !== user.id) return res.status(statusCode.UNAUTHORIZED).send(util.fail(statusCode.UNAUTHORIZED, responseMessage.NO_AUTHENTICATED));

    // 이미 요청이 처리된 약인지 확인
    if (findIsOkay !== null) return res.status(statusCode.CONFLICT).send(util.fail(statusCode.CONFLICT, responseMessage.ALREADY_PILL_ACCEPT));

    for (let pillCount = 0; pillCount < findSendPill.length; pillCount++) {
      let acceptSendPill = await sendPillDB.updateSendPillByPillId(client, findSendPill[pillCount].pillId, isOkay);
      let acceptSchedule = await scheduleDB.acceptPillByPillId(client, receiverId, findSendPill[pillCount].pillId);
      let acceptPill = await pillDB.acceptPillByPillId(client, receiverId, findSendPill[pillCount].pillId);
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
