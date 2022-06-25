const functions = require('firebase-functions');
const util = require('../lib/util');
const statusCode = require('../constants/statusCode');
const responseMessage = require('../constants/responseMessage');

const { authService } = require('../service');
const returnType = require('../constants/returnType');

/**
 *  @회원가입
 *  @route POST /auth/signup
 *  @access public
 *  @err 1. 필요한 값이 없을 때
 *       2. 이미 존재하는 socialId
 *       3. 패스워드 형식이 올바르지 않을 때
 */

const signUp = async (req, res) => {
  try {
    const { socialId, email, username } = req.body;

    // @err 1. 필요한 값이 없을 때
    if (!socialId || !email || !username)
      return res
        .status(statusCode.BAD_REQUEST)
        .send(util.fail(statusCode.BAD_REQUEST, responseMessage.NULL_VALUE));

    const newUser = await authService.signUp(socialId, email, username);

    // @err 2. 이미 존재하는 socialId
    if (newUser === returnType.VALUE_ALREADY_EXIST) {
      return res
        .status(statusCode.BAD_REQUEST)
        .send(util.fail(statusCode.BAD_REQUEST, responseMessage.ALREADY_SOCIALID));
    }

    return res
      .status(statusCode.OK)
      .send(util.success(statusCode.OK, responseMessage.CREATED_USER, newUser));
  } catch (error) {
    functions.logger.error(
      `[ERROR] [${req.method.toUpperCase()}] ${req.originalUrl}`,
      `[CONTENT] ${error}`,
    );
    console.log(error);

    res
      .status(statusCode.INTERNAL_SERVER_ERROR)
      .send(util.fail(statusCode.INTERNAL_SERVER_ERROR, responseMessage.INTERNAL_SERVER_ERROR));
  }
};

/**
 *  @로그인
 *  @route GET /auth/signin
 *  @access public
 *  @err 1. 필요한 값이 없을 때
 *       2. 신규 사용자일 때
 */

const signIn = async (req, res) => {
  try {
    const { socialId } = req.body;

    //  @err 1. 필요한 값이 없을 때
    if (!socialId)
      return res
        .status(statusCode.BAD_REQUEST)
        .send(util.fail(statusCode.BAD_REQUEST, responseMessage.NULL_VALUE));

    const user = await authService.singIn(socialId);

    // 2. 신규 사용자일 때
    if (user === returnType.NON_EXISTENT_USER) {
      return res
        .status(statusCode.OK)
        .send(util.success(statusCode.OK, responseMessage.NOT_SIGNED_UP, { isNew: true }));
    }

    return res
      .status(statusCode.OK)
      .send(util.success(statusCode.OK, responseMessage.LOGIN_SUCCESS, user));
  } catch (error) {
    functions.logger.error(
      `[ERROR] [${req.method.toUpperCase()}] ${req.originalUrl}`,
      `[CONTENT] ${error}`,
    );
    console.log(error);

    res
      .status(statusCode.INTERNAL_SERVER_ERROR)
      .send(util.fail(statusCode.INTERNAL_SERVER_ERROR, responseMessage.INTERNAL_SERVER_ERROR));
  }
};

module.exports = {
  signUp,
  signIn,
};
