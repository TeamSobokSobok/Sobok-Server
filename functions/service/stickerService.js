const functions = require('firebase-functions');
const db = require('../db/db');
const { scheduleDB, groupDB, stickerDB } = require('../db');
const returnType = require('../constants/returnType');

module.exports = {
  getStickerBySchedule: async (user, scheduleId) => {
    let client;
    const req = `user = ${user}, scheduleId = ${scheduleId}`;

    try {
      client = await db.connect(req);

      // 약 스케줄에 대한 전체 스티커 리스트 조회
      let likeScheduleList = await scheduleDB.findLikeSchedule(client, scheduleId, user.id);

      // 사용자가 보낸 스티커 리스트 조회
      const findUserLikeScheduleList = await scheduleDB.findUserLikeScheduleList(client, user.id);
      const userLikeScheduleList = findUserLikeScheduleList.map(
        (userLikeSchedule) => userLikeSchedule.id,
      );

      for (let i = 0; i < likeScheduleList.length; i++) {
        // 내가 보낸 스티커인지 확인
        const isMySticker = await scheduleDB.isLikedSchedule(
          client,
          likeScheduleList[i].likeScheduleId,
          userLikeScheduleList,
        );
        likeScheduleList[i].isMySticker = isMySticker;
      }

      return likeScheduleList;
    } catch (error) {
      console.log(error);
    } finally {
      client.release();
    }
  },
  sendSticker: async (user, stickerId, scheduleId) => {
    let client;
    const req = `user = ${user}, stickerId = ${stickerId}, scheduleId = ${scheduleId}`;

    try {
      client = await db.connect(req);

      const findScheduleByScheduleId = await scheduleDB.findScheduleByScheduleId(
        client,
        scheduleId,
      );

      // 존재하지 않는 스케줄일 때
      if (!findScheduleByScheduleId) {
        return returnType.DB_NOT_FOUND;
      }

      // 해당 스케줄 주인의 id와 유저 id로 공유 수락 여부를 확인
      const findScheduleUser = findScheduleByScheduleId.userId;
      const findSendGroup = await groupDB.findSendGroupIsOkay(client, user.id, findScheduleUser);

      // 공유 요청이 수락되지 않았을 때
      if (findSendGroup.length === 0) {
        return returnType.WRONG_REQUEST_VALUE;
      }

      // 해당 스케줄이 아직 완료가 되지 않았을 때
      if (findScheduleByScheduleId.isCheck === false) {
        return returnType.WRONG_REQUEST_VALUE;
      }

      // 이미 스티커를 보냈는지 확인
      const findLikeSchedule = await scheduleDB.findLikeScheduleBySenderId(
        client,
        scheduleId,
        user.id,
      );

      // 이미 스티커를 전송했을 때
      if (findLikeSchedule.length !== 0) {
        return returnType.VALUE_ALREADY_EXIST;
      }

      // 스티커 전송하기
      const addLikeSchedule = await scheduleDB.addLikeSchedule(
        client,
        scheduleId,
        user.id,
        stickerId,
      );

      return addLikeSchedule;
    } catch (error) {
      console.log(error);
    } finally {
      client.release();
    }
  },
  getAllSticker: async () => {
    let client;
    const req = ``;

    try {
      client = await db.connect(req);

      const stickerList = await stickerDB.findStickerList(client);

      return stickerList;
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
  updateSendSticker: async (user, stickerId, likeScheduleId) => {
    let client;
    const req = ``;

    try {
      client = await db.connect(req);

      const findLikeScheduleById = await scheduleDB.findLikeScheduleById(client, likeScheduleId);

      // 수정할 스티커가 없을 때
      if (!findLikeScheduleById) {
        return returnType.DB_NOT_FOUND;
      }

      const findUser = findLikeScheduleById.senderId;

      // 스티커를 보낸 사용자가 아닐 때
      if (findUser !== user.id) {
        return returnType.WRONG_REQUEST_VALUE;
      }

      const updateSticker = await scheduleDB.updateSticker(client, likeScheduleId, stickerId);

      return updateSticker;
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
