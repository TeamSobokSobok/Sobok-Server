const functions = require('firebase-functions');
const util = require('../lib/util');
const statusCode = require('../constants/statusCode');
const responseMessage = require('../constants/responseMessage');
const slackAPI = require('../middlewares/slackAPI');
const { stickerService } = require('../service');
const returnType = require('../constants/returnType');

/**
 *  @받은스티커_불러오기
 *  @route GET /sticker/:scheduleId
 *  @access private
 *  @err 1. 필요한 값이 없을 때
 */
const getStickerBySchedule = async (req, res) => {
  try {
    const { scheduleId } = req.params;
    const { user } = req.header;

    // @err 1. 필요한 값이 없을 때
    if (!scheduleId)
      return res
        .status(statusCode.BAD_REQUEST)
        .send(util.fail(statusCode.BAD_REQUEST, responseMessage.NULL_VALUE));

    const stickerList = await stickerService.getStickerBySchedule(user, scheduleId);

    return res
      .status(statusCode.OK)
      .send(util.success(statusCode.OK, responseMessage.READ_ALL_SEND_STICKER, stickerList));
  } catch (error) {
    functions.logger.error(
      `[ERROR] [${req.method.toUpperCase()}] ${req.originalUrl}`,
      `[CONTENT] ${error}`,
    );
    console.log(error);

    const slackMessage = `[ERROR] [${req.method.toUpperCase()}] ${req.originalUrl} ${
      req.header.user ? `uid:${req.header.user.id}` : 'req.user 없음'
    } ${JSON.stringify(error)}`;
    slackAPI.sendMessageToSlack(slackMessage, slackAPI.DEV_WEB_HOOK_ERROR_MONITORING);

    return res
      .status(statusCode.INTERNAL_SERVER_ERROR)
      .send(util.fail(statusCode.INTERNAL_SERVER_ERROR, responseMessage.INTERNAL_SERVER_ERROR));
  }
};
/**
 *  @스티커_전송하기
 *  @route POST /sticker/:scheduleId
 *  @access private
 *  @err 1. 필요한 값이 없을 때
 *       2. 존재하지 않는 스케줄일 때
 *       3. 공유 요청이 수락되지 않았을 때
 *       4. 해당 스케줄이 아직 완료가 되지 않았을 때
 *       5. 이미 스티커를 전송했을 때
 */
const sendSticker = async (req, res) => {
  try {
    const { scheduleId } = req.params;
    const { stickerId } = req.query;
    const { user } = req.header;

    // @err 1. 필요한 값이 없을 때
    if (!scheduleId || !stickerId)
      return res
        .status(statusCode.BAD_REQUEST)
        .send(util.fail(statusCode.BAD_REQUEST, responseMessage.NULL_VALUE));

    const data = await stickerService.sendSticker(user, Number(stickerId), Number(scheduleId));

    // @err 2. 존재하지 않는 스케줄일 때
    if (data === returnType.DB_NOT_FOUND) {
      return res
        .status(statusCode.BAD_REQUEST)
        .send(util.fail(statusCode.BAD_REQUEST, responseMessage.OUT_OF_VALUE));
    }

    // @err 3. 공유 요청이 수락되지 않았을 때
    // @err 4. 해당 스케줄이 아직 완료가 되지 않았을 때
    if (data === returnType.WRONG_REQUEST_VALUE) {
      return res
        .status(statusCode.BAD_REQUEST)
        .send(util.fail(statusCode.BAD_REQUEST, responseMessage.ENABLE_SEND_STICKER));
    }

    // @err 5. 이미 스티커를 전송했을 때
    if (data === returnType.VALUE_ALREADY_EXIST) {
      return res
        .status(statusCode.BAD_REQUEST)
        .send(util.fail(statusCode.BAD_REQUEST, responseMessage.ALREADY_SEND_STICKER));
    }

    return res
      .status(statusCode.OK)
      .send(util.success(statusCode.OK, responseMessage.CREATED_STICKER, data));
  } catch (error) {
    functions.logger.error(
      `[ERROR] [${req.method.toUpperCase()}] ${req.originalUrl}`,
      `[CONTENT] ${error}`,
    );
    console.log(error);

    const slackMessage = `[ERROR] [${req.method.toUpperCase()}] ${req.originalUrl} ${
      req.header.user ? `uid:${req.header.user.id}` : 'req.user 없음'
    } ${JSON.stringify(error)}`;
    slackAPI.sendMessageToSlack(slackMessage, slackAPI.DEV_WEB_HOOK_ERROR_MONITORING);

    return res
      .status(statusCode.INTERNAL_SERVER_ERROR)
      .send(util.fail(statusCode.INTERNAL_SERVER_ERROR, responseMessage.INTERNAL_SERVER_ERROR));
  }
};
/**
 *  @전체_스티커_불러오기
 *  @route GET /sticker
 *  @access private
 *  @err
 */
const getAllSticker = async (req, res) => {
  try {
    const stickerList = await stickerService.getAllSticker();

    return res
      .status(statusCode.OK)
      .send(util.success(statusCode.OK, responseMessage.READ_ALL_STICKER, stickerList));
  } catch (error) {
    functions.logger.error(
      `[ERROR] [${req.method.toUpperCase()}] ${req.originalUrl}`,
      `[CONTENT] ${error}`,
    );
    console.log(error);

    const slackMessage = `[ERROR] [${req.method.toUpperCase()}] ${req.originalUrl} ${
      req.header.user ? `uid:${req.header.user.id}` : 'req.user 없음'
    } ${JSON.stringify(error)}`;
    slackAPI.sendMessageToSlack(slackMessage, slackAPI.DEV_WEB_HOOK_ERROR_MONITORING);

    return res
      .status(statusCode.INTERNAL_SERVER_ERROR)
      .send(util.fail(statusCode.INTERNAL_SERVER_ERROR, responseMessage.INTERNAL_SERVER_ERROR));
  }
};
/**
 *  @전송된스티커_수정하기
 *  @route PUT /my/:likeScheduleId
 *  @access private
 *  @err 1. 필요한 값이 없을 때
 *       2. 수정할 스티커가 존재하지 않을 때
 *       3. 권한이 없을 떼
 */
const updateSendSticker = async (req, res) => {
  try {
    const { likeScheduleId } = req.params;
    const { stickerId } = req.query;
    const { user } = req.header;

    // @err 1. 필요한 값이 없을 때
    if (!likeScheduleId || !stickerId)
      return res
        .status(statusCode.BAD_REQUEST)
        .send(util.fail(statusCode.BAD_REQUEST, responseMessage.NULL_VALUE));

    const data = await stickerService.updateSendSticker(user, stickerId, likeScheduleId);

    // @err 2. 수정할 스티커가 존재하지 않을 때
    if (data === returnType.DB_NOT_FOUND) {
      return res
        .status(statusCode.BAD_REQUEST)
        .send(util.fail(statusCode.BAD_REQUEST, responseMessage.OUT_OF_VALUE));
    }

    // @err 3. 권한이 없을 떼
    if (data === returnType.WRONG_REQUEST_VALUE) {
      return res
        .status(statusCode.FORBIDDEN)
        .send(util.fail(statusCode.FORBIDDEN, responseMessage.NO_AUTHENTICATED));
    }

    return res
      .status(statusCode.OK)
      .send(util.success(statusCode.OK, responseMessage.UPDATE_STICKER, data));
  } catch (error) {
    functions.logger.error(
      `[ERROR] [${req.method.toUpperCase()}] ${req.originalUrl}`,
      `[CONTENT] ${error}`,
    );
    console.log(error);

    const slackMessage = `[ERROR] [${req.method.toUpperCase()}] ${req.originalUrl} ${
      req.header.user ? `uid:${req.header.user.id}` : 'req.user 없음'
    } ${JSON.stringify(error)}`;
    slackAPI.sendMessageToSlack(slackMessage, slackAPI.DEV_WEB_HOOK_ERROR_MONITORING);

    return res
      .status(statusCode.INTERNAL_SERVER_ERROR)
      .send(util.fail(statusCode.INTERNAL_SERVER_ERROR, responseMessage.INTERNAL_SERVER_ERROR));
  }
};

module.exports = {
  getAllSticker,
  getStickerBySchedule,
  sendSticker,
  updateSendSticker,
};
