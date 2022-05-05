const functions = require('firebase-functions');
const util = require('../../../lib/util');
const statusCode = require('../../../constants/statusCode');
const responseMessage = require('../../../constants/responseMessage');
const db = require('../../../db/db');
const { groupDB } = require('../../../db');
const slackAPI = require('../../../middlewares/slackAPI');

module.exports = {
  updateGroupName: async (req, res) => {
    const { user } = req.header;
    const { groupId } = req.params;
    const { memberName } = req.body;

    if (!groupId || !memberName) return res.status(statusCode.BAD_REQUEST).send(util.fail(statusCode.BAD_REQUEST, responseMessage.NULL_VALUE));

    let client;

    try {
      client = await db.connect(req);

      const findGroup = await groupDB.findSendGroupBySendGroupId(client, groupId);

      // findGroup이 없을 시 에러 반환
      if (!findGroup) return res.status(statusCode.BAD_REQUEST).send(util.fail(statusCode.BAD_REQUEST, responseMessage.OUT_OF_VALUE));

      const findGroupUser = findGroup.senderId;

      // 공유 요청한 사람 id와 유저의 id가 같은지 확인
      if (findGroupUser !== user.id) return res.status(statusCode.UNAUTHORIZED).send(util.fail(statusCode.UNAUTHORIZED, responseMessage.NO_AUTHENTICATED));

      const updateMemberName = await groupDB.updateMemberName(client, memberName, groupId);

      res.status(statusCode.OK).send(util.success(statusCode.OK, responseMessage.UPDATE_MEMBER_NAME, updateMemberName));
    } catch (error) {
      functions.logger.error(`[ERROR] [${req.method.toUpperCase()}] ${req.originalUrl}`, `[CONTENT] ${error}`);
      console.log(error);

      const slackMessage = `[ERROR] [${req.method.toUpperCase()}] ${req.originalUrl} ${req.header.user ? `uid:${req.header.user.id}` : 'req.user 없음'} ${JSON.stringify(error)}`;
      slackAPI.sendMessageToSlack(slackMessage, slackAPI.DEV_WEB_HOOK_ERROR_MONITORING);

      res.status(statusCode.INTERNAL_SERVER_ERROR).send(util.fail(statusCode.INTERNAL_SERVER_ERROR, responseMessage.INTERNAL_SERVER_ERROR));
    } finally {
      client.release();
    }
  },
  updateIsOkay: async (req, res) => {
    const { user } = req.header;
    const { sendGroupId } = req.params;
    const { isOkay } = req.body;

    if (!sendGroupId || !isOkay) return res.status(statusCode.BAD_REQUEST).send(util.fail(statusCode.BAD_REQUEST, responseMessage.NULL_VALUE));

    let client;

    try {
      client = await db.connect(req);

      const findSendGroup = await groupDB.findSendGroupBySendGroupId(client, sendGroupId);

      // 해당 그룹이 없을 시 에러 반환
      if (!findSendGroup) return res.status(statusCode.BAD_REQUEST).send(util.fail(statusCode.BAD_REQUEST, responseMessage.OUT_OF_VALUE));

      const receiverId = findSendGroup.receiverId;

      // 해당 그룹 정보 조회해서 memberId와 수락 요청하는 userId 비교
      if (receiverId !== user.id) return res.status(statusCode.UNAUTHORIZED).send(util.fail(statusCode.UNAUTHORIZED, responseMessage.NO_AUTHENTICATED));

      const updateSendGroup = await groupDB.updateSendGroup(client, sendGroupId, isOkay);

      res.status(statusCode.OK).send(util.success(statusCode.OK, responseMessage.UPDATE_SEND_GROUP, updateSendGroup));
    } catch (error) {
      functions.logger.error(`[ERROR] [${req.method.toUpperCase()}] ${req.originalUrl}`, `[CONTENT] ${error}`);
      console.log(error);

      const slackMessage = `[ERROR] [${req.method.toUpperCase()}] ${req.originalUrl} ${req.header.user ? `uid:${req.header.user.id}` : 'req.user 없음'} ${JSON.stringify(error)}`;
      slackAPI.sendMessageToSlack(slackMessage, slackAPI.DEV_WEB_HOOK_ERROR_MONITORING);

      res.status(statusCode.INTERNAL_SERVER_ERROR).send(util.fail(statusCode.INTERNAL_SERVER_ERROR, responseMessage.INTERNAL_SERVER_ERROR));
    } finally {
      client.release();
    }
  },
  getGroup: async (req, res) => {
    const user = req.header.user;

    let client;

    try {
      client = await db.connect(req);

      // 캘린더 공유 요청을 수락한 사람만 불러오기
      const member = await groupDB.findMember(client, user.id);

      res.status(statusCode.OK).send(util.success(statusCode.OK, responseMessage.READ_ALL_GROUP, member));
    } catch (error) {
      functions.logger.error(`[ERROR] [${req.method.toUpperCase()}] ${req.originalUrl}`, `[CONTENT] ${error}`);
      console.log(error);

      const slackMessage = `[ERROR] [${req.method.toUpperCase()}] ${req.originalUrl} ${req.header.user ? `uid:${req.header.user.id}` : 'req.user 없음'} ${JSON.stringify(error)}`;
      slackAPI.sendMessageToSlack(slackMessage, slackAPI.DEV_WEB_HOOK_ERROR_MONITORING);

      res.status(statusCode.INTERNAL_SERVER_ERROR).send(util.fail(statusCode.INTERNAL_SERVER_ERROR, responseMessage.INTERNAL_SERVER_ERROR));
    } finally {
      client.release();
    }
  },
  sendGroup: async (req, res) => {
    const { user } = req.header;
    const { memberId } = req.query;
    const { memberName } = req.body;

    if (!memberId || !memberName) return res.status(statusCode.BAD_REQUEST).send(util.fail(statusCode.BAD_REQUEST, responseMessage.NULL_VALUE));

    let client;

    try {
      client = await db.connect(req);

      const senderId = user.id;

      // 나한테 공유 요청하면 에러 반환
      if (Number(senderId) === Number(memberId)) return res.status(statusCode.BAD_REQUEST).send(util.fail(statusCode.BAD_REQUEST, responseMessage.ENABLE_SEND_GROUP));

      // 캘린더 공유 요청하려는 사용자가 없으면 에러 반환
      const findMember = await userDB.findUserById(client, memberId);
      if (!findMember) return res.status(statusCode.BAD_REQUEST).send(util.fail(statusCode.BAD_REQUEST, responseMessage.NO_USER));

      // 이미 캘린더 공유 요청된 사용자이면 에러 반환
      const findSendGroup = await groupDB.findSendGroup(client, senderId, memberId);
      if (findSendGroup.length !== 0) return res.status(statusCode.CONFLICT).send(util.fail(statusCode.CONFLICT, responseMessage.ALREADY_SEND_GROUP));

      // send_group & notice 테이블에 각각 정보 추가
      const sendGroup = await groupDB.addSendGroup(client, senderId, memberId, memberName);
      const notice = await noticeDB.addNotice(client, memberId, sendGroup.id, 'calendar');

      res.status(statusCode.OK).send(util.success(statusCode.OK, responseMessage.ADD_SEND_GROUP, sendGroup));
    } catch (error) {
      functions.logger.error(`[ERROR] [${req.method.toUpperCase()}] ${req.originalUrl}`, `[CONTENT] ${error}`);
      console.log(error);

      const slackMessage = `[ERROR] [${req.method.toUpperCase()}] ${req.originalUrl} ${req.header.user ? `uid:${req.header.user.id}` : 'req.user 없음'} ${JSON.stringify(error)}`;
      slackAPI.sendMessageToSlack(slackMessage, slackAPI.DEV_WEB_HOOK_ERROR_MONITORING);

      res.status(statusCode.INTERNAL_SERVER_ERROR).send(util.fail(statusCode.INTERNAL_SERVER_ERROR, responseMessage.INTERNAL_SERVER_ERROR));
    } finally {
      client.release();
    }
  },
};
