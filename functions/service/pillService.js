const db = require('../db/db');
const { pillDB, scheduleDB, noticeDB, sendPillDB, groupDB, userDB } = require('../db');

const util = require('../lib/util');
const statusCode = require('../constants/statusCode');
const responseMessage = require('../constants/responseMessage');
const { termCalcurator, dateCalcurator } = require('../lib/dateCalcurater');
const returnType = require('../constants/returnType');

/**
 * addPill
 * 약 추가 및 스케줄 생성 서비스
 * @param pillName - 추가할 약의 이름
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
    const pills = await pillDB.getPillCount(client, userId);
    const pillCount = Number(pills.count) + pillName.length;
    if (pillCount > 5) return returnType.PILL_COUNT_OVER;

    // 약 추가 쿼리 실행
    let newPill = [];
    for (let nameLoop = 0; nameLoop < pillName.length; nameLoop++) {
      // 랜덤 컬러 생성
      const color = Math.floor(Math.random() * 5 + 1);

      newPill.push(await pillDB.addPill(client, pillName[nameLoop], userId, color));
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
          let newSchedule = await scheduleDB.addSchedule(
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

/**
 * addMemberPill
 * 약 추가 및 스케줄 생성 서비스
 * @param pillName - 추가할 약의 이름
 * @param userId - 사용자 아이디
 * @param memberId - 약 전송을 받을 사용자 아이디
 * @param takeInterval 복용 간격 선택 ex) 매일, 특정 요일, 특정 간격
 * @param day 특정 요일 ex) 월, 수, 금
 * @param specific 특정 간격 ex) 1week
 * @param time 시간 리스트
 * @param start 복용 시작 날짜
 * @param end 복용 종료 날짜
 */
const addMemberPill = async (
  pillName,
  userId,
  memberId,
  takeInterval,
  day,
  specific,
  time,
  start,
  end,
) => {
  let client;
  const log = `pillDao.addPill | pillName = ${pillName}, userId = ${userId}, memberId = ${memberId}, takeInterval = ${takeInterval}, day = ${day}, specific = ${specific}, time = ${time}, start = ${start}, end = ${end}`;

  try {
    client = await db.connect(log);
    await client.query('BEGIN');

    // 캘린더 공유 상황 확인
    const checkUser = await groupDB.findSendGroupIsOkay(client, memberId, userId);
    console.log(checkUser);
    if (!checkUser || checkUser.isOkay !== 'accept') return returnType.NO_MEMBER;

    // 현재 유저의 약 개수 반환
    const pills = await pillDB.getPillCount(client, memberId);
    const pillCount = Number(pills.count) + pillName.length;
    if (pillCount > 5) return returnType.PILL_COUNT_OVER;

    // 약 전송 알림 추가
    const newNotice = await noticeDB.addNotice(client, memberId, userId, 'pill');

    // 약 추가 쿼리 실행
    let newPill = [];
    for (let nameLoop = 0; nameLoop < pillName.length; nameLoop++) {
      // 랜덤 컬러 생성
      const color = Math.floor(Math.random() * 5 + 1);

      newPill.push(await pillDB.addPill(client, pillName[nameLoop], null, color));
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
          let newSchedule = await scheduleDB.addSchedule(
            client,
            newPill[pillCount].id,
            null,
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

      await sendPillDB.addSendPill(client, newPill[pillCount].id, newNotice.id);
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

/**
 * getPillCount
 * 현재 복용중인 약 개수 반환
 * @param memberId 약 개수를 조회할 유저 아이디
 */
const getPillCount = async (memberId) => {
  let client;
  const log = `pillDao.getPillCount | memberId = ${memberId}`;

  try {
    client = await db.connect(log);

    const user = await userDB.findUserById(client, memberId);
    if (!user) return returnType.NON_EXISTENT_USER;

    const pillCount = await pillDB.getPillCount(client, memberId);

    return util.success(statusCode.OK, responseMessage.PILL_COUNT_SUCCESS, pillCount);
  } catch (error) {
    console.error('getPillCount error 발생: ' + error);
  } finally {
    client.release();
  }
};

module.exports = {
  addPill,
  addMemberPill,
  getPillCount,
};
