const db = require('../db/db');
const { pillDB, scheduleDB, noticeDB, sendPillDB, groupDB, userDB } = require('../db');
const admin = require('firebase-admin');
const util = require('../lib/util');
const statusCode = require('../constants/statusCode');
const responseMessage = require('../constants/responseMessage');
const { termCalcurator, dateCalcurator } = require('../lib/dateCalcurater');
const returnType = require('../constants/returnType');
const dayjs = require('dayjs');

/**
 * addPill
 * 약 추가 및 스케줄 생성 서비스
 * @param pillName - 추가할 약의 이름
 * @param userId 해당 약을 추가하는 유저 아이디
 * @param day 특정 요일 ex) 월, 수, 금
 * @param timeList 시간 리스트
 * @param start 복용 시작 날짜
 * @param end 복용 종료 날짜
 */

const addPill = async (pillName, userId, day, timeList, start, end) => {
  let client;
  const log = `pillDao.addPill | pillName = ${pillName}, userId = ${userId}, day = ${day}, timeList = ${timeList}, start = ${start}, end = ${end}`;

  try {
    client = await db.connect(log);
    await client.query('BEGIN');

    // 약 개수가 초과되지 않는지 확인
    const pills = await pillDB.getPillCount(client, userId);
    const pillCount = Number(pills.pillCount) + pillName.length;
    if (pillCount > 5) return returnType.PILL_COUNT_OVER;

    // 유저 검증
    const user = await userDB.findUserById(client, userId);
    if (!user) return returnType.NON_EXISTENT_USER;

    // 약 추가 쿼리 실행
    let newPill = [];
    for (let nameLoop = 0; nameLoop < pillName.length; nameLoop++) {
      // 랜덤 컬러 생성
      const color = Math.floor(Math.random() * 5 + 1);

      // 약 추가
      newPill.push(await pillDB.addPill(client, pillName[nameLoop], userId, color));
    }

    // 약이 추가될 날짜
    const dateList = dateCalcurator(start, end, day);

    // 스케줄 추가 서비스
    for (let pillCount = 0; pillCount < newPill.length; pillCount++) {
      await scheduleDB.addSchedule(
        client,
        newPill[pillCount].id,
        userId,
        start,
        end,
        dateList,
        day,
        timeList,
      );
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
 * pillInformationModify
 * 현재 복용중인 약 스케줄 변경 서비스
 * @param userId 해당 약 유저 아이디
 * @param pillId 정보를 변경할 약 아이디
 * @param pillName 약 변경을 원하는 이름
 * @param start 약 복용 시작 날짜
 * @param end 약 복용 중단 날짜
 * @param day 요일
 * @param timeList 변경을 원하는 시간목록
 */

const pillInformationModify = async (
  userId,
  pillId,
  pillName,
  startDate,
  endDate,
  day,
  timeList,
) => {
  let client;
  const log = `pillDB.pillShceduleModify | userId = ${userId}, pillId = ${pillId}, pillName = ${pillName}, startDate = ${startDate}, endDate = ${endDate}, day = ${day}, timeList = ${timeList}`;

  try {
    client = await db.connect(log);
    await client.query('BEGIN');

    const user = await userDB.findUserById(client, userId);
    if (user.length === 0) return returnType.NON_EXISTENT_USER;

    const pill = await pillDB.getPillById(client, pillId);
    if (pill.length === 0) return returnType.NON_EXISTENT_PILL;

    if (pill[0].userId !== userId) return returnType.NO_PILL_USER;

    // 현재 날짜
    let nowDate = new Date();
    nowDate = dayjs(nowDate).format('YYYY-MM-DD');

    // 현재 날짜부터 약 스케줄 삭제
    await scheduleDB.deleteScheduleByDate(client, pillId, nowDate);

    // 약이 추가될 날짜
    const dateList = dateCalcurator(nowDate, endDate, day);

    // 약 이름 변경
    await pillDB.updatePillNameByPillId(client, pillId, pillName);

    console.log(startDate);
    console.log(endDate);
    // 약 스케줄 추가
    await scheduleDB.addSchedule(
      client,
      pillId,
      userId,
      startDate,
      endDate,
      dateList,
      day,
      timeList,
    );

    await client.query('COMMIT');
    return util.success(statusCode.OK, responseMessage.PILL_MODIFY_SUCCESS);
  } catch (error) {
    console.log('pillScheduleModify error 발생: ' + error);
    await client.query('ROLLBACK');
  } finally {
    client.release();
  }
};

/**
 * stopPill
 * 약 중단 서비스
 * @param userId 해당 약을 중단하는 유저 아이디
 * @param pillId 중단할 약 아이디
 */

const stopPill = async (userId, pillId) => {
  let client;
  const log = `pillDB.deletePillByPillId | userId = ${userId}, pillId = ${pillId}`;

  try {
    client = await db.connect(log);
    await client.query('BEGIN');

    const user = await userDB.findUserById(client, userId);
    if (!user) return returnType.NON_EXISTENT_USER;

    const pill = await pillDB.getPillById(client, pillId);

    if (pill.length === 0) return returnType.NON_EXISTENT_PILL;

    if (pill[0].userId !== userId) return returnType.NO_PILL_USER;

    if (pill[0].isStop === true) return returnType.ALREADY_STOP_PILL;

    await pillDB.stopPillByPillId(client, pillId);

    // 현재 날짜
    let nowDate = new Date();
    nowDate = dayjs(nowDate).format('YYYY-MM-DD');
    await scheduleDB.deleteScheduleByDate(client, pillId, nowDate);

    await client.query('COMMIT');

    return util.success(statusCode.OK, responseMessage.PILL_STOP_SUCCESS);
  } catch (error) {
    console.error('stopPill error 발생: ' + error);
    await client.query('ROLLBACK');
  } finally {
    client.release();
  }
};

/**
 * deletePill
 * 약 삭제 서비스
 * @param userId 해당 약을 삭제하는 유저 아이디
 * @param pillId 삭제할 약 아이디
 */

const deletePill = async (userId, pillId) => {
  let client;
  const log = `pillDB.deletePillByPillId | userId = ${userId}, pillId = ${pillId}`;

  try {
    client = await db.connect(log);
    await client.query('BEGIN');

    const user = await userDB.findUserById(client, userId);
    if (!user) return returnType.NON_EXISTENT_USER;

    const pill = await pillDB.getPillById(client, pillId);
    console.log(pill);
    if (pill.length === 0 || pill[0].userId !== userId) return returnType.NO_PILL_USER;

    await pillDB.deletePill(client, pillId);
    await client.query('COMMIT');

    return util.success(statusCode.OK, responseMessage.PILL_DELETE_SUCCESS);
  } catch (error) {
    console.error('deletePill error 발생: ' + error);
    await client.query('ROLLBACK');
  } finally {
    client.release();
  }
};

module.exports = {
  addPill,
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
  addMemberPill: async (
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

      // 양 방향성 캘린더 공유인지 확인
      const groupCheck = await groupDB.findSendGroupIsOkay(client, userId, memberId);
      const username = await userDB.findUserById(client, userId);
      if (groupCheck) {
        let body = `${groupCheck.memberName}님께서 약을 보냈습니다.`;

        const deviceToken = await userDB.findDeviceTokenById(client, memberId);
        const message = {
          notification: {
            title: '소복소복 알림',
            body: body,
          },
          token: deviceToken.deviceToken,
        };
        await admin.messaging().send(message);
      } else {
        let body = `${username[0].username}님께서 약을 보냈습니다.`;

        const deviceToken = await userDB.findDeviceTokenById(client, memberId);
        const message = {
          notification: {
            title: '소복소복 알림',
            body: body,
          },
          token: deviceToken.deviceToken,
        };
        await admin
          .messaging()
          .send(message)
          .catch(function (error) {
            console.log('push notification: ' + error);
            return returnType.PUSH_ERROR;
          });
      }

      return util.success(statusCode.CREATED, responseMessage.PILL_ADDITION_SUCCESS, newPill);
    } catch (error) {
      console.error('addPill error 발생: ' + error);
      await client.query('ROLLBACK');
    } finally {
      client.release();
    }
  },

  /**
   * getPillCount
   * 현재 복용중인 약 개수 반환
   * @param memberId 약 개수를 조회할 유저 아이디
   */
  getPillCount: async (memberId) => {
    let client;
    const log = `pillDao.getPillCount | memberId = ${memberId}`;

    try {
      client = await db.connect(log);

      const user = await userDB.findUserById(client, memberId);
      if (!user) return returnType.NON_EXISTENT_USER;

      const count = await pillDB.getPillCount(client, memberId);

      return util.success(statusCode.OK, responseMessage.PILL_COUNT_SUCCESS, {
        pillCount: Number(count.pillCount),
      });
    } catch (error) {
      console.error('getPillCount error 발생: ' + error);
    } finally {
      client.release();
    }
  },
  pillInformationModify,
  stopPill,
  deletePill,
};
