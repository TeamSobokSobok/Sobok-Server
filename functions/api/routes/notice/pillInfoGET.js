const functions = require('firebase-functions');
const util = require('../../../lib/util');
const statusCode = require('../../../constants/statusCode');
const responseMessage = require('../../../constants/responseMessage');
const db = require('../../../db/db');

const { sendPillDB, userDB } = require('../../../db');
const { scheduleDB } = require('../../../db');

module.exports = async (req, res) => {
  const { user } = req.header;
  const { senderId, receiverId, createdAt } = req.query;

  let client;

  try {
    client = await db.connect(req);

    const findSendPill = await sendPillDB.getsendPillByCreatedAt(client, senderId, receiverId, createdAt);
    const findReceiver = findSendPill[0].receiverId;
    if (findReceiver !== user.id) return res.status(statusCode.UNAUTHORIZED).send(util.fail(statusCode.UNAUTHORIZED, responseMessage.NO_AUTHENTICATED));

    const senderName = await userDB.findUserNameById(client, senderId);

    let pillData = [];

    for (let pillCount = 0; pillCount < findSendPill.length; pillCount++) {
      let pillInfo = await scheduleDB.findScheduleByPillId(client, findSendPill[pillCount].pillId);
      let pillTime = await scheduleDB.findScheduleTimeByPillId(client, findSendPill[pillCount].pillId);
      let scheduleTime = [];

      pillData.push(pillInfo[0]);
      for (let timeCount = 0; timeCount < pillTime.length; timeCount++) {
        scheduleTime.push(pillTime[timeCount].scheduleTime);
      }
      scheduleTime.sort();
      pillData[pillCount].scheduleTime = scheduleTime;
    }

    res.status(statusCode.OK).send(util.success(statusCode.OK, responseMessage.PILL_GET_SUCCESS, { senderName: senderName[0].username, pillData }));
  } catch (error) {
    functions.logger.error(`[ERROR] [${req.method.toUpperCase()}] ${req.originalUrl}`, `[CONTENT] ${error}`);
    console.log(error);

    res.status(statusCode.INTERNAL_SERVER_ERROR).send(util.fail(statusCode.INTERNAL_SERVER_ERROR, responseMessage.INTERNAL_SERVER_ERROR));
  } finally {
    client.release();
  }
};
