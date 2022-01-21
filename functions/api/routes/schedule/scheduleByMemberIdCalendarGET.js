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
  const { date } = req.query;

  if (!memberId || !date) return res.status(statusCode.BAD_REQUEST).send(util.fail(statusCode.BAD_REQUEST, responseMessage.NULL_VALUE));

  let client;

  try {
    client = await db.connect(req);

    // 조회할 날짜를 한 달로 변경
    const startDate = dayjs(date).startOf('month').format('YYYY-MM-DD');
    const endDate = dayjs(date).endOf('month').format('YYYY-MM-DD');

    // 캘린더 공유를 수락했는지 확인
    const findSendGroup = await groupDB.findSendGroupIsOkay(client, user.id, memberId);
    if (findSendGroup.length === 0) return res.status(statusCode.UNAUTHORIZED).send(util.fail(statusCode.UNAUTHORIZED, responseMessage.NO_AUTHENTICATED));

    const memberCalender = await scheduleDB.findCalendarByMemberId(client, memberId, startDate, endDate);

    // 약 스케줄 개수와 체크 완료된 스케줄 개수 비교
    for (let i = 0; i < memberCalender.length; i++) {
      const scheduleCount = memberCalender[i].scheduleCount;
      const isCheckCount = memberCalender[i].isCheckCount;

      if (scheduleCount === isCheckCount) {
        memberCalender[i].isComplete = 'done';
      } else if (isCheckCount === '0') {
        memberCalender[i].isComplete = 'none';
      } else memberCalender[i].isComplete = 'doing';
    }

    res.status(statusCode.OK).send(util.success(statusCode.OK, responseMessage.READ_MEMBER_CALENDAR, memberCalender));
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
