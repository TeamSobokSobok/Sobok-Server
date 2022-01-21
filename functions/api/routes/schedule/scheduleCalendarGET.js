const functions = require('firebase-functions');
const util = require('../../../lib/util');
const statusCode = require('../../../constants/statusCode');
const responseMessage = require('../../../constants/responseMessage');
const db = require('../../../db/db');
const { scheduleDB } = require('../../../db');
const dayjs = require('dayjs');
const slackAPI = require('../../../middlewares/slackAPI');

module.exports = async (req, res) => {
  const { date } = req.query;
  const { user } = req.header;

  if (!date) return res.status(statusCode.BAD_REQUEST).send(util.fail(statusCode.BAD_REQUEST, responseMessage.NULL_VALUE));

  let client;
  try {
    client = await db.connect(req);

    // Request로 받은 날짜를 한달 기준으로 startDate, endDate 선언
    const startDate = dayjs(date).startOf('month').format('YYYY-MM-DD');
    const endDate = dayjs(date).endOf('month').format('YYYY-MM-DD');

    // 해당 유저의 아이디로 schedule 정보 조회
    const myCalender = await scheduleDB.findCalendarByMemberId(client, user.id, startDate, endDate);

    // 약 스케줄 개수와 체크 완료된 스케줄 개수 비교
    for (let i = 0; i < myCalender.length; i++) {
      const scheduleCount = myCalender[i].scheduleCount;
      const isCheckCount = myCalender[i].isCheckCount;

      if (scheduleCount === isCheckCount) {
        myCalender[i].isComplete = 'done';
      } else if (isCheckCount === '0') {
        myCalender[i].isComplete = 'none';
      } else myCalender[i].isComplete = 'doing';
    }

    res.status(statusCode.OK).send(util.success(statusCode.OK, responseMessage.READ_MY_CALENDAR, myCalender));
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
