const functions = require('firebase-functions');
const util = require('../../../lib/util');
const statusCode = require('../../../constants/statusCode');
const responseMessage = require('../../../constants/responseMessage');
const db = require('../../../db/db');
const { scheduleDB } = require('../../../db');
const slackAPI = require('../../../middlewares/slackAPI');

module.exports = {
  getStickerBySchedule: async (req, res) => {
    const { scheduleId } = req.params;
    const { user } = req.header;

    if (!scheduleId) return res.status(statusCode.BAD_REQUEST).send(util.fail(statusCode.BAD_REQUEST, responseMessage.NULL_VALUE));

    let client;

    try {
      client = await db.connect(req);

      // 약 스케줄에 대한 전체 스티커 리스트 조회
      let likeScheduleList = await scheduleDB.findLikeSchedule(client, scheduleId, user.id);

      // 사용자가 보낸 스티커 리스트 조회
      const findUserLikeScheduleList = await scheduleDB.findUserLikeScheduleList(client, user.id);
      const userLikeScheduleList = findUserLikeScheduleList.map((userLikeSchedule) => userLikeSchedule.id);

      for (let i = 0; i < likeScheduleList.length; i++) {
        // 내가 보낸 스티커인지 확인
        const isMySticker = await scheduleDB.isLikedSchedule(client, likeScheduleList[i].likeScheduleId, userLikeScheduleList);
        likeScheduleList[i].isMySticker = isMySticker;
      }

      res.status(statusCode.OK).send(util.success(statusCode.OK, responseMessage.READ_ALL_SEND_STICKER, likeScheduleList));
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
  sendSticker: async (req, res) => {
    const { scheduleId } = req.params;
    const { stickerId } = req.query;
    const { user } = req.header;

    if (!scheduleId || !stickerId) return res.status(statusCode.BAD_REQUEST).send(util.fail(statusCode.BAD_REQUEST, responseMessage.NULL_VALUE));

    let client;

    try {
      client = await db.connect(req);

      const findScheduleByScheduleId = await scheduleDB.findScheduleByScheduleId(client, scheduleId);
      if (!findScheduleByScheduleId) return res.status(statusCode.BAD_REQUEST).send(util.fail(statusCode.BAD_REQUEST, responseMessage.OUT_OF_VALUE));

      // 해당 스케줄 주인의 id와 유저 id로 그룹 수락 여부를 확인
      const findScheduleUser = findScheduleByScheduleId.userId;
      const findSendGroup = await groupDB.findSendGroupIsOkay(client, user.id, findScheduleUser);
      if (findSendGroup.length === 0) return res.status(statusCode.UNAUTHORIZED).send(util.fail(statusCode.UNAUTHORIZED, responseMessage.NO_AUTHENTICATED));

      // 해당 스케줄의 완료 여부를 확인
      if (findScheduleByScheduleId.isCheck === false) return res.status(statusCode.BAD_REQUEST).send(util.fail(statusCode.BAD_REQUEST, responseMessage.NOT_CHECK));

      // 이미 스티커를 보냈는지 확인
      const findLikeSchedule = await scheduleDB.findLikeScheduleBySenderId(client, scheduleId, user.id);
      if (findLikeSchedule.length !== 0) return res.status(statusCode.CONFLICT).send(util.fail(statusCode.CONFLICT, responseMessage.ALREADY_POST_STICKER));

      const addLikeSchedule = await scheduleDB.addLikeSchedule(client, scheduleId, user.id, stickerId);

      res.status(statusCode.OK).send(util.success(statusCode.OK, responseMessage.CREATED_STICKER, addLikeSchedule));
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
  getAllSticker: async (req, res) => {
    let client;

    try {
      client = await db.connect(req);

      const stickerList = await stickerDB.findStickerList(client);

      res.status(statusCode.OK).send(util.success(statusCode.OK, responseMessage.READ_ALL_STICKER, stickerList));
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
  updateSendSticker: async (req, res) => {
    const { likeScheduleId } = req.params;
    const { stickerId } = req.query;
    const { user } = req.header;

    if (!likeScheduleId || !stickerId) return res.status(statusCode.BAD_REQUEST).send(util.fail(statusCode.BAD_REQUEST, responseMessage.NULL_VALUE));

    let client;

    try {
      client = await db.connect(req);

      // 해당 스티커 정보 조회
      const findLikeScheduleById = await scheduleDB.findLikeScheduleById(client, likeScheduleId);

      if (!findLikeScheduleById) return res.status(statusCode.BAD_REQUEST).send(util.fail(statusCode.BAD_REQUEST, responseMessage.OUT_OF_VALUE));

      const findUser = findLikeScheduleById.senderId;

      // 스티커 주인이 아닐 시 에러 반환
      if (findUser !== user.id) return res.status(statusCode.UNAUTHORIZED).send(util.fail(statusCode.UNAUTHORIZED, responseMessage.NO_AUTHENTICATED));

      const updateSticker = await scheduleDB.updateSticker(client, likeScheduleId, stickerId);

      res.status(statusCode.OK).send(util.success(statusCode.OK, responseMessage.UPDATE_STICKER, updateSticker));
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
