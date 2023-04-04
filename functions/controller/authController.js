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
 *       3. 닉네임이 중복됐을 때
 */

const signUp = async (req, res) => {
  try {
    const { socialId, username, deviceToken } = req.body;
    const deviceOS = req.query;

    // @err 1. 필요한 값이 없을 때
    if (!socialId || !username || !deviceToken || !deviceOS)
      return res
        .status(statusCode.BAD_REQUEST)
        .send(util.fail(statusCode.BAD_REQUEST, responseMessage.NULL_VALUE));

    const newUser = await authService.signUp(socialId, username, deviceToken, deviceOS);

    // @err 2. 이미 존재하는 socialId
    if (newUser === returnType.VALUE_ALREADY_EXIST) {
      return res
        .status(statusCode.BAD_REQUEST)
        .send(util.fail(statusCode.BAD_REQUEST, responseMessage.ALREADY_SOCIALID));
    }

    // @err 3. 닉네임이 중복됐을 때
    if (newUser === returnType.NICKNAME_ALREADY_EXIST) {
      return res
        .status(statusCode.BAD_REQUEST)
        .send(util.fail(statusCode.BAD_REQUEST, responseMessage.ALREADY_NICKNAME));
    }

    // @err 4. 닉네임 형식이 잘못되었을 경우
    if (newUser === returnType.WRONG_NICKNAME_CONVENTION) {
      return res
        .status(statusCode.BAD_REQUEST)
        .send(util.fail(statusCode.BAD_REQUEST, responseMessage.WRONG_USERNAME_CONVENTION));
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
 *  @회원가입_로그인_분기처리
 *  @route GET /auth/signin?socialId=&deviceToken=
 *  @access public
 *  @err 1. 필요한 값이 없을 때
 *       2. 신규 사용자일 때
 */

const signIn = async (req, res) => {
  try {
    const socialId = req.headers.socialid;
    const deviceToken = req.headers.devicetoken;
    const deviceOS = req.query;

    console.log(deviceOS);

    //  @err 1. 필요한 값이 없을 때
    if (!socialId || !deviceToken || !deviceOS)
      return res
        .status(statusCode.BAD_REQUEST)
        .send(util.fail(statusCode.BAD_REQUEST, responseMessage.NULL_VALUE));

    const user = await authService.singIn(socialId, deviceToken, deviceOS);

    // 2. 신규 사용자일 때
    if (user === returnType.NON_EXISTENT_USER) {
      return res.status(statusCode.OK).send(
        util.success(statusCode.OK, responseMessage.NOT_SIGNED_UP, {
          accessToken: null,
          isNew: true,
        }),
      );
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

/**
 *  @로그아웃
 *  @route POST /auth/logout
 *  @access public
 *  @err 1. 필요한 값이 없을 때
 *       2. 이미 존재하는 socialId
 *       3. 패스워드 형식이 올바르지 않을 때
 */

const logout = async (req, res) => {
  try {
    const { user } = req.header;

    await authService.logout(user);

    return res
      .status(statusCode.OK)
      .send(util.success(statusCode.OK, responseMessage.LOGOUT_SUCCESS));
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
 *  @탈퇴하기
 *  @route POST /auth/user/leave
 *  @access public
 *  @err 1. 필요한 값이 없을 때
 *       2. 이미 존재하는 socialId
 *       3. 패스워드 형식이 올바르지 않을 때
 */

const deleteUser = async (req, res) => {
  try {
    const { user } = req.header;
    const { text } = req.body;

    await authService.deleteUser(user, text);

    return res.status(statusCode.OK).send(util.success(statusCode.OK, responseMessage.DELETE_USER));
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
  logout,
  deleteUser,
};
