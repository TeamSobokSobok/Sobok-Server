const functions = require('firebase-functions');
const util = require('../../../lib/util');
const statusCode = require('../../../constants/statusCode');
const responseMessage = require('../../../constants/responseMessage');
const db = require('../../../db/db');
const { scheduleDB } = require('../../../db');
const dayjs = require('dayjs');

module.exports = async (req, res) => {
  const { memberId } = req.params;
  const { date } = req.query;

  let client;

  try {
    client = await db.connect(req);

    const startDate = dayjs(date).startOf('month').format();
    const endDate = dayjs(date).endOf('month').format();

    const memberCalender = await scheduleDB.findScheduleByMemberId(client, memberId, startDate, endDate);

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

    res.status(statusCode.INTERNAL_SERVER_ERROR).send(util.fail(statusCode.INTERNAL_SERVER_ERROR, responseMessage.INTERNAL_SERVER_ERROR));
  } finally {
    client.release();
  }
};
