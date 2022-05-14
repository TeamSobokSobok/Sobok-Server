const db = require('../db/db');
const { scheduleDB, groupDB, stickerDB } = require('../db');

module.exports = {
  getMyCalendar: async (user, date) => {
    let client;

    try {
      client = await db.connect(req);

      // Request로 받은 날짜를 한달 기준으로 startDate, endDate 선언
      const startDate = dayjs(date).startOf('month').format('YYYY-MM-DD');
      const endDate = dayjs(date).endOf('month').format('YYYY-MM-DD');

      // 해당 유저의 아이디로 schedule 정보 조회
      const myCalender = await scheduleDB.findCalendarByMemberId(client, user.id, startDate, endDate);

      // 약 스케줄 개수와 체크 완료된 스케줄 개수 비교
      for (let i = 0; i < myCalender.length; i++) {
        const scheduleCount = myCalender[i].scheduleCount;
        const isCheckCount = myCalender[i].isCheckCount;

        if (scheduleCount === isCheckCount) {
          myCalender[i].isComplete = 'done';
        } else if (isCheckCount === '0') {
          myCalender[i].isComplete = 'none';
        } else myCalender[i].isComplete = 'doing';
      }

      return myCalender;
    } catch (error) {
      functions.logger.error(`[ERROR] [${req.method.toUpperCase()}] ${req.originalUrl}`, `[CONTENT] ${error}`);
      console.log(error);

      const slackMessage = `[ERROR] [${req.method.toUpperCase()}] ${req.originalUrl} ${req.header.user ? `uid:${req.header.user.id}` : 'req.user 없음'} ${JSON.stringify(error)}`;
      slackAPI.sendMessageToSlack(slackMessage, slackAPI.DEV_WEB_HOOK_ERROR_MONITORING);
    } finally {
      client.release();
    }
  },
  getMySchedule: async (user, date) => {
    let client;

    try {
      client = await db.connect(req);

      date = dayjs(date).format('YYYY-MM-DD');

      // 해당 멤버의 스케줄 날짜에 대한 시간 정보 불러오기
      let findmemberScheduleTime = await scheduleDB.findScheduleTime(client, user.id, date);

      for (let i = 0; i < findmemberScheduleTime.length; i++) {
        // 시간에 대한 스케줄 리스트 불러오기
        let scheduleList = await scheduleDB.findScheduleByMemberId(client, user.id, date, findmemberScheduleTime[i].scheduleTime);
        findmemberScheduleTime[i].scheduleList = scheduleList;

        for (let v = 0; v < scheduleList.length; v++) {
          // 스케줄id로 스티커 4개 불러오기
          let scheduleId = scheduleList[v].scheduleId;
          let stickerList = await scheduleDB.findMyLikeScheduleByScheduleId(client, scheduleId);
          scheduleList[v].stickerId = stickerList;

          // 약 스케줄에 대한 전체 스티커 리스트 조회
          let stickerTotalCount = await scheduleDB.findAllLikeScheduleByScheduleId(client, scheduleId);
          scheduleList[v].stickerTotalCount = stickerTotalCount.length;
        }
      }

      return findmemberScheduleTime;
    } catch (error) {
      functions.logger.error(`[ERROR] [${req.method.toUpperCase()}] ${req.originalUrl}`, `[CONTENT] ${error}`);
      console.log(error);

      const slackMessage = `[ERROR] [${req.method.toUpperCase()}] ${req.originalUrl} ${req.header.user ? `uid:${req.header.user.id}` : 'req.user 없음'} ${JSON.stringify(error)}`;
      slackAPI.sendMessageToSlack(slackMessage, slackAPI.DEV_WEB_HOOK_ERROR_MONITORING);
    } finally {
      client.release();
    }
  },
  getMemberCalendar: async (user, memberId, date) => {
    let client;

    try {
      client = await db.connect(req);

      // 조회할 날짜를 한 달로 변경
      const startDate = dayjs(date).startOf('month').format('YYYY-MM-DD');
      const endDate = dayjs(date).endOf('month').format('YYYY-MM-DD');

      // 캘린더 공유를 수락했는지 확인
      const findSendGroup = await groupDB.findSendGroupIsOkay(client, user.id, memberId);
      if (findSendGroup.length === 0) return res.status(statusCode.UNAUTHORIZED).send(util.fail(statusCode.UNAUTHORIZED, responseMessage.NO_AUTHENTICATED));

      const memberCalender = await scheduleDB.findCalendarByMemberId(client, memberId, startDate, endDate);

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
      functions.logger.error(`[ERROR] [${req.method.toUpperCase()}] ${req.originalUrl}`, `[CONTENT] ${error}`);
      console.log(error);

      const slackMessage = `[ERROR] [${req.method.toUpperCase()}] ${req.originalUrl} ${req.header.user ? `uid:${req.header.user.id}` : 'req.user 없음'} ${JSON.stringify(error)}`;
      slackAPI.sendMessageToSlack(slackMessage, slackAPI.DEV_WEB_HOOK_ERROR_MONITORING);
    } finally {
      client.release();
    }
  },
  getMemeberSchedule: async (user, memberId, date) => {
    let client;

    try {
      client = await db.connect(req);

      date = dayjs(date).format('YYYY-MM-DD');

      // 캘린더 공유를 수락했는지 확인
      const findSendGroup = await groupDB.findSendGroupIsOkay(client, user.id, memberId);
      if (findSendGroup.length === 0) return res.status(statusCode.UNAUTHORIZED).send(util.fail(statusCode.UNAUTHORIZED, responseMessage.NO_AUTHENTICATED));

      // 해당 멤버의 스케줄 날짜에 대한 시간 정보 불러오기
      let findmemberScheduleTime = await scheduleDB.findScheduleTime(client, memberId, date);

      // 사용자가 보낸 스티커 리스트 조회
      const findUserLikeScheduleList = await scheduleDB.findUserLikeScheduleList(client, user.id);
      const userLikeScheduleList = findUserLikeScheduleList.map((userLikeSchedule) => userLikeSchedule.scheduleId);

      for (let i = 0; i < findmemberScheduleTime.length; i++) {
        // 시간에 대한 스케줄 리스트 불러오기
        let scheduleList = await scheduleDB.findScheduleByMemberId(client, memberId, date, findmemberScheduleTime[i].scheduleTime);
        findmemberScheduleTime[i].scheduleList = scheduleList;

        for (let v = 0; v < scheduleList.length; v++) {
          let scheduleId = scheduleList[v].scheduleId;

          // 스케줄id로 스티커 4개 불러오기
          // 내가 보낸 스티커를 맨 앞으로 정렬해서 불러오기
          let stickerList = await scheduleDB.findLikeScheduleByScheduleId(client, scheduleId, user.id);
          scheduleList[v].stickerId = stickerList;

          // 약 스케줄에 대한 전체 스티커 리스트 조회
          let stickerTotalCount = await scheduleDB.findAllLikeScheduleByScheduleId(client, scheduleId);
          scheduleList[v].stickerTotalCount = stickerTotalCount.length;

          // 스티커를 보낸 스케줄인지 조회
          const isLikedSchedule = await scheduleDB.isLikedSchedule(client, scheduleList[v].scheduleId, userLikeScheduleList);
          scheduleList[v].isLikedSchedule = isLikedSchedule;
        }
      }

      return findmemberScheduleTime;
    } catch (error) {
      functions.logger.error(`[ERROR] [${req.method.toUpperCase()}] ${req.originalUrl}`, `[CONTENT] ${error}`);
      console.log(error);

      const slackMessage = `[ERROR] [${req.method.toUpperCase()}] ${req.originalUrl} ${req.header.user ? `uid:${req.header.user.id}` : 'req.user 없음'} ${JSON.stringify(error)}`;
      slackAPI.sendMessageToSlack(slackMessage, slackAPI.DEV_WEB_HOOK_ERROR_MONITORING);
    } finally {
      client.release();
    }
  },
  checkSchedule: async (user, scheduleId) => {
    let client;

    try {
      client = await db.connect(req);

      const findSchedule = await scheduleDB.findScheduleByScheduleId(client, scheduleId);

      // 스케줄이 존재하는지 확인
      if (!findSchedule) return res.status(statusCode.BAD_REQUEST).send(util.fail(statusCode.BAD_REQUEST, responseMessage.OUT_OF_VALUE));

      const findScheduleUser = findSchedule.userId;

      // 스케줄 유저인지 확인
      if (findScheduleUser !== user.id) return res.status(statusCode.UNAUTHORIZED).send(util.fail(statusCode.UNAUTHORIZED, responseMessage.NO_AUTHENTICATED));

      const isCheckedSchedule = await scheduleDB.updateScheduleIsCheck(client, scheduleId, true);

      return isCheckedSchedule;
    } catch (error) {
      functions.logger.error(`[ERROR] [${req.method.toUpperCase()}] ${req.originalUrl}`, `[CONTENT] ${error}`);
      console.log(error);

      const slackMessage = `[ERROR] [${req.method.toUpperCase()}] ${req.originalUrl} ${req.header.user ? `uid:${req.header.user.id}` : 'req.user 없음'} ${JSON.stringify(error)}`;
      slackAPI.sendMessageToSlack(slackMessage, slackAPI.DEV_WEB_HOOK_ERROR_MONITORING);
    } finally {
      client.release();
    }
  },
  unCheckSchedule: async (user, scheduleId) => {
    let client;
    try {
      client = await db.connect(req);

      const findSchedule = await scheduleDB.findScheduleByScheduleId(client, scheduleId);

      // 스케줄이 존재하는지 확인
      if (!findSchedule) return res.status(statusCode.BAD_REQUEST).send(util.fail(statusCode.BAD_REQUEST, responseMessage.OUT_OF_VALUE));

      const findScheduleUser = findSchedule.userId;

      // 스케줄 유저인지 확인
      if (findScheduleUser !== user.id) return res.status(statusCode.UNAUTHORIZED).send(util.fail(statusCode.UNAUTHORIZED, responseMessage.NO_AUTHENTICATED));

      const isCheckedSchedule = await scheduleDB.updateScheduleIsCheck(client, scheduleId, false);

      return isCheckedSchedule;
    } catch (error) {
      functions.logger.error(`[ERROR] [${req.method.toUpperCase()}] ${req.originalUrl}`, `[CONTENT] ${error}`);
      console.log(error);

      const slackMessage = `[ERROR] [${req.method.toUpperCase()}] ${req.originalUrl} ${req.header.user ? `uid:${req.header.user.id}` : 'req.user 없음'} ${JSON.stringify(error)}`;
      slackAPI.sendMessageToSlack(slackMessage, slackAPI.DEV_WEB_HOOK_ERROR_MONITORING);
    } finally {
      client.release();
    }
  },
};