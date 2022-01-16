const functions = require('firebase-functions');
const admin = require('firebase-admin');
const util = require('../../../lib/util');
const statusCode = require('../../../constants/statusCode');
const responseMessage = require('../../../constants/responseMessage');
const db = require('../../../db/db');

const { pillDB } = require('../../../db');
const { scheduleDB } = require('../../../db');

module.exports = async (req, res) => {
  const { pillList } = req.body;
  const { user } = req.header;
  const week = new Array('일', '월', '화', '수', '목', '금', '토');

  if (!pillList) {
    return res.status(statusCode.BAD_REQUEST).send(util.fail(statusCode.BAD_REQUEST, responseMessage.NULL_VALUE));
  }

  let client;

  try {
    client = await db.connect(req);

    // 사용자가 추가 가능한 약 개수 확인
    const pillCount = await pillDB.getPillCountById(client, user.id);
    const possiblePillCount = 5 - pillCount[0].count;

    if (possiblePillCount < pillList.length) {
      return res.status(statusCode.BAD_REQUEST).send(util.fail(statusCode.BAD_REQUEST, responseMessage.PILL_COUNT_OVER));
    }

    let pill;
    // 약 리스트에서 약 하나씩 순회, 약 정보 db에 저장 ()
    for (let index = 0; index < pillList.length; index++) {
      pill = pillList[index];
      let newPill = await pillDB.addPill(client, pill.pillName, user.id, pill.color, false);

      // 약 주기 정보 날짜별로 db에 저장
      let startDate = new Date(pill.start);
      let endDate = new Date(pill.end);

      const term = Math.abs(endDate - startDate) / (1000 * 3600 * 24) + 1;
      if (pill.cycle === '1') {
        for (let day = 0; day < term; day++) {
          for (let t = 0; t < pill.time.length; t++) {
            let newSchedule = await scheduleDB.addSchedule(client, newPill[0].id, user.id, pill.start, pill.end, pill.cycle, startDate, pill.specific, pill.day, pill.time[t]);
          }
          startDate.setDate(startDate.getDate() + 1);
        }
      }

      if (pill.cycle === '2') {
        let dayList = pill.day.split(', ');

        for (let day = 0; day < term; day++) {
          for (let d = 0; d < dayList.length; d++) {
            if (week[startDate.getDay()] === dayList[d]) {
              for (let t = 0; t < pill.time.length; t++) {
                let newSchedule = await scheduleDB.addSchedule(client, newPill[0].id, user.id, pill.start, pill.end, pill.cycle, startDate, pill.specific, pill.day, pill.time[t]);
              }
              break;
            }
          }
          startDate.setDate(startDate.getDate() + 1);
        }
      }

      if (pill.cycle === '3') {
        let specificNumber = pill.specific.substr(0, 1);
        let specificCycle = pill.specific.substr(1);

        if (specificCycle === 'day') {
          while (startDate <= endDate) {
            for (let t = 0; t < pill.time.length; t++) {
              let newSchedule = await scheduleDB.addSchedule(client, newPill[0].id, user.id, pill.start, pill.end, pill.cycle, startDate, pill.specific, pill.day, pill.time[t]);
            }
            startDate.setDate(startDate.getDate() + Number(specificNumber));
          }
        }

        if (specificCycle === 'week') {
          while (startDate <= endDate) {
            for (let t = 0; t < pill.time.length; t++) {
              let newSchedule = await scheduleDB.addSchedule(client, newPill[0].id, user.id, pill.start, pill.end, pill.cycle, startDate, pill.specific, pill.day, pill.time[t]);
            }
            startDate.setDate(startDate.getDate() + Number(specificNumber) * 7);
          }
        }

        if (specificCycle === 'month') {
          while (startDate <= endDate) {
            for (let t = 0; t < pill.time.length; t++) {
              let newSchedule = await scheduleDB.addSchedule(client, newPill[0].id, user.id, pill.start, pill.end, pill.cycle, startDate, pill.specific, pill.day, pill.time[t]);
            }
            startDate.setMonth(startDate.getMonth() + Number(specificNumber));
          }
        }
      }
    }

    // 성공
    res.status(statusCode.OK).send(util.success(statusCode.OK, responseMessage.PILL_ADDITION_SUCCESS));
  } catch (error) {
    functions.logger.error(`[ERROR] [${req.method.toUpperCase()}] ${req.originalUrl}`, `[CONTENT] ${error}`);
    console.log(error);

    res.status(statusCode.INTERNAL_SERVER_ERROR).send(util.fail(statusCode.INTERNAL_SERVER_ERROR, responseMessage.INTERNAL_SERVER_ERROR));
  } finally {
    client.release();
  }
};
