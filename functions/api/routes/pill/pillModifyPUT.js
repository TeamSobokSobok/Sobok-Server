const functions = require('firebase-functions');
const util = require('../../../lib/util');
const statusCode = require('../../../constants/statusCode');
const responseMessage = require('../../../constants/responseMessage');
const db = require('../../../db/db');
const { scheduleDB, pillDB } = require('../../../db');

module.exports = async (req, res) => {
  const { user } = req.header;
  const { pillId } = req.params;
  const { pillName, isStop, color, start, end, cycle, day, time, specific } = req.body;
  const week = new Array('일', '월', '화', '수', '목', '금', '토');

  if (!user || !pillId) return res.status(statusCode.BAD_REQUEST).send(util.fail(statusCode.BAD_REQUEST, responseMessage.NULL_VALUE));
  let client;
  try {
    client = await db.connect(req);

    const deleteSchedule = await scheduleDB.deleteScheduleByPillId(client, pillId);

    // 약 주기 정보 날짜별로 db에 저장
    let startDate = new Date(start);
    let endDate = new Date(end);

    const updatePillName = await pillDB.updatePillNameByPillId(client, pillId, pillName);

    const term = Math.abs(endDate - startDate) / (1000 * 3600 * 24) + 1;
    if (cycle === '1') {
      for (let date = 0; date < term; date++) {
        for (let t = 0; t < time.length; t++) {
          let newSchedule = await scheduleDB.addSchedule(client, pillId, user.id, start, end, cycle, startDate, specific, day, time[t]);
        }
        startDate.setDate(startDate.getDate() + 1);
      }
    }

    if (cycle === '2') {
      let dayList = day.split(', ');

      for (let date = 0; date < term; date++) {
        for (let d = 0; d < dayList.length; d++) {
          if (week[startDate.getDay()] === dayList[d]) {
            for (let t = 0; t < time.length; t++) {
              let newSchedule = await scheduleDB.addSchedule(client, pillId, user.id, start, end, cycle, startDate, specific, day, time[t]);
            }
            break;
          }
        }
        startDate.setDate(startDate.getDate() + 1);
      }
    }

    if (cycle === '3') {
      let specificNumber = specific.substr(0, 1);
      let specificCycle = specific.substr(1);

      if (specificCycle === 'day') {
        while (startDate < endDate) {
          for (let t = 0; t < time.length; t++) {
            let newSchedule = await scheduleDB.addSchedule(client, pillId, user.id, start, end, cycle, startDate, specific, day, time[t]);
          }
          startDate.setDate(startDate.getDate() + Number(specificNumber));
        }
      }

      if (specificCycle === 'week') {
        while (startDate < endDate) {
          for (let t = 0; t < time.length; t++) {
            let newSchedule = await scheduleDB.addSchedule(client, pillId, user.id, start, end, cycle, startDate, specific, day, time[t]);
          }
          startDate.setDate(startDate.getDate() + Number(specificNumber) * 7);
        }
      }

      if (specificCycle === 'month') {
        while (startDate < endDate) {
          for (let t = 0; t < time.length; t++) {
            let newSchedule = await scheduleDB.addSchedule(client, pillId, user.id, start, end, cycle, startDate, specific, day, time[t]);
          }
          startDate.setMonth(startDate.getMonth() + Number(specificNumber));
        }
      }
    }

    res.status(statusCode.OK).send(util.success(statusCode.OK, responseMessage.PILL_MODIFY_SUCCESS));
  } catch (error) {
    functions.logger.error(`[ERROR] [${req.method.toUpperCase()}] ${req.originalUrl}`, `[CONTENT] ${error}`);
    console.log(error);

    res.status(statusCode.INTERNAL_SERVER_ERROR).send(util.fail(statusCode.INTERNAL_SERVER_ERROR, responseMessage.INTERNAL_SERVER_ERROR));
  } finally {
    client.release();
  }
};
