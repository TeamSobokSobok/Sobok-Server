const functions = require('firebase-functions');
const db = require('../db/db');
const { userDB, groupDB, noticeDB, pillDB, sendPillDB, scheduleDB } = require('../db');
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

    let infoList = [];
    calendarInfo.forEach((info) => infoList.push(info));
    pillInfo.forEach((info) => infoList.push(info));

    infoList = infoList.sort((first, second) => first.createdAt - second.createdAt).reverse();

    return util.success(statusCode.OK, responseMessage.NOTICE_GET_SUCCESS, { infoList: infoList });
  } catch (error) {
    console.error('getNoticeList error 발생: ' + error);
  } finally {
    client.release();
  }
};

/**
 * 약 알림 상세조회 서비스
 * @param pillId - 해당 약 아이디
 */
const getPillInfo = async (pillId) => {
  let client;
  const log = `pillDB.getPillInfo | pillId = ${pillId}`;

  try {
    client = await db.connect(log);

    const pillInfo = await pillDB.getPillInfo(client, pillId);
    if (!pillInfo[0]) return returnType.NON_EXISTENT_PILL;

    let scheduleTime = [];
    pillInfo.forEach((info) => scheduleTime.push(info.scheduleTime));
    pillInfo[0].scheduleTime = scheduleTime;

    return util.success(statusCode.OK, responseMessage.PILL_GET_SUCCESS, pillInfo[0]);
  } catch (error) {
    console.error('getPillInfo error 발생: ' + error);
  } finally {
    client.release();
  }
};

/**
 * 약 알림 수락 & 거절 서비스
 * @param pillId - 업데이트할 약 아이디
 */
const updateSendPill = async (userId, pillId, acceptState) => {
  let client;
  const log = `pillDB.accept.acceptSendPill | pillId = ${pillId}`;

  try {
    client = await db.connect(log);
    await client.query('BEGIN');

    const pillReceiverInfo = await sendPillDB.getSendPillUser(client, pillId);
    console.log(pillReceiverInfo);
    // 해당 약을 받은 유저가 아닐 때
    if (pillReceiverInfo.userId !== userId) {
      return returnType.NO_PILL_USER;
    }

    // 이미 처리된 약일 때
    if (pillReceiverInfo.isOkay !== 'waiting') {
      return returnType.ALREADY_COMPLETE;
    }

    const updateSendPill = await sendPillDB.updateSendPill(client, pillId, acceptState);
    if (acceptState === 'refuse') {
      await client.query('COMMIT');
      return util.success(statusCode.OK, responseMessage.PILL_REFUSE_SUCCESS, updateSendPill);
    } else if (acceptState === 'accept') {
      const acceptSendPill = await pillDB.acceptSendPill(client, userId, pillId);
      const updateSchedule = await scheduleDB.acceptSendPill(client, pillId, userId);
      await client.query('COMMIT');
      return util.success(statusCode.OK, responseMessage.PILL_ACCEPT_SUCCESS, updateSendPill);
    } else {
      return returnType.WRONG_REQUEST_VALUE;
    }
  } catch (error) {
    console.error('acceptSendPill error 발생: ' + error);
    await client.query('ROLLBACK');
  } finally {
    client.release();
  }
};

module.exports = {
  getNoticeList,
  getPillInfo,
  updateSendPill,
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

      // 그룹 요청한 사람 id 와 user_id가 같은지 확인
      if (findGroup.senderId !== user.id) {
        return returnType.WRONG_REQUEST_VALUE;
      }

      // 멤버 이름 수정
      const updateMemberName = await groupDB.updateMemberName(client, memberName, groupId);

      return updateMemberName;
    } catch (error) {
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
      console.log(findSendGroup);

      // 해당하는 그룹이 없을 때
      if (!findSendGroup) {
        return returnType.DB_NOT_FOUND;
      }

      const receiverId = findSendGroup.userId;

      // 그룹 요청받은 id 와 수락하려는 user_id 비교
      if (receiverId !== user.id) {
        return returnType.WRONG_REQUEST_VALUE;
      }

      // 수락 여부 수정
      const updateSendGroup = await groupDB.updateSendGroup(client, sendGroupId, isOkay);

      return updateSendGroup;
    } catch (error) {
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
      console.log('senderId' + senderId);

      // 자신한테 공유 요청했을 때
      if (Number(senderId) === Number(memberId)) {
        return returnType.WRONG_REQUEST_VALUE;
      }

      // 캘린더 공유 요청하려는 사용자가 없을 때
      const findMember = await userDB.findUserById(client, memberId);
      if (findMember.length === 0) {
        return returnType.DB_NOT_FOUND;
      }

      // send_group & notice 테이블에 각각 정보 추가
      const notice = await noticeDB.addNotice(client, senderId, memberId, 'calendar');
      const sendGroup = await groupDB.addSendGroup(client, notice.id, memberName);

      return sendGroup;
    } catch (error) {
      console.log(error);
    } finally {
      client.release();
    }
  },
};
