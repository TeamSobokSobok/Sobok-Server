const functions = require('firebase-functions');
const util = require('../lib/util');
const statusCode = require('../constants/statusCode');
const responseMessage = require('../constants/responseMessage');
const slackAPI = require('../middlewares/slackAPI');

const { userService } = require('../service');
const returnType = require('../constants/returnType');

/**
 *  @닉네임_수정
 *  @route PUT /user/nickname
 *  @access public
 *  @err 1. 유저 인증과정에 문제가 생긴 경우
 *       2. request body에 해당 값이 없는 경우
 *       3. 닉네임의 형식에 맞지 않는 경우
 *       4. 이미 사용중인 닉네임일 경우
 *       5. 해당 유저가 존재하지 않을 경우
 *       6. 서버 에러
 */
const updateUsername = async (req, res) => {
  try {
    const { user } = req.header;
    const { username } = req.body;

    // err 1.
    if (!user)
      return res
        .status(statusCode.UNAUTHORIZED)
        .send(util.fail(statusCode.UNAUTHORIZED, responseMessage.NO_AUTHENTICATED));

    // err 2.
    if (!username)
      return res
        .status(statusCode.BAD_REQUEST)
        .send(util.fail(statusCode.BAD_REQUEST, responseMessage.NULL_VALUE));

    const data = await userService.updateUsername(user.id, username);

    // err 3.
    if (data === returnType.WRONG_NICKNAME_CONVENTION)
      return res
        .status(statusCode.BAD_REQUEST)
        .send(util.fail(statusCode.BAD_REQUEST, responseMessage.WRONG_USERNAME_CONVENTION));

    // err 4.
    if (data === returnType.NICKNAME_ALREADY_EXIST)
      return res
        .status(statusCode.CONFLICT)
        .send(util.fail(statusCode.CONFLICT, responseMessage.ALREADY_NICKNAME));

    // err 5.
    if (data === returnType.NON_EXISTENT_USER)
      return res
        .status(statusCode.UNAUTHORIZED)
        .send(util.fail(statusCode.UNAUTHORIZED, responseMessage.NO_USER));

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

    // err 6.
    return res
      .status(statusCode.INTERNAL_SERVER_ERROR)
      .send(util.fail(statusCode.INTERNAL_SERVER_ERROR, responseMessage.INTERNAL_SERVER_ERROR));
  }
};

/**
 *  @유저_약_목록조회
 *  @route GET /user/pill
 *  @access private
 *  @err 1. 유저 인증과정에 문제가 생긴 경우
 *       2. 해당 유저가 존재하지 않을 경우
 *       3. 서버 에러
 */
const getPillList = async (req, res) => {
  try {
    const { user } = req.header;

    // err 1.
    if (!user) {
      return res
        .status(statusCode.UNAUTHORIZED)
        .send(util.fail(statusCode.UNAUTHORIZED, responseMessage.NO_AUTHENTICATED));
    }

    const data = await userService.getUserPillList(user.id);

    // err 2.
    if (data === returnType.NON_EXISTENT_USER) {
      return res
        .status(statusCode.NOT_FOUND)
        .send(util.fail(statusCode.NOT_FOUND, responseMessage.NO_USER));
    }

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
};

/**
 *  @유저_약_상세조회
 *  @route GET /user/pill/:pillId
 *  @access private
 *  @err 1. 유저 인증과정에 문제가 생긴 경우
 *       2. 해당 유저가 존재하지 않을 경우
 *       3. 해당 약의 유저가 아닐 경우
 *       4. 서버 에러
 */
const getPillInformation = async (req, res) => {
  try {
    const { user } = req.header;
    const { pillId } = req.params;

    // err 1.
    if (!user) {
      return res
        .status(statusCode.UNAUTHORIZED)
        .send(util.fail(statusCode.UNAUTHORIZED, responseMessage.NO_USER));
    }

    const data = await userService.getUserPillInfo(user.id, pillId);

    // err 2.
    if (data === returnType.NON_EXISTENT_USER) {
      return res
        .status(statusCode.NOT_FOUND)
        .send(util.fail(statusCode.NOT_FOUND, responseMessage.NO_USER));
    }

    // err 3.
    if (data === returnType.NO_PILL_USER) {
      return res
        .status(statusCode.UNAUTHORIZED)
        .send(util.fail(statusCode.UNAUTHORIZED, responseMessage.NO_PILL_USER));
    }

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
};

/**
 *  @닉네임_중복체크
 *  @route POST /user/name
 *  @access public
 *  @err 1. request body에 해당 값이 없는 경우
 *       2. 이미 사용중인 닉네임일 경우
 */
const checkUsername = async (req, res) => {
  try {
    const { username } = req.body;

    // err1.
    if (!username)
      return res
        .status(statusCode.BAD_REQUEST)
        .send(util.fail(statusCode.BAD_REQUEST, responseMessage.NULL_VALUE));

    const data = await userService.checkUsername(username);

    // err2.
    if (data === returnType.NICKNAME_ALREADY_EXIST)
      return res
        .status(statusCode.CONFLICT)
        .send(util.fail(statusCode.CONFLICT, responseMessage.ALREADY_NICKNAME));

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
};

module.exports = {
  getPillList,
  getPillInformation,
  updateUsername,
  checkUsername,
  getUsername: async (req, res) => {
    try {
      const { username } = req.query;
      const { user } = req.header;

      const data = await userService.getUsername(user.id, username);

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
  getUserInfo: async (req, res) => {
    const user = req.header.user;

    if (!user) {
      return res
        .status(statusCode.BAD_REQUEST)
        .send(util.fail(statusCode.BAD_REQUEST, responseMessage.NO_AUTHENTICATED));
    }

    const data = { username: user.username };

    return res
      .status(statusCode.OK)
      .send(util.success(statusCode.OK, responseMessage.READ_USER_INFO, data));
  },
  isCalendarShare: async (req, res) => {
    try {
      const { user } = req.header;
      const { memberId } = req.params;

      if (!user)
        return res
          .status(statusCode.UNAUTHORIZED)
          .send(util.fail(statusCode.UNAUTHORIZED, responseMessage.NO_USER));

      if (!memberId)
        return res
          .status(statusCode.BAD_REQUEST)
          .send(util.fail(statusCode.BAD_REQUEST, responseMessage.NULL_VALUE));

      const isShare = await userService.isCalendarShare(user.id, memberId);
      console.log(isShare);
      if (isShare === true) {
        return res.status(statusCode.OK, responseMessage.ALREADY_GROUP, isShare);
      }

      return res
        .status(statusCode.OK)
        .send(util.success(statusCode.OK, responseMessage.READ_GROUP_STATUS, isShare));
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
