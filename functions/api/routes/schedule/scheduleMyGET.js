const functions = require('firebase-functions');
const util = require('../../../lib/util');
const statusCode = require('../../../constants/statusCode');
const responseMessage = require('../../../constants/responseMessage');
const db = require('../../../db/db');
const { scheduleDB } = require('../../../db');
const dayjs = require('dayjs');

module.exports = async (req, res) => {
  const { date } = req.query;
  const { user } = req.header;

  if (!date) return res.status(statusCode.BAD_REQUEST).send(util.fail(statusCode.BAD_REQUEST, responseMessage.NULL_VALUE));

  let client;
  try {
    client = await db.connect(req);

    const startDate = dayjs(date).startOf('month').format('YYYY-MM-DD');
    const endDate = dayjs(date).endOf('month').format('YYYY-MM-DD');

    const myCalender = await scheduleDB.findCalendarByMemberId(client, user.id, startDate, endDate);

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

    res.status(statusCode.INTERNAL_SERVER_ERROR).send(util.fail(statusCode.INTERNAL_SERVER_ERROR, responseMessage.INTERNAL_SERVER_ERROR));
  } finally {
    client.release();
  }
};