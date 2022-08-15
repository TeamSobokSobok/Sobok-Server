const db = require('../db/db');
const { pillDB, scheduleDB, noticeDB, sendPillDB, groupDB, userDB } = require('../db');
const admin = require('firebase-admin');
const util = require('../lib/util');
const statusCode = require('../constants/statusCode');
const responseMessage = require('../constants/responseMessage');
const { termCalcurator, dateCalcurator } = require('../lib/dateCalcurater');
const returnType = require('../constants/returnType');
const dayjs = require('dayjs');

module.exports = {
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
  addPill: async (pillName, userId, takeInterval, day, specific, time, start, end) => {
    let client;
    const log = `pillDao.addPill | pillName = ${pillName}, userId = ${userId}, takeInterval = ${takeInterval}, day = ${day}, specific = ${specific}, time = ${time}, start = ${start}, end = ${end}`;

    try {
      client = await db.connect(log);
      await client.query('BEGIN');

      // 현재 유저의 약 개수 반환
      const pills = await pillDB.getPillCount(client, userId);
      const pillCount = Number(pills.pillCount) + pillName.length;
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
  },

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
        admin.messaging().send(message);
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
        admin
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
   * pillScheduleModify
   * 현재 복용중인 약 스케줄 변경 서비스
   * @param userId 해당 약 유저 아이디
   * @param pillId 정보를 변경할 약 아이디
   * @param date 변경을 원하는 날짜
   * @param time 변경을 원하는 시간
   * @param pillName 약 변경을 원하는 이름
   * @param start 약 복용 시작 날짜
   * @param end 약 복용 중단 날짜
   * @param cycle 약 복용 주기
   * @param day 요일
   * @param specific 특정 주기
   */
  pillInfoModify: async (
    userId,
    pillId,
    pillName,
    start,
    end,
    cycle,
    day,
    specific,
    time,
    date,
  ) => {
    let client;
    const log = `pillDB.pillShceduleModify | userId = ${userId}, pillId = ${pillId}, pillName = ${pillName}, start = ${start}, end = ${end}, cycle = ${cycle}, day = ${day}, specific = ${specific}, time = ${time}, date = ${date}`;

    try {
      client = await db.connect(log);
      await client.query('BEGIN');

      const user = await userDB.findUserById(client, userId);
      if (!user) return returnType.NON_EXISTENT_USER;

      const pill = await pillDB.getPillById(client, pillId);
      if (pill.length === 0) return returnType.NON_EXISTENT_PILL;

      if (pill[0].userId !== userId) return returnType.NO_PILL_USER;

      const pillSchedule = await scheduleDB.findScheduleByPillId(client, pillId);
      const scheduleStart = dayjs(pillSchedule[0].startDate);
      const scheduleEnd = dayjs(pillSchedule[0].endDate);

      // 총 날짜 수 계산
      const term = termCalcurator(start, end);

      // 약이 추가될 날짜
      const dateList = dateCalcurator(term, start, cycle, day, specific);
      if (
        scheduleStart.format('YYYY-MM-DD') !== start ||
        scheduleEnd.format('YYYY-MM-DD') !== end ||
        pillSchedule[0].takeInterval !== cycle ||
        pillSchedule[0].scheduleDay !== day ||
        pillSchedule[0].scheduleSpecific !== specific
      ) {
        await pillDB.deletePill(client, pillId);
        const newPill = await pillDB.addPill(client, pillName, userId, pill[0].color);

        // 스케줄 추가 서비스
        for (let date = 0; date < dateList.length; date++) {
          for (let timeList = 0; timeList < time.length; timeList++) {
            let newSchedule = await scheduleDB.addSchedule(
              client,
              newPill.id,
              userId,
              cycle,
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

      if (pill[0].pillName !== pillName)
        await pillDB.updatePillNameByPillId(client, pillId, pillName);

      // 총 날짜 수 계산
      const timeTerm = termCalcurator(date, end);

      // 약이 추가될 날짜
      const timeDateList = dateCalcurator(timeTerm, date, cycle, day, specific);

      const scheduleTime = await scheduleDB.findScheduleTimeByPillId(client, pillId);

      if (scheduleTime[0] !== time) {
        await scheduleDB.deleteScheduleByDate(client, pillId, date);
        for (let date = 0; date < timeDateList.length; date++) {
          for (let timeList = 0; timeList < time.length; timeList++) {
            let newSchedule = await scheduleDB.addSchedule(
              client,
              Number(pillId),
              userId,
              cycle,
              timeDateList[date],
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
      return util.success(statusCode.OK, responseMessage.PILL_MODIFY_SUCCESS);
    } catch (error) {
      console.log('pillScheduleModify error 발생: ' + error);
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

  stopPill: async (userId, pillId, date) => {
    let client;
    const log = `pillDB.deletePillByPillId | userId = ${userId}, pillId = ${pillId}, date = ${date}`;

    try {
      client = await db.connect(log);
      await client.query('BEGIN');

      const user = await userDB.findUserById(client, userId);
      if (!user) return returnType.NON_EXISTENT_USER;

      const pill = await pillDB.getPillById(client, pillId);
      if (!pill) return returnType.NON_EXISTENT_PILL;

      if (pill[0].userId !== userId) return returnType.NO_PILL_USER;

      await pillDB.stopPillByPillId(client, pillId);
      await scheduleDB.deleteScheduleByDate(client, pillId, date);

      await client.query('COMMIT');

      return util.success(statusCode.OK, responseMessage.PILL_STOP_SUCCESS);
    } catch (error) {
      console.error('stopPill error 발생: ' + error);
      await client.query('ROLLBACK');
    } finally {
      client.release();
    }
  },

  deletePill: async (userId, pillId) => {
    let client;
    const log = `pillDB.deletePillByPillId | userId = ${userId}, pillId = ${pillId}`;

    try {
      client = await db.connect(log);
      await client.query('BEGIN');

      const user = await userDB.findUserById(client, userId);
      if (!user) return returnType.NON_EXISTENT_USER;

      const pill = await pillDB.getPillById(client, pillId);
      if (pill[0].userId !== userId) return returnType.NO_PILL_USER;

      await pillDB.deletePill(client, pillId);
      await client.query('COMMIT');

      return util.success(statusCode.OK, responseMessage.PILL_DELETE_SUCCESS);
    } catch (error) {
      console.error('deletePill error 발생: ' + error);
      await client.query('ROLLBACK');
    } finally {
      client.release();
    }
  },
};
