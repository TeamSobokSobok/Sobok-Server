const functions = require('firebase-functions');
const util = require('../lib/util');
const statusCode = require('../constants/statusCode');
const responseMessage = require('../constants/responseMessage');
const slackAPI = require('../middlewares/slackAPI');

const { userService } = require('../service');
const returnType = require('../constants/returnType');

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

      if (data.length !== 0) {
        return res
          .status(statusCode.CONFLICT)
          .send(util.fail(statusCode.CONFLICT, responseMessage.ALREADY_NICKNAME));
      }

      return res
        .status(statusCode.OK)
        .send(util.success(statusCode.OK, responseMessage.USEABLE_NICKNAME));
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

  updateUsername: async (req, res) => {
    try {
      const { user } = req.header;
      const { username } = req.body;

      if (!user)
        return res
          .status(statusCode.UNAUTHORIZED)
          .send(util.fail(statusCode.UNAUTHORIZED, responseMessage.TOKEN_EMPTY));

      if (!username)
        return res
          .status(statusCode.BAD_REQUEST)
          .send(util.fail(statusCode.BAD_REQUEST, responseMessage.NULL_VALUE));

      const data = await userService.updateUsername(user.id, username);
      if (data === returnType.NICKNAME_ALREADY_EXIST)
        return res
          .status(statusCode.CONFLICT)
          .send(util.fail(statusCode.CONFLICT, responseMessage.ALREADY_NICKNAME));

      if (data === returnType.WRONG_NICKNAME_CONVENTION)
        return res
          .status(statusCode.BAD_REQUEST)
          .send(util.fail(statusCode.BAD_REQUEST, responseMessage.WRONG_USERNAME_CONVENTION));

      return res
        .status(statusCode.OK)
        .send(util.success(statusCode.OK, responseMessage.UPDATE_NICKNAME));
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

  getPillList: async (req, res) => {
    try {
      const { user } = req.header;

      if (!user)
        return res
          .status(statusCode.UNAUTHORIZED)
          .send(util.fail(statusCode.UNAUTHORIZED, responseMessage.NO_USER));

      const data = await userService.getUserPillList(user.id);

      return res
        .status(statusCode.OK)
        .send(util.success(statusCode.OK, responseMessage.READ_PILL_LIST, data));
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

  getPill: async (req, res) => {
    try {
      const { user } = req.header;
      const { pillId } = req.params;

      if (!user)
        return res
          .status(statusCode.UNAUTHORIZED)
          .send(util.fail(statusCode.UNAUTHORIZED, responseMessage.NO_USER));

      const data = await userService.getUserPillInfo(user.id, pillId);

      if (data === returnType.NON_EXISTENT_USER)
        return res
          .status(statusCode.NOT_FOUND)
          .send(util.fail(statusCode.NOT_FOUND, responseMessage.NO_USER));

      return res
        .status(statusCode.OK)
        .send(util.success(statusCode.OK, responseMessage.READ_PILL, data));
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
