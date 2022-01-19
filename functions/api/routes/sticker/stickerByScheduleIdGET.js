const functions = require('firebase-functions');
const util = require('../../../lib/util');
const statusCode = require('../../../constants/statusCode');
const responseMessage = require('../../../constants/responseMessage');
const db = require('../../../db/db');
const { scheduleDB } = require('../../../db');
const slackAPI = require('../../../middlewares/slackAPI');

module.exports = async (req, res) => {
  const { scheduleId } = req.params;
  const { user } = req.header;

  if (!scheduleId) return res.status(statusCode.BAD_REQUEST).send(util.fail(statusCode.BAD_REQUEST, responseMessage.NULL_VALUE));

  let client;

  try {
    client = await db.connect(req);

    // 약 스케줄에 대한 전체 스티커 리스트 조회
    let likeScheduleList = await scheduleDB.findLikeSchedule(client, scheduleId, user.id);

    // 사용자가 보낸 스티커 리스트 조회
    const findUserLikeScheduleList = await scheduleDB.findUserLikeScheduleList(client, user.id);
    const userLikeScheduleList = findUserLikeScheduleList.map((userLikeSchedule) => userLikeSchedule.id);

    for (let i = 0; i < likeScheduleList.length; i++) {
      // 내가 보낸 스티커인지 확인
      const isMySticker = await scheduleDB.isLikedSchedule(client, likeScheduleList[i].likeScheduleId, userLikeScheduleList);
      likeScheduleList[i].isMySticker = isMySticker;
    }

    res.status(statusCode.OK).send(util.success(statusCode.OK, responseMessage.READ_ALL_SEND_STICKER, likeScheduleList));
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
