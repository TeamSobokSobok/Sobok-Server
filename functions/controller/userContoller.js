const functions = require('firebase-functions');
const util = require('../lib/util');
const statusCode = require('../constants/statusCode');
const responseMessage = require('../constants/responseMessage');
const slackAPI = require('../middlewares/slackAPI');

const { userService } = require('../service');

module.exports = {
  getUsername: async (req, res) => {
    try {
      const { username } = req.query;

      const data = await userService.getUsername(username);

      return res
        .status(statusCode.OK)
        .send(util.success(statusCode.OK, responseMessage.READ_USER_NAME, data));
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
  },
  checkUsername: async (req, res) => {
    try {
      const { username } = req.body;

      if (!username)
        return res
          .status(statusCode.BAD_REQUEST)
          .send(util.fail(statusCode.BAD_REQUEST, responseMessage.NULL_VALUE));

      const data = await userService.getUsername(username);

      if (data) {
        return res
          .status(statusCode.CONFLICT)
          .send(util.fail(statusCode.CONFLICT, responseMessage.ALREADY_NICKNAME));
      }

      return res
        .status(statusCode.OK)
        .send(util.success(statusCode.OK, responseMessage.USEABLE_NICKNAME, data));
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
  },
};
