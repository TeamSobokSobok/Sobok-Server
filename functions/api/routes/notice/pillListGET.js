const functions = require('firebase-functions');
const util = require('../../../lib/util');
const statusCode = require('../../../constants/statusCode');
const responseMessage = require('../../../constants/responseMessage');
const db = require('../../../db/db');
const { groupDB, sendPillDB, userDB } = require('../../../db');
const slackAPI = require('../../../middlewares/slackAPI');

module.exports = async (req, res) => {
  const { user } = req.header;

  let client;
  try {
    client = await db.connect(req);

    const pillInfo = await sendPillDB.getSenderIdByReceiverId(client, user.id);
    for (let pillCount = 0; pillCount < pillInfo.length; pillCount++) {
      let senderName = await userDB.findUserNameById(client, pillInfo[pillCount].senderId);
      let receiverName = await userDB.findUserNameById(client, pillInfo[pillCount].receiverId);

      pillInfo[pillCount].senderName = senderName[0].username;
      pillInfo[pillCount].receiverName = receiverName[0].username;
    }
    pillInfo.sort((a, b) => a.createdAt - b.createdAt);

    const calendarInfo = await groupDB.findAllMemberByUserId(client, user.id);
    calendarInfo.sort((a, b) => a.createdAt - b.createdAt);

    // console.log(pillInfo);
    // console.log(calendarInfo);

    let noticeList = {};
    noticeList.pillInfo = pillInfo;
    noticeList.calendarInfo = calendarInfo;

    // console.log(noticeList);

    res.status(statusCode.OK).send(util.success(statusCode.OK, responseMessage.NOTICE_GET_SUCCESS, noticeList));
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
