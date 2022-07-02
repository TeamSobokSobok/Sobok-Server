const functions = require('firebase-functions');
const util = require('../lib/util');
const statusCode = require('../constants/statusCode');
const responseMessage = require('../constants/responseMessage');
const slackAPI = require('../middlewares/slackAPI');
const { scheduleService } = require('../service');
const returnType = require('../constants/returnType');

/**
 * GET ~/schedule
 * 내 캘린더 조회
 * @private
 */
const getMyCalendar = async (req, res) => {
  try {
    const { user } = req.header;
    const { date } = req.query;

    if (!date)
      return res
        .status(statusCode.BAD_REQUEST)
        .send(util.fail(statusCode.BAD_REQUEST, responseMessage.NULL_VALUE));

    if (!user)
      return res
        .status(statusCode.UNAUTHORIZED)
        .send(util.fail(statusCode.UNAUTHORIZED, responseMessage.NO_USER));

    const myCalendar = await scheduleService.getMyCalendar(date, user.id);

    return res.status(myCalendar.status).json(myCalendar);
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

    res
      .status(statusCode.INTERNAL_SERVER_ERROR)
      .send(util.fail(statusCode.INTERNAL_SERVER_ERROR, responseMessage.INTERNAL_SERVER_ERROR));
  }
};

module.exports = {
  getMyCalendar,
  getMySchedule: async (req, res) => {
    try {
      const { user } = req.header;
      let { date } = req.query;

      if (!user || !date)
        return res
          .status(statusCode.BAD_REQUEST)
          .send(util.fail(statusCode.BAD_REQUEST, responseMessage.NULL_VALUE));

      const scheduleList = await scheduleService.getMySchedule(user, date);

      res
        .status(statusCode.OK)
        .send(util.success(statusCode.OK, responseMessage.READ_MEMBER_SCHEDULE, scheduleList));
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

      res
        .status(statusCode.INTERNAL_SERVER_ERROR)
        .send(util.fail(statusCode.INTERNAL_SERVER_ERROR, responseMessage.INTERNAL_SERVER_ERROR));
    }
  },
  getMemberCalendar: async (req, res) => {
    try {
      const { user } = req.header;
      const { memberId } = req.params;
      const { date } = req.query;

      if (!memberId || !date)
        return res
          .status(statusCode.BAD_REQUEST)
          .send(util.fail(statusCode.BAD_REQUEST, responseMessage.NULL_VALUE));

      const calendar = await scheduleService.getMemberCalendar(user, Number(memberId), date);

      // 캘린더 공유 수락 X
      if (calendar === returnType.WRONG_REQUEST_VALUE) {
        return res
          .status(statusCode.FORBIDDEN)
          .send(util.fail(statusCode.FORBIDDEN, responseMessage.NO_AUTHENTICATED));
      }

      return res
        .status(statusCode.OK)
        .send(util.success(statusCode.OK, responseMessage.READ_MEMBER_CALENDAR, calendar));
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
  getMemberSchedule: async (req, res) => {
    try {
      const { user } = req.header;
      const { memberId } = req.params;
      let { date } = req.query;

      if (!memberId || !date)
        return res
          .status(statusCode.BAD_REQUEST)
          .send(util.fail(statusCode.BAD_REQUEST, responseMessage.NULL_VALUE));

      const scheduleList = await scheduleService.getMemeberSchedule(user, Number(memberId), date);
      // 캘린더 공유 수락 X
      if (scheduleList === returnType.WRONG_REQUEST_VALUE) {
        return res
          .status(statusCode.FORBIDDEN)
          .send(util.fail(statusCode.FORBIDDEN, responseMessage.NO_AUTHENTICATED));
      }

      return res
        .status(statusCode.OK)
        .send(util.success(statusCode.OK, responseMessage.READ_MEMBER_SCHEDULE, scheduleList));
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
  checkSchedule: async (req, res) => {
    try {
      const { user } = req.header;
      const { scheduleId } = req.params;

      if (!scheduleId) {
        return res
          .status(statusCode.BAD_REQUEST)
          .send(util.fail(statusCode.BAD_REQUEST, responseMessage.NULL_VALUE));
      }

      const result = await scheduleService.checkSchedule(user, Number(scheduleId));

      if (result === returnType.DB_NOT_FOUND) {
        return res
          .status(statusCode.BAD_REQUEST)
          .send(util.fail(statusCode.BAD_REQUEST, responseMessage.OUT_OF_VALUE));
      }

      if (result === returnType.WRONG_REQUEST_VALUE) {
        return res
          .status(statusCode.FORBIDDEN)
          .send(util.fail(statusCode.FORBIDDEN, responseMessage.NO_AUTHENTICATED));
      }

      return res
        .status(statusCode.OK)
        .send(util.success(statusCode.OK, responseMessage.UPDATE_SCHEDULE_CHECK, result));
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
  unCheckSchedule: async (req, res) => {
    try {
      const { user } = req.header;
      const { scheduleId } = req.params;

      if (!scheduleId) {
        return res
          .status(statusCode.BAD_REQUEST)
          .send(util.fail(statusCode.BAD_REQUEST, responseMessage.NULL_VALUE));
      }

      const result = await scheduleService.unCheckSchedule(user, Number(scheduleId));

      if (result === returnType.DB_NOT_FOUND) {
        return res
          .status(statusCode.BAD_REQUEST)
          .send(util.fail(statusCode.BAD_REQUEST, responseMessage.OUT_OF_VALUE));
      }

      if (result === returnType.WRONG_REQUEST_VALUE) {
        return res
          .status(statusCode.FORBIDDEN)
          .send(util.fail(statusCode.FORBIDDEN, responseMessage.NO_AUTHENTICATED));
      }

      return res
        .status(statusCode.OK)
        .send(util.success(statusCode.OK, responseMessage.UPDATE_SCHEDULE_UNCHECK, result));
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
