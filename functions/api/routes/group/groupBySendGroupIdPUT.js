const functions = require('firebase-functions');
const util = require('../../../lib/util');
const statusCode = require('../../../constants/statusCode');
const responseMessage = require('../../../constants/responseMessage');
const db = require('../../../db/db');
const { groupDB } = require('../../../db');

module.exports = async (req, res) => {
  const { user } = req.header;
  const { sendGroupId } = req.params;
  const { isOkay } = req.body;

  if (!sendGroupId || !isOkay) return res.status(statusCode.BAD_REQUEST).send(util.fail(statusCode.BAD_REQUEST, responseMessage.NULL_VALUE));

  let client;

  try {
    client = await db.connect(req);

    // 해당 그룹 정보 조회해서 memberId와 수락 요청하는 userId 비교
    const findSendGroup = await groupDB.findSendGroupBySendGroupId(client, sendGroupId);
    const memberId = findSendGroup.memberId;
    console.log(memberId);
    console.log(user.id);
    if (memberId !== user.id) return res.status(statusCode.UNAUTHORIZED).send(util.fail(statusCode.UNAUTHORIZED, responseMessage.NO_AUTHENTICATED));

    const updateSendGroup = await groupDB.updateSendGroup(client, sendGroupId, isOkay);

    res.status(statusCode.OK).send(util.success(statusCode.OK, responseMessage.UPDATE_SEND_GROUP, updateSendGroup));
  } catch (error) {
    functions.logger.error(`[ERROR] [${req.method.toUpperCase()}] ${req.originalUrl}`, `[CONTENT] ${error}`);
    console.log(error);

    res.status(statusCode.INTERNAL_SERVER_ERROR).send(util.fail(statusCode.INTERNAL_SERVER_ERROR, responseMessage.INTERNAL_SERVER_ERROR));
  } finally {
    client.release();
  }
};
