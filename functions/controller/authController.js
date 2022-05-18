const functions = require('firebase-functions');
const util = require('../lib/util');
const statusCode = require('../constants/statusCode');
const responseMessage = require('../constants/responseMessage');

const { authService } = require('../service');

/**
 *  @로그인
 *  @route POST /auth/login/email
 *  @access public
 *  @err 1. 필요한 값이 없을 때
 *       2. 존재하지 않는 사용자일 때
 *       3. 이메일 형식이 잘못되었을 때
 *       4. 비밀번호가 일치하지 않을 때
 */
const authEmail = async (req, res) => {
  try {
    const { email, password } = req.body;

    // @err 1. 필요한 값이 없을 때
    if (!email || !password) {
      return res
        .status(statusCode.BAD_REQUEST)
        .send(util.fail(statusCode.BAD_REQUEST, responseMessage.NULL_VALUE));
    }

    const login = await authService.authEmail(email, password);

    // @err 2. 존재하지 않는 사용자일 때
    if (login === responseMessage.NO_USER) {
      return res
        .status(statusCode.OK)
        .send(util.success(statusCode.NO_CONTENT, responseMessage.NO_USER));
    }

    // @err 3. 이메일 형식이 잘못되었을 때
    if (login === responseMessage.WRONG_EMAIL_CONVENTION) {
      return res
        .status(statusCode.OK)
        .send(util.success(statusCode.OK, responseMessage.INVALID_EMAIL));
    }

    // @err  4. 비밀번호가 일치하지 않을 때
    if (login === responseMessage.MISS_MATCH_PW) {
      return res
        .status(statusCode.BAD_REQUEST)
        .send(util.fail(statusCode.BAD_REQUEST, responseMessage.MISS_MATCH_PW));
    }

    return res
      .status(statusCode.OK)
      .send(util.success(statusCode.OK, responseMessage.LOGIN_SUCCESS, login));
  } catch (error) {
    console.log(error);
    functions.logger.error(
      `[EMAIL LOGIN ERROR] [${req.method.toUpperCase()}] ${req.originalUrl}`,
      `[CONTENT] email:${email} ${error}`,
    );

    return res
      .status(statusCode.INTERNAL_SERVER_ERROR)
      .send(util.fail(statusCode.INTERNAL_SERVER_ERROR, responseMessage.INTERNAL_SERVER_ERROR));
  }
};

/**
 *  @회원가입
 *  @route POST /auth
 *  @access public
 *  @err 1. 필요한 값이 없을 때
 *       2. 이메일이 이미 존재할 때
 *       3. 패스워드 형식이 올바르지 않을 때
 */
const signUp = async (req, res) => {
  try {
    const { email, nickname, password } = req.body;

    // @err 1. 필요한 값이 없을 때
    if (!email || !nickname || !password) {
      return res
        .status(statusCode.BAD_REQUEST)
        .send(util.fail(statusCode.BAD_REQUEST, responseMessage.NULL_VALUE));
    }

    const newUser = await authService.signUp(email, nickname, password);

    // @err 2. 이메일이 이미 존재할 때
    if (newUser === responseMessage.ALREADY_EMAIL) {
      return res
        .status(statusCode.BAD_REQUEST)
        .send(util.fail(statusCode.BAD_REQUEST, responseMessage.ALREADY_EMAIL));
    }

    // @err 3. 패스워드 형식이 올바르지 않을 때
    if (newUser === responseMessage.WRONG_PASSWORD_CONVENTION) {
      return res
        .status(statusCode.BAD_REQUEST)
        .send(util.fail(statusCode.BAD_REQUEST, responseMessage.WRONG_PASSWORD_CONVENTION));
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

module.exports = {
  authEmail,
  signUp,
};
