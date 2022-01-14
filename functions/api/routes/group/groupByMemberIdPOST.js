const functions = require('firebase-functions');
const util = require('../../../lib/util');
const statusCode = require('../../../constants/statusCode');
const responseMessage = require('../../../constants/responseMessage');
const db = require('../../../db/db');
const { groupDB } = require('../../../db');

module.exports = async (req, res) => {
  const { user } = req.header;
  const { memberId } = req.params;
  const { memberName } = req.body;

  if (!memberId || !memberName) return res.status(statusCode.BAD_REQUEST).send(util.fail(statusCode.BAD_REQUEST, responseMessage.NULL_VALUE));

  let client;

  try {
    client = await db.connect(req);

    // 이미 있으면 이미 공유 요청된 사용자 에러 반환
    //const findSendGroup = await groupDB.addSendGroup

    const senderId = user.id;
    const sendGroup = await groupDB.addSendGroup(client, senderId, memberId, memberName);

    res.status(statusCode.OK).send(util.success(statusCode.OK, responseMessage.ADD_SEND_GROUP, sendGroup));
  } catch (error) {
    functions.logger.error(`[ERROR] [${req.method.toUpperCase()}] ${req.originalUrl}`, `[CONTENT] ${error}`);
    console.log(error);

    res.status(statusCode.INTERNAL_SERVER_ERROR).send(util.fail(statusCode.INTERNAL_SERVER_ERROR, responseMessage.INTERNAL_SERVER_ERROR));
  } finally {
    client.release();
  }
};
