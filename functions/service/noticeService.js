const functions = require('firebase-functions');
const db = require('../db/db');
const { userDB, groupDB, noticeDB } = require('../db');

module.exports = {
  updateMemberName: async (user, groupId, memberName) => {
    let client;
    const req = `user = ${user}, groupId = ${groupId}, memberName = ${memberName}`;

    try {
      client = await db.connect(req);

      const findGroup = await groupDB.findSendGroupBySendGroupId(client, groupId);

      // 해당하는 그룹이 없을 때
      if (!findGroup) {
        return 'WRONG_REQUEST';
      }

      const findSenderId = findGroup.senderId;

      // 그룹 요청한 사람 id 와 user_id가 같은지 확인
      if (findSenderId !== user.id) {
        return 'NO_AUTHENTICATED';
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
        return 'WRONG_REQUEST';
      }

      const receiverId = findSendGroup.receiverId;

      // 그룹 요청받은 id 와 수락하려는 user_id 비교
      if (receiverId !== user.id) {
        return 'NO_AUTHENTICATED';
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
        return 'WRONG_REQUEST';
      }

      // 캘린더 공유 요청하려는 사용자가 없을 때
      const findMember = await userDB.findUserById(client, memberId);
      if (!findMember) {
        return 'DB_NOT_FOUND';
      }

      // 이미 캘린더 공유 요청된 사용자일 때
      const findSendGroup = await groupDB.findSendGroup(client, senderId, memberId);
      if (findSendGroup.length !== 0) {
        return 'ALREADY_EXIST';
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
