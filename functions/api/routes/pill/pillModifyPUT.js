const functions = require('firebase-functions');
const util = require('../../../lib/util');
const statusCode = require('../../../constants/statusCode');
const responseMessage = require('../../../constants/responseMessage');
const db = require('../../../db/db');
const { scheduleDB, pillDB, sendPillDB } = require('../../../db');
const slackAPI = require('../../../middlewares/slackAPI');

const dayjs = require('dayjs');
const isSameOrBefore = require('dayjs/plugin/isSameOrBefore');

module.exports = async (req, res) => {
  const { user } = req.header;
  const { pillId } = req.params;
  const { pillName, isStop, color, start, end, cycle, day, time, specific } = req.body;
  const week = new Array('일', '월', '화', '수', '목', '금', '토');

  dayjs.extend(isSameOrBefore);

  if (!user) {
    return res.status(statusCode.UNAUTHORIZED).send(util.fail(statusCode.UNAUTHORIZED, responseMessage.NO_AUTHENTICATED));
  }

  if (!pillId) {
    return res.status(statusCode.BAD_REQUEST).send(util.fail(statusCode.BAD_REQUEST, responseMessage.NULL_VALUE));
  }

  let client;
  try {
    client = await db.connect(req);

    const userCheck = await pillDB.getUserIdByPillId(client, pillId);
    const receiverCheck = await sendPillDB.getUserIdByPillId(client, pillId);

    if (userCheck.length === 0 && receiverCheck.length === 0) {
      return res.status(statusCode.BAD_REQUEST).send(util.fail(statusCode.BAD_REQUEST, responseMessage.OUT_OF_VALUE));
    }

    if (userCheck[0].userId === null) {
      if (receiverCheck[0].receiverId !== user.id) {
        return res.status(statusCode.UNAUTHORIZED).send(util.fail(statusCode.UNAUTHORIZED, responseMessage.NO_AUTHENTICATED));
      }

      const deleteSchedule = await scheduleDB.deleteScheduleByPillId(client, pillId);

      // 약 주기 정보 날짜별로 db에 저장
      let startDate = dayjs(start);
      let endDate = dayjs(end);

      const updatePillName = await pillDB.updatePillNameByPillId(client, pillId, pillName);

      const term = endDate.diff(startDate, 'day') + 1;

      if (cycle === '1') {
        for (let day = 0; day < term; day++) {
          for (let t = 0; t < time.length; t++) {
            let newSchedule = await scheduleDB.addSchedule(client, pillId, null, start, end, cycle, startDate.add(day, 'day'), specific, day, time[t]);
          }
        }
      }

      if (cycle === '2') {
        let dayList = day.split(', ');
        console.log(dayList);

        for (let day = 0; day < term; day++) {
          for (let t = 0; t < time.length; t++) {
            for (let dayCheck = 0; dayCheck < dayList.length; dayCheck++) {
              if (week[startDate.add(day, 'day').get('day')] === dayList[dayCheck]) {
                let newSchedule = await scheduleDB.addSchedule(client, pillId, null, start, end, cycle, startDate.add(day, 'day'), specific, day, time[t]);
              }
            }
          }
        }
      }

      if (cycle === '3') {
        let specificNumber = Number(specific.substr(0, 1));
        let specificCycle = specific.substr(1);

        if (specificCycle === 'day') {
          for (let day = 0; day < term; day += specificNumber) {
            for (let t = 0; t < time.length; t++) {
              let newSchedule = await scheduleDB.addSchedule(client, pillId, null, start, end, cycle, startDate.add(day, 'day'), specific, day, time[t]);
            }
          }
        }

        if (specificCycle === 'week') {
          for (let day = 0; day < term; day += 7) {
            for (let t = 0; t < time.length; t++) {
              let newSchedule = await scheduleDB.addSchedule(client, pillId, null, start, end, cycle, startDate.add(day * specificNumber, 'day'), specific, day, time[t]);
            }
          }
        }

        if (specificCycle === 'month') {
          while (startDate.isSameOrBefore(endDate)) {
            for (let t = 0; t < time.length; t++) {
              let newSchedule = await scheduleDB.addSchedule(client, pillId, null, start, end, cycle, startDate, specific, day, time[t]);
            }
            startDate = startDate.add(specificNumber, 'month');
          }
        }
      }
    }

    if (receiverCheck.length === 0) {
      if (userCheck[0].userId !== user.id) {
        return res.status(statusCode.UNAUTHORIZED).send(util.fail(statusCode.UNAUTHORIZED, responseMessage.NO_AUTHENTICATED));
      }

      const deleteSchedule = await scheduleDB.deleteScheduleByPillId(client, pillId);

      // 약 주기 정보 날짜별로 db에 저장
      let startDate = dayjs(start);
      let endDate = dayjs(end);

      const updatePillName = await pillDB.updatePillNameByPillId(client, pillId, pillName);

      const term = endDate.diff(startDate, 'day') + 1;

      if (cycle === '1') {
        for (let day = 0; day < term; day++) {
          for (let t = 0; t < time.length; t++) {
            let newSchedule = await scheduleDB.addSchedule(client, pillId, null, start, end, cycle, startDate.add(day, 'day'), specific, day, time[t]);
          }
        }
      }

      if (cycle === '2') {
        let dayList = day.split(', ');
        console.log(dayList);

        for (let day = 0; day < term; day++) {
          for (let t = 0; t < time.length; t++) {
            for (let dayCheck = 0; dayCheck < dayList.length; dayCheck++) {
              if (week[startDate.add(day, 'day').get('day')] === dayList[dayCheck]) {
                let newSchedule = await scheduleDB.addSchedule(client, pillId, null, start, end, cycle, startDate.add(day, 'day'), specific, day, time[t]);
              }
            }
          }
        }
      }

      if (cycle === '3') {
        let specificNumber = Number(specific.substr(0, 1));
        let specificCycle = specific.substr(1);

        if (specificCycle === 'day') {
          for (let day = 0; day < term; day += specificNumber) {
            for (let t = 0; t < time.length; t++) {
              let newSchedule = await scheduleDB.addSchedule(client, pillId, null, start, end, cycle, startDate.add(day, 'day'), specific, day, time[t]);
            }
          }
        }

        if (specificCycle === 'week') {
          for (let day = 0; day < term; day += 7) {
            for (let t = 0; t < time.length; t++) {
              let newSchedule = await scheduleDB.addSchedule(client, pillId, null, start, end, cycle, startDate.add(day * specificNumber, 'day'), specific, day, time[t]);
            }
          }
        }

        if (specificCycle === 'month') {
          while (startDate.isSameOrBefore(endDate)) {
            for (let t = 0; t < time.length; t++) {
              let newSchedule = await scheduleDB.addSchedule(client, pillId, null, start, end, cycle, startDate, specific, day, time[t]);
            }
            startDate = startDate.add(specificNumber, 'month');
          }
        }
      }
    }

    res.status(statusCode.OK).send(util.success(statusCode.OK, responseMessage.PILL_MODIFY_SUCCESS));
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
