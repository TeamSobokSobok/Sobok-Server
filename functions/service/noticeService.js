const functions = require('firebase-functions');
const db = require('../db/db');
const { userDB, groupDB, noticeDB, sendPillDB } = require('../db');
const returnType = require('../constants/returnType');
const util = require('../lib/util');
const statusCode = require('../constants/statusCode');
const responseMessage = require('../constants/responseMessage');

/**
 * getNoticeList
 * 알림 리스트 전체 조회 서비스
 * @param userId - 알림 리스트 조회할 유저 아이디
 */
const getNoticeList = async (userId) => {
  let client;
  const log = `noticeDB.getNoticeList | userId = ${userId}`;

  try {
    client = await db.connect(db);

    const user = await userDB.findUserById(client, userId);
    if (!user) return returnType.NON_EXISTENT_USER;

    let calendarInfo = await groupDB.findCalendarInfo(client, userId);
    let pillInfo = await sendPillDB.findSendPillInfo(client, userId);

    let infoList = []
    calendarInfo.forEach(info => infoList.push(info));
    pillInfo.forEach(info => infoList.push(info));

    infoList = infoList.sort((first, second) => first.createdAt - second.createdAt).reverse();

    return util.success(statusCode.OK, responseMessage.NOTICE_GET_SUCCESS, {infoList: infoList})
  } catch (error) {
    console.error('getNoticeList error 발생: ' + error);
  } finally {
    client.release();
  }
};

module.exports = {
  getNoticeList,
  updateMemberName: async (user, groupId, memberName) => {
    let client;
    const req = `user = ${user}, groupId = ${groupId}, memberName = ${memberName}`;

    try {
      client = await db.connect(req);

      const findGroup = await groupDB.findSendGroupBySendGroupId(client, groupId);

      // 해당하는 그룹이 없을 때
      if (!findGroup) {
        return returnType.DB_NOT_FOUND;
      }

      //const findSenderId = findGroup.senderId;

      // 그룹 요청한 사람 id 와 user_id가 같은지 확인
      if (findGroup.senderId !== user.id) {
        return returnType.WRONG_REQUEST_VALUE;
      }

      // 멤버 이름 수정
      const updateMemberName = await groupDB.updateMemberName(client, memberName, groupId);

      return updateMemberName;
    } catch (error) {
      functions.logger.error(
        `[ERROR] [${req.method.toUpperCase()}] ${req.originalUrl}`,
        `[CONTENT] ${error}`,
      );
      console.log(error);
    } finally {
      client.release();
    }
  },
  updateIsOkay: async (user, sendGroupId, isOkay) => {
    let client;
    const req = `user = ${user}, sendGroupId = ${sendGroupId}, isOkay = ${isOkay}`;

    try {
      client = await db.connect(req);

      const findSendGroup = await groupDB.findSendGroupBySendGroupId(client, sendGroupId);

      // 해당하는 그룹이 없을 때
      if (!findSendGroup) {
        return returnType.DB_NOT_FOUND;
      }

      const receiverId = findSendGroup.receiverId;

      // 그룹 요청받은 id 와 수락하려는 user_id 비교
      if (receiverId !== user.id) {
        return returnType.WRONG_REQUEST_VALUE;
      }

      // 수락 여부 수정
      const updateSendGroup = await groupDB.updateSendGroup(client, sendGroupId, isOkay);

      return updateSendGroup;
    } catch (error) {
      functions.logger.error(
        `[ERROR] [${req.method.toUpperCase()}] ${req.originalUrl}`,
        `[CONTENT] ${error}`,
      );
      console.log(error);
    } finally {
      client.release();
    }
  },
  getMember: async (user) => {
    let client;
    const req = `user = ${user}`;

    try {
      client = await db.connect(req);

      // 캘린더 공유 요청을 수락한 사람만 불러오기
      const memberList = await groupDB.findMember(client, user.id);

      return memberList;
    } catch (error) {
      functions.logger.error(
        `[ERROR] [${req.method.toUpperCase()}] ${req.originalUrl}`,
        `[CONTENT] ${error}`,
      );
      console.log(error);
    } finally {
      client.release();
    }
  },
  sendGroup: async (user, memberId, memberName) => {
    let client;
    const req = `user = ${user}, memberId = ${memberId}, memberName = ${memberName}`;

    try {
      client = await db.connect(req);

      const senderId = user.id;

      // 자신한테 공유 요청했을 때
      if (Number(senderId) === Number(memberId)) {
        return returnType.WRONG_REQUEST_VALUE;
      }

      // 캘린더 공유 요청하려는 사용자가 없을 때
      const findMember = await userDB.findUserById(client, memberId);
      if (!findMember) {
        return returnType.DB_NOT_FOUND;
      }

      // 이미 캘린더 공유 요청된 사용자일 때
      const findSendGroup = await groupDB.findSendGroup(client, senderId, memberId);
      if (findSendGroup.length !== 0) {
        return returnType.VALUE_ALREADY_EXIST;
      }

      // send_group & notice 테이블에 각각 정보 추가
      const sendGroup = await groupDB.addSendGroup(client, senderId, memberId, memberName);
      const notice = await noticeDB.addNotice(client, memberId, sendGroup.id, 'calendar');

      return sendGroup;
    } catch (error) {
      functions.logger.error(
        `[ERROR] [${req.method.toUpperCase()}] ${req.originalUrl}`,
        `[CONTENT] ${error}`,
      );
      console.log(error);
    } finally {
      client.release();
    }
  },
};
