const functions = require('firebase-functions');
const util = require('../../../lib/util');
const statusCode = require('../../../constants/statusCode');
const responseMessage = require('../../../constants/responseMessage');
const db = require('../../../db/db');
const { groupDB } = require('../../../db');

module.exports = async (req, res) => {
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

    res.status(statusCode.INTERNAL_SERVER_ERROR).send(util.fail(statusCode.INTERNAL_SERVER_ERROR, responseMessage.INTERNAL_SERVER_ERROR));
  } finally {
    client.release();
  }
};
