const functions = require('firebase-functions');
const util = require('../../../lib/util');
const statusCode = require('../../../constants/statusCode');
const responseMessage = require('../../../constants/responseMessage');
const db = require('../../../db/db');
const { scheduleDB } = require('../../../db');
const dayjs = require('dayjs');

module.exports = async (req, res) => {
  const { memberId } = req.params;
  let { date } = req.query;

  if (!memberId || !date) return res.status(statusCode.BAD_REQUEST).send(util.fail(statusCode.BAD_REQUEST, responseMessage.NULL_VALUE));

  let client;

  try {
    client = await db.connect(req);

    date = dayjs(date).format('YYYY-MM-DD');

    let findmemberScheduleTime = await scheduleDB.findScheduleTime(client, memberId, date);

    for (let i = 0; i < findmemberScheduleTime.length; i++) {
      let scheduleList = await scheduleDB.findScheduleByMemberId(client, memberId, date, findmemberScheduleTime[i].scheduleTime);
      findmemberScheduleTime[i].scheduleList = scheduleList;
    }

    res.status(statusCode.OK).send(util.success(statusCode.OK, responseMessage.READ_MEMBER_SCHEDULE, findmemberScheduleTime));
  } catch (error) {
    functions.logger.error(`[ERROR] [${req.method.toUpperCase()}] ${req.originalUrl}`, `[CONTENT] ${error}`);
    console.log(error);

    res.status(statusCode.INTERNAL_SERVER_ERROR).send(util.fail(statusCode.INTERNAL_SERVER_ERROR, responseMessage.INTERNAL_SERVER_ERROR));
  } finally {
    client.release();
  }
};
