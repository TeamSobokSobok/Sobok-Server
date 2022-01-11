const functions = require('firebase-functions');
const util = require('../../../lib/util');
const statusCode = require('../../../constants/statusCode');
const responseMessage = require('../../../constants/responseMessage');
const db = require('../../../db/db');
const { groupDB } = require('../../../db');

module.exports = async (req, res) => {
  let user = req.header.user;
  let client;

  try {
    client = await db.connect(req);

    console.log(user.id);

    const member = await groupDB.findMember(client, user.id);

    res.status(statusCode.OK).send(util.success(statusCode.OK, responseMessage.READ_ALL_MENU_SUCCESS, member));
  } catch (error) {
    functions.logger.error(`[ERROR] [${req.method.toUpperCase()}] ${req.originalUrl}`, `[CONTENT] ${error}`);
    console.log(error);

    res.status(statusCode.INTERNAL_SERVER_ERROR).send(util.fail(statusCode.INTERNAL_SERVER_ERROR, responseMessage.INTERNAL_SERVER_ERROR));
  } finally {
    client.release();
  }
};
