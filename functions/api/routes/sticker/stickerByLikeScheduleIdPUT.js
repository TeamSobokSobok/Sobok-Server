const functions = require('firebase-functions');
const util = require('../../../lib/util');
const statusCode = require('../../../constants/statusCode');
const responseMessage = require('../../../constants/responseMessage');
const db = require('../../../db/db');
const { scheduleDB } = require('../../../db');

module.exports = async (req, res) => {
  const { likeScheduleId } = req.params;
  const { stickerId } = req.query;
  const { user } = req.header;

  if (!likeScheduleId || !stickerId) return res.status(statusCode.BAD_REQUEST).send(util.fail(statusCode.BAD_REQUEST, responseMessage.NULL_VALUE));

  let client;

  try {
    client = await db.connect(req);

    // 해당 스티커 정보 조회
    const findLikeScheduleById = await scheduleDB.findLikeScheduleById(client, likeScheduleId);
    const findUser = findLikeScheduleById.senderId;

    if (findUser !== user.id) return res.status(statusCode.UNAUTHORIZED).send(util.fail(statusCode.UNAUTHORIZED, responseMessage.NO_AUTHENTICATED));

    const updateSticker = await scheduleDB.updateSticker(client, likeScheduleId, stickerId);

    res.status(statusCode.OK).send(util.success(statusCode.OK, responseMessage.UPDATE_STICKER, updateSticker));
  } catch (error) {
    functions.logger.error(`[ERROR] [${req.method.toUpperCase()}] ${req.originalUrl}`, `[CONTENT] ${error}`);
    console.log(error);

    res.status(statusCode.INTERNAL_SERVER_ERROR).send(util.fail(statusCode.INTERNAL_SERVER_ERROR, responseMessage.INTERNAL_SERVER_ERROR));
  } finally {
    client.release();
  }
};
