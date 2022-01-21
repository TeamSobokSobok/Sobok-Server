const functions = require('firebase-functions');
const util = require('../../../lib/util');
const statusCode = require('../../../constants/statusCode');
const responseMessage = require('../../../constants/responseMessage');
const db = require('../../../db/db');
const { scheduleDB, groupDB } = require('../../../db');
const dayjs = require('dayjs');
const slackAPI = require('../../../middlewares/slackAPI');

module.exports = async (req, res) => {
  const { user } = req.header;
  const { memberId } = req.params;
  let { date } = req.query;

  if (!memberId || !date) return res.status(statusCode.BAD_REQUEST).send(util.fail(statusCode.BAD_REQUEST, responseMessage.NULL_VALUE));

  let client;

  try {
    client = await db.connect(req);

    date = dayjs(date).format('YYYY-MM-DD');

    // 캘린더 공유를 수락했는지 확인
    const findSendGroup = await groupDB.findSendGroupIsOkay(client, user.id, memberId);
    if (findSendGroup.length === 0) return res.status(statusCode.UNAUTHORIZED).send(util.fail(statusCode.UNAUTHORIZED, responseMessage.NO_AUTHENTICATED));

    // 해당 멤버의 스케줄 날짜에 대한 시간 정보 불러오기
    let findmemberScheduleTime = await scheduleDB.findScheduleTime(client, memberId, date);

    // 사용자가 보낸 스티커 리스트 조회
    const findUserLikeScheduleList = await scheduleDB.findUserLikeScheduleList(client, user.id);
    const userLikeScheduleList = findUserLikeScheduleList.map((userLikeSchedule) => userLikeSchedule.scheduleId);

    for (let i = 0; i < findmemberScheduleTime.length; i++) {
      // 시간에 대한 스케줄 리스트 불러오기
      let scheduleList = await scheduleDB.findScheduleByMemberId(client, memberId, date, findmemberScheduleTime[i].scheduleTime);
      findmemberScheduleTime[i].scheduleList = scheduleList;

      for (let v = 0; v < scheduleList.length; v++) {
        let scheduleId = scheduleList[v].scheduleId;

        // 스케줄id로 스티커 4개 불러오기
        // 내가 보낸 스티커를 맨 앞으로 정렬해서 불러오기
        let stickerList = await scheduleDB.findLikeScheduleByScheduleId(client, scheduleId, user.id);
        scheduleList[v].stickerId = stickerList;

        // 약 스케줄에 대한 전체 스티커 리스트 조회
        let stickerTotalCount = await scheduleDB.findAllLikeScheduleByScheduleId(client, scheduleId);
        scheduleList[v].stickerTotalCount = stickerTotalCount.length;

        // 스티커를 보낸 스케줄인지 조회
        const isLikedSchedule = await scheduleDB.isLikedSchedule(client, scheduleList[v].scheduleId, userLikeScheduleList);
        scheduleList[v].isLikedSchedule = isLikedSchedule;
      }
    }

    res.status(statusCode.OK).send(util.success(statusCode.OK, responseMessage.READ_MEMBER_SCHEDULE, findmemberScheduleTime));
  } catch (error) {
    functions.logger.error(`[ERROR] [${req.method.toUpperCase()}] ${req.originalUrl}`, `[CONTENT] ${error}`);
    console.log(error);

    const slackMessage = `[ERROR] [${req.method.toUpperCase()}] ${req.originalUrl} ${req.user ? `uid:${req.header.user.id}` : 'req.user 없음'} ${JSON.stringify(error)}`;
    slackAPI.sendMessageToSlack(slackMessage, slackAPI.DEV_WEB_HOOK_ERROR_MONITORING);

    res.status(statusCode.INTERNAL_SERVER_ERROR).send(util.fail(statusCode.INTERNAL_SERVER_ERROR, responseMessage.INTERNAL_SERVER_ERROR));
  } finally {
    client.release();
  }
};
