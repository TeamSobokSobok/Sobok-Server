const functions = require('firebase-functions');
const util = require('../../../lib/util');
const statusCode = require('../../../constants/statusCode');
const responseMessage = require('../../../constants/responseMessage');
const db = require('../../../db/db');
const { sendPillDB, scheduleDB, pillDB } = require('../../../db');
const slackAPI = require('../../../middlewares/slackAPI');

module.exports = async (req, res) => {
  const { user } = req.header;
  const { senderId, createdAt } = req.query;
  const { isOkay } = req.body;

  if (!senderId || !createdAt) {
    return res.status(statusCode.BAD_REQUEST).send(util.fail(statusCode.BAD_REQUEST, responseMessage.NULL_VALUE));
  }

  console.log(senderId, createdAt, isOkay);

  let client;

  try {
    client = await db.connect(req);

    const findSendPill = await sendPillDB.getsendPillByCreatedAt(client, senderId, user.id, createdAt);
    const userPillCount = await pillDB.getPillCountById(client, user.id);
    const possiblePill = 5 - userPillCount[0].count;

    if (findSendPill.length === 0) return res.status(statusCode.BAD_REQUEST).send(util.fail(statusCode.BAD_REQUEST, responseMessage.NO_PILL_SEND));

    const findReceiver = findSendPill[0].receiverId;
    const findIsOkay = findSendPill[0].isOkay;

    // 약 요청을 수락하려는 사람과 받는 사람의 id 비교
    if (findReceiver !== user.id) return res.status(statusCode.UNAUTHORIZED).send(util.fail(statusCode.UNAUTHORIZED, responseMessage.NO_AUTHENTICATED));

    // 이미 요청이 처리된 약인지 확인
    if (findIsOkay !== null) return res.status(statusCode.CONFLICT).send(util.fail(statusCode.CONFLICT, responseMessage.ALREADY_PILL_ACCEPT));

    if (possiblePill < findSendPill.length) return res.status(statusCode.BAD_REQUEST).send(util.fail(statusCode.BAD_REQUEST, responseMessage.PILL_COUNT_OVER));

    if (isOkay === false) {
      for (let pillCount = 0; pillCount < findSendPill.length; pillCount++) {
        let acceptSendPill = await sendPillDB.updateSendPillByPillId(client, findSendPill[pillCount].pillId, isOkay);
        let deleteScheduleByPillId = await scheduleDB.deleteScheduleByPillId(client, findSendPill[pillCount].pillId);
      }
      return res.status(statusCode.OK).send(util.success(statusCode.OK, responseMessage.PILL_REFUSE_SUCCESS));
    }

    for (let pillCount = 0; pillCount < findSendPill.length; pillCount++) {
      let acceptSendPill = await sendPillDB.updateSendPillByPillId(client, findSendPill[pillCount].pillId, isOkay);
      let acceptSchedule = await scheduleDB.acceptPillByPillId(client, user.id, findSendPill[pillCount].pillId);
      let acceptPill = await pillDB.acceptPillByPillId(client, user.id, findSendPill[pillCount].pillId);
    }

    res.status(statusCode.OK).send(util.success(statusCode.OK, responseMessage.PILL_ACCEPT_SUCCESS));
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
