const functions = require('firebase-functions');
const util = require('../../../lib/util');
const statusCode = require('../../../constants/statusCode');
const responseMessage = require('../../../constants/responseMessage');
const db = require('../../../db/db');

const { sendPillDB } = require('../../../db');
const { scheduleDB } = require('../../../db');

module.exports = async (req, res) => {
  const senderId = req.param('senderId');
  const receiverId = req.param('receiverId');
  const createdAt = req.param('createdAt');

  let client;

  try {
    client = await db.connect(req);

    const pillId = await sendPillDB.getPillIdByMemberId(client, senderId, receiverId, createdAt);
    let pillData = [];

    for (let pillCount = 0; pillCount < pillId.length; pillCount++) {
      let pillInfo = await scheduleDB.findScheduleByPillId(client, pillId[pillCount].pillId);
      let pillTime = await scheduleDB.findScheduleTimeByPillId(client, pillId[pillCount].pillId);
      let scheduleTime = [];

      pillData.push(pillInfo[0]);
      for (let timeCount = 0; timeCount < pillTime.length; timeCount++) {
        scheduleTime.push(pillTime[timeCount].scheduleTime);
      }
      scheduleTime.sort();
      pillData[pillCount].scheduleTime = scheduleTime;
    }

    res.status(statusCode.OK).send(util.success(statusCode.OK, responseMessage.PILL_GET_SUCCESS, pillData));
  } catch (error) {
    functions.logger.error(`[ERROR] [${req.method.toUpperCase()}] ${req.originalUrl}`, `[CONTENT] ${error}`);
    console.log(error);

    res.status(statusCode.INTERNAL_SERVER_ERROR).send(util.fail(statusCode.INTERNAL_SERVER_ERROR, responseMessage.INTERNAL_SERVER_ERROR));
  } finally {
    client.release();
  }
};
