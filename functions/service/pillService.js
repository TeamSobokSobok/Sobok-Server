const db = require('../db/db');
const { pillDao, scheduleDao } = require('../db');

const util = require('../lib/util');
const statusCode = require('../constants/statusCode');
const responseMessage = require('../constants/responseMessage');
const { termCalcurator, dateCalcurator } = require('../lib/dateCalcurater');
const returnType = require('../constants/returnType');

/**
 * addPill
 * 약 추가 및 스케줄 생성 서비스
 * @param pillName - 추가할 약의 이름
 * @param pillId 해당 약 아이디
 * @param userId 해당 약을 추가하는 유저 아이디
 * @param takeInterval 복용 간격 선택 ex) 매일, 특정 요일, 특정 간격
 * @param day 특정 요일 ex) 월, 수, 금
 * @param specific 특정 간격 ex) 1week
 * @param time 시간 리스트
 * @param start 복용 시작 날짜
 * @param end 복용 종료 날짜
 */
const addPill = async (pillName, userId, takeInterval, day, specific, time, start, end) => {
  let client;
  const log = `pillDao.addPill | pillName = ${pillName}, userId = ${userId}, takeInterval = ${takeInterval}, day = ${day}, specific = ${specific}, time = ${time}, start = ${start}, end = ${end}`;

  try {
    client = await db.connect(log);
    await client.query('BEGIN');

    // 현재 유저의 약 개수 반환
    const pills = await pillDao.getPillCount(client, userId);
    const pillCount = Number(pills.count) + pillName.length;
    if (pillCount > 5) return returnType.PILL_COUNT_OVER;

    // 약 추가 쿼리 실행
    let newPill = [];
    for (let nameLoop = 0; nameLoop < pillName.length; nameLoop++) {
      // 랜덤 컬러 생성
      const color = Math.floor(Math.random() * 5 + 1);

      newPill.push(await pillDao.addPill(client, pillName[nameLoop], userId, color));
    }
    if (!newPill) return returnType.DB_NOT_FOUND;

    // 총 날짜 수 계산
    const term = termCalcurator(start, end);

    // 약이 추가될 날짜
    const dateList = dateCalcurator(term, start, takeInterval, day, specific);

    // 스케줄 추가 서비스
    for (let pillCount = 0; pillCount < newPill.length; pillCount++) {
      for (let date = 0; date < dateList.length; date++) {
        for (let timeList = 0; timeList < time.length; timeList++) {
          let newSchedule = await scheduleDao.addSchedule(
            client,
            newPill[pillCount].id,
            userId,
            takeInterval,
            dateList[date],
            day,
            specific,
            time[timeList],
            start,
            end,
          );
          if (!newSchedule) return returnType.DB_NOT_FOUND;
        }
      }
    }

    await client.query('COMMIT');

    return util.success(statusCode.CREATED, responseMessage.PILL_ADDITION_SUCCESS, newPill);
  } catch (error) {
    console.error('addPill error 발생: ' + error);
    await client.query('ROLLBACK');
  } finally {
    client.release();
  }
};

module.exports = {
  addPill,
};
