const functions = require('firebase-functions');
const util = require('../lib/util');
const statusCode = require('../constants/statusCode');
const responseMessage = require('../constants/responseMessage');
const slackAPI = require('../middlewares/slackAPI');
const { scheduleService } = require('../service');
const returnType = require('../constants/returnType');

/**
 *  @홈_캘린더_조회
 *  @route GET ~/schedule/calendar
 *  @access private
 *  @err 1. 유저 인증과정에 문제가 생긴 경우
 *       2. 조회할 달 데이터가 안넘어온 경우
 *       3. 해당 유저가 존재하지 않을 경우
 *       4. 서버 에러
 */

const getMyCalendar = async (req, res) => {
  try {
    const { user } = req.header;
    const { date } = req.query;

    // err 1.
    if (!user)
      return res
        .status(statusCode.UNAUTHORIZED)
        .send(util.fail(statusCode.UNAUTHORIZED, responseMessage.NO_AUTHENTICATED));

    // err 2.
    if (!date)
      return res
        .status(statusCode.BAD_REQUEST)
        .send(util.fail(statusCode.BAD_REQUEST, responseMessage.NULL_VALUE));

    const myCalendar = await scheduleService.getMyCalendar(user.id, date);

    // err 3.
    if (myCalendar === returnType.NON_EXISTENT_USER) {
      return res
        .status(statusCode.NOT_FOUND)
        .send(util.fail(statusCode.NOT_FOUND, responseMessage.NO_USER));
    }

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

/**
 *  @홈_날짜_상세스케줄_조회
 *  @route GET ~/schedule/detail
 *  @access private
 *  @err 1. 유저 인증과정에 문제가 생긴 경우
 *       2. 조회할 날짜 데이터가 안넘어온 경우
 *       3. 해당 유저가 존재하지 않을 경우
 *       4. 서버 에러
 */

const getMySchedule = async (req, res) => {
  try {
    const { user } = req.header;
    const { date } = req.query;

    // err 1.
    if (!user)
      return res
        .status(statusCode.UNAUTHORIZED)
        .send(util.fail(statusCode.UNAUTHORIZED, responseMessage.NO_AUTHENTICATED));

    // err 2.
    if (!date)
      return res
        .status(statusCode.BAD_REQUEST)
        .send(util.fail(statusCode.BAD_REQUEST, responseMessage.NULL_VALUE));

    const mySchedule = await scheduleService.getMySchedule(user.id, date);

    // err 3.
    if (mySchedule === returnType.NON_EXISTENT_USER) {
      return res
        .status(statusCode.NOT_FOUND)
        .send(util.fail(statusCode.NOT_FOUND, responseMessage.NO_USER));
    }

    return res.status(mySchedule.status).json(mySchedule);
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

/**
 * GET /schedule/:memberId/calendar
 * member 캘린더 조회
 * @private
 */
const getMemberCalendar = async (req, res) => {
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
};

/**
 * GET /schedule/:memberId/detail
 * member schedule 조회
 * @private
 */
const getMemberSchedule = async (req, res) => {
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
};

/**
 * PUT /schedule/check/:scheduleId
 * update schedule
 * @private
 */
const checkSchedule = async (req, res) => {
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
};

/**
 * PUT /schedule/uncheck/:scheduleId
 * update schedule
 * @private
 */
const unCheckSchedule = async (req, res) => {
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
};

module.exports = {
  getMyCalendar,
  getMySchedule,
  getMemberCalendar,
  getMemberSchedule,
  checkSchedule,
  unCheckSchedule,
};
