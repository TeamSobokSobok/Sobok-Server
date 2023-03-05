const dayjs = require('dayjs');
const functions = require('firebase-functions');
const admin = require('firebase-admin');
const responseMessage = require('../constants/responseMessage');
const returnType = require('../constants/returnType');
const statusCode = require('../constants/statusCode');
const { scheduleDB, groupDB, stickerDB, userDB, pillDB } = require('../db');
const db = require('../db/db');
const util = require('../lib/util');

/**
 * 내 캘린더 전체 조회
 * @param userId - 해당 유저 아이디
 * @param date - 현재 날짜
 */
const getMyCalendar = async (userId, date) => {
  let client;
  const log = `scheduleDB.getMyCalendar | date = ${date}`;

  try {
    client = await db.connect(log);

    const user = await userDB.findUserById(client, userId);

    if (user.length === 0 || user[0].isDeleted === true) {
      return returnType.NON_EXISTENT_USER;
    }

    // 조회할 달의 시작 날짜
    const startDate = dayjs(date).startOf('month').format('YYYY-MM-DD');

    // 조회할 달의 마지막 날짜
    const endDate = dayjs(date).endOf('month').format('YYYY-MM-DD');

    const myCalender = await scheduleDB.getMyCalendar(client, userId, startDate, endDate);
    myCalender.forEach((data) => {
      if (data.scheduleCount === data.isCheckCount) {
        data.isComplete = 'done';
      } else if (data.scheduleCount > data.isCheckCount && Number(data.isCheckCount) > 0) {
        data.isComplete = 'doing';
      } else if (Number(data.isCheckCount) === 0) {
        data.isComplete = 'none';
      }
    });

    return util.success(statusCode.OK, responseMessage.READ_MY_CALENDAR, myCalender);
  } catch (error) {
    console.error('getMyCalendar error 발생: ' + error);
  } finally {
    client.release();
  }
};

/**
 * 해당 일정 복약 스케줄 조회
 * @param userId - 유저 아이디
 * @param date - 조회를 원하는 날짜
 */
const getMySchedule = async (userId, date) => {
  let client;
  const log = `scheduleDB.getMySchedule | userId = ${userId}, date = ${date}`;

  try {
    client = await db.connect(log);

    const user = await userDB.findUserById(client, userId);

    if (user.length === 0 || user[0].isDeleted === true) {
      return returnType.NON_EXISTENT_USER;
    }

    const myScheduleTime = await scheduleDB.getMyScheduleTime(client, userId, date);
    for (let data = 0; data < myScheduleTime.length; data++) {
      let schedule = await scheduleDB.getMySchedule(
        client,
        userId,
        date,
        myScheduleTime[data].scheduleTime,
      );

      for (let scheduleInfo = 0; scheduleInfo < schedule.length; scheduleInfo++) {
        let stickerId = [];
        let stickerList = await stickerDB.findStickerListById(
          client,
          userId,
          schedule[scheduleInfo].scheduleId,
        );

        for (let sticker = 0; sticker < stickerList.length; sticker++) {
          const stickerInfo = {
            likeScheduleId: stickerList[sticker].id,
            stickerId: stickerList[sticker].stickerId,
          };
          stickerId.push(stickerInfo);
        }
        schedule[scheduleInfo].stickerId = stickerId;
        schedule[scheduleInfo].stickerTotalCount = stickerList.length;
      }
      myScheduleTime[data].scheduleList = schedule;
    }

    return util.success(statusCode.OK, responseMessage.READ_MY_SCHEDULE, myScheduleTime);
  } catch (error) {
    console.log('getMySchedule error 발생: ' + error);
  } finally {
    client.release();
  }
};

module.exports = {
  getMyCalendar,
  getMySchedule,
  getMemberCalendar: async (user, memberId, date) => {
    let client;
    const req = `user = ${user}, memberId = ${memberId}, date = ${date}`;

    try {
      client = await db.connect(req);

      // 조회할 날짜를 한 달로 변경
      const startDate = dayjs(date).startOf('month').format('YYYY-MM-DD');
      const endDate = dayjs(date).endOf('month').format('YYYY-MM-DD');

      // 캘린더 공유를 수락했는지 확인
      const findSendGroup = await groupDB.findSendGroupIsOkay(client, memberId, user.id);
      if (!findSendGroup) {
        return returnType.WRONG_REQUEST_VALUE;
      }

      const memberCalender = await scheduleDB.findCalendarByMemberId(
        client,
        memberId,
        startDate,
        endDate,
      );

      // 약 스케줄 개수와 체크 완료된 스케줄 개수 비교
      for (let i = 0; i < memberCalender.length; i++) {
        const scheduleCount = memberCalender[i].scheduleCount;
        const isCheckCount = memberCalender[i].isCheckCount;

        if (scheduleCount === isCheckCount) {
          memberCalender[i].isComplete = 'done';
        } else if (isCheckCount === '0') {
          memberCalender[i].isComplete = 'none';
        } else memberCalender[i].isComplete = 'doing';
      }

      return memberCalender;
    } catch (error) {
      console.log('getMemberCalendar service error 발생:' + error);
    } finally {
      client.release();
    }
  },
  getMemeberSchedule: async (user, memberId, date) => {
    let client;
    const req = `user = ${user}, memberId = ${memberId}, date = ${date}`;

    try {
      client = await db.connect(req);

      date = dayjs(date).format('YYYY-MM-DD');

      // 캘린더 공유를 수락했는지 확인(memberId: 공유 요청받은 사용자)
      const findSendGroup = await groupDB.findSendGroupIsOkay(client, memberId, user.id);
      if (!findSendGroup) {
        return returnType.WRONG_REQUEST_VALUE;
      }

      // 해당 멤버의 스케줄 날짜에 대한 시간 정보 불러오기
      let findmemberScheduleTime = await scheduleDB.findScheduleTime(client, memberId, date);

      // 사용자가 보낸 스티커 리스트 조회
      const findUserLikeScheduleList = await scheduleDB.findUserLikeScheduleList(client, user.id);
      const userLikeScheduleList = findUserLikeScheduleList.map(
        (userLikeSchedule) => userLikeSchedule.scheduleId,
      );

      for (let i = 0; i < findmemberScheduleTime.length; i++) {
        // 시간에 대한 스케줄 리스트 불러오기
        let scheduleList = await scheduleDB.findScheduleByMemberId(
          client,
          memberId,
          date,
          findmemberScheduleTime[i].scheduleTime,
        );
        findmemberScheduleTime[i].scheduleList = scheduleList;

        for (let v = 0; v < scheduleList.length; v++) {
          let scheduleId = scheduleList[v].scheduleId;

          // 스케줄id로 스티커 4개 불러오기
          // 내가 보낸 스티커를 맨 앞으로 정렬해서 불러오기
          let stickerList = await scheduleDB.findLikeScheduleByScheduleId(
            client,
            scheduleId,
            user.id,
          );
          scheduleList[v].stickerList = stickerList;

          // 약 스케줄에 대한 전체 스티커 리스트 조회
          let stickerTotalCount = await scheduleDB.findAllLikeScheduleByScheduleId(
            client,
            scheduleId,
          );
          scheduleList[v].stickerTotalCount = stickerTotalCount.length;

          // 스티커를 보낸 스케줄인지 조회
          const isLikedSchedule = await scheduleDB.isLikedSchedule(
            client,
            scheduleList[v].scheduleId,
            userLikeScheduleList,
          );
          scheduleList[v].isLikedSchedule = isLikedSchedule;
        }
      }

      return findmemberScheduleTime;
    } catch (error) {
      console.log('getMemberSchedule service error 발생:' + error);
    } finally {
      client.release();
    }
  },
  checkSchedule: async (user, scheduleId) => {
    let client;
    const req = `user = ${user}, scheduleId = ${scheduleId}`;

    try {
      client = await db.connect(req);

      const findSchedule = await scheduleDB.findScheduleByScheduleId(client, scheduleId);

      // 스케줄이 존재하는지 확인
      if (!findSchedule) {
        return returnType.DB_NOT_FOUND;
      }

      const findScheduleUser = findSchedule.userId;

      // 스케줄 유저인지 확인
      if (findScheduleUser !== user.id) {
        return returnType.WRONG_REQUEST_VALUE;
      }

      const isCheckedSchedule = await scheduleDB.updateScheduleIsCheck(client, scheduleId, true);

      return isCheckedSchedule;
    } catch (error) {
      console.log('checkSchedule service error 발생:' + error);
    } finally {
      client.release();
    }
  },
  unCheckSchedule: async (user, scheduleId) => {
    let client;
    const req = `user = ${user}, scheduleId = ${scheduleId}`;

    try {
      client = await db.connect(req);

      const findSchedule = await scheduleDB.findScheduleByScheduleId(client, scheduleId);

      // 스케줄이 존재하는지 확인
      if (!findSchedule) {
        return returnType.DB_NOT_FOUND;
      }

      const findScheduleUser = findSchedule.userId;

      // 스케줄 유저인지 확인
      if (findScheduleUser !== user.id) {
        return returnType.WRONG_REQUEST_VALUE;
      }

      const isCheckedSchedule = await scheduleDB.updateScheduleIsCheck(client, scheduleId, false);

      return isCheckedSchedule;
    } catch (error) {
      console.log('unCheckSchedule service error 발생:' + error);
    } finally {
      client.release();
    }
  },
  sendScheduleNotification: async (schedule) => {
    let userAndScheduleClient;
    let pillClient;
    const req = (domain, pk) => `${domain}Id = ${pk}`;

    try {
      [userAndScheduleClient, pillClient] = await Promise.all([
        db.connect(req('user&schedule', schedule.userId)),
        db.connect(req('pill', schedule.pillId)),
      ]);

      const [user, pill] = await Promise.all([
        userDB.findUserById(userAndScheduleClient, schedule.userId),
        pillDB.getPillById(pillClient, schedule.pillId),
      ]);

      if (!user[0] || !pill[0]) {
        throw new Error('user or pill must be defined in schedule');
      }

      const username = user[0].username;

      dayjs.locale('ko');
      const time = dayjs(schedule.schedule_date_time).add(9, 'hour').format('A HH:mm');

      let body = `소중한 ${username}님 약 드실 시간이에요\n다 드시면 앱에서 체크 버튼을 눌러주세요`;

      const deviceToken = user[0].deviceToken;

      if (!deviceToken) {
        throw new Error('user device token not defined');
      }

      const message = {
        notification: {
          title: `[${pill[0].pillName}] ${time}`,
          body: body,
        },
        token: deviceToken,
      };

      const result = await admin.messaging().send(message);
      await scheduleDB.updateScheduleSentAt(userAndScheduleClient, schedule.id);

      return result;
    } catch (error) {
      functions.logger.warn('sendScheduleNotification service 에러 발생' + error);

      return null;
    } finally {
      userAndScheduleClient.release();
      pillClient.release();
    }
  },
};
