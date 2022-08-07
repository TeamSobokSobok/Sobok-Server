const functions = require('firebase-functions');
const util = require('../lib/util');
const statusCode = require('../constants/statusCode');
const responseMessage = require('../constants/responseMessage');
const slackAPI = require('../middlewares/slackAPI');
const { noticeService, pillService } = require('../service');
const returnType = require('../constants/returnType');

/**
 *  @그룹_멤버_이름_수정
 *  @route PUT /group/:groupId/name
 *  @access private
 *  @err 1. 필요한 값이 없을 때
 *       2. 존재하지 않는 그룹일 때
 *       3. 권한이 없을 떼
 */
const updateMemberName = async (req, res) => {
  try {
    const { user } = req.header;
    const { groupId } = req.params;
    const { memberName } = req.body;

    // @err 1. 필요한 값이 없을 때
    if (!groupId || !memberName)
      return res
        .status(statusCode.BAD_REQUEST)
        .send(util.fail(statusCode.BAD_REQUEST, responseMessage.NULL_VALUE));

    const data = await noticeService.updateMemberName(user, Number(groupId), memberName);

    // @err 2. 존재하지 않는 그룹일 때
    if (data === returnType.DB_NOT_FOUND) {
      return res
        .status(statusCode.BAD_REQUEST)
        .send(util.fail(statusCode.BAD_REQUEST, responseMessage.OUT_OF_VALUE));
    }

    // @err 3. 권한이 없을 떼
    if (data === returnType.WRONG_REQUEST_VALUE) {
      return res
        .status(statusCode.FORBIDDEN)
        .send(util.fail(statusCode.FORBIDDEN, responseMessage.NO_AUTHENTICATED));
    }

    return res
      .status(statusCode.OK)
      .send(util.success(statusCode.OK, responseMessage.UPDATE_MEMBER_NAME, data));
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
 *  @그룹_멤버_요청상태_수정
 *  @route PUT /group/:sendGroupId
 *  @access private
 *  @err 1. 필요한 값이 없을 때
 *       2. 존재하지 않는 그룹일 때
 *       3. 권한이 없을 떼
 */
const updateIsOkay = async (req, res) => {
  try {
    const { user } = req.header;
    const { sendGroupId } = req.params;
    const { isOkay } = req.body;

    // @err 1. 필요한 값이 없을 때
    if (!sendGroupId || !isOkay)
      return res
        .status(statusCode.BAD_REQUEST)
        .send(util.fail(statusCode.BAD_REQUEST, responseMessage.NULL_VALUE));

    const data = await noticeService.updateIsOkay(user, sendGroupId, isOkay);

    // @err 2. 존재하지 않는 그룹일 때
    if (data === returnType.DB_NOT_FOUND) {
      return res
        .status(statusCode.BAD_REQUEST)
        .send(util.fail(statusCode.BAD_REQUEST, responseMessage.OUT_OF_VALUE));
    }

    // @err 3. 권한이 없을 떼
    if (data === returnType.WRONG_REQUEST_VALUE) {
      return res
        .status(statusCode.FORBIDDEN)
        .send(util.fail(statusCode.FORBIDDEN, responseMessage.NO_AUTHENTICATED));
    }

    return res
      .status(statusCode.OK)
      .send(util.success(statusCode.OK, responseMessage.UPDATE_SEND_GROUP, data));
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
 *  @그룹_멤버들_불러오기
 *  @route GET /group
 *  @access private
 *  @err
 */
const getMember = async (req, res) => {
  try {
    const user = req.header.user;

    const memberList = await noticeService.getMember(user);

    return res
      .status(statusCode.OK)
      .send(util.success(statusCode.OK, responseMessage.READ_ALL_GROUP, memberList));
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
 *  @그룹_멤버_요청하기
 *  @route POST /group
 *  @access private
 *  @err 1. 필요한 값이 없을 때
 *       2. 자신한테 공유 요청했을 때
 *       3. 요청하려는 사용자가 없을 때
 *       4. 이미 요청된 사용자일 때
 */
const sendGroup = async (req, res) => {
  try {
    const { user } = req.header;
    const { memberId } = req.query;
    const { memberName } = req.body;

    // @err 1. 필요한 값이 없을 때
    if (!memberId || !memberName)
      return res
        .status(statusCode.BAD_REQUEST)
        .send(util.fail(statusCode.BAD_REQUEST, responseMessage.NULL_VALUE));

    const data = await noticeService.sendGroup(user, memberId, memberName);

    // @err 2. 자신한테 공유 요청했을 때
    if (data === returnType.WRONG_REQUEST_VALUE) {
      return res
        .status(statusCode.BAD_REQUEST)
        .send(util.fail(statusCode.BAD_REQUEST, responseMessage.ENABLE_SEND_GROUP));
    }
    // @err 3. 요청하려는 사용자가 없을 때
    if (data === returnType.DB_NOT_FOUND) {
      return res
        .status(statusCode.BAD_REQUEST)
        .send(util.fail(statusCode.BAD_REQUEST, responseMessage.NO_USER));
    }

    // @err 4. 이미 요청된 사용자일 때
    if (data === returnType.ALREADY_SEND_GROUP) {
      return res
        .status(statusCode.BAD_REQUEST)
        .send(util.fail(statusCode.BAD_REQUEST, responseMessage.ALREADY_SEND_GROUP));
    }

    return res
      .status(statusCode.OK)
      .send(util.success(statusCode.OK, responseMessage.CREATED_SEND_GROUP, data));
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
 *  @약_알림_상세조회
 *  @route GET /notice/list/:pillId
 *  @access private
 *  @err 1. 해당 약이 존재하지 않을 경우
 */
const getPillInfo = async (req, res) => {
  try {
    const { pillId } = req.params;

    const pillInfo = await noticeService.getPillInfo(pillId);
    if (pillInfo === returnType.NON_EXISTENT_PILL) {
      return res
        .status(statusCode.BAD_REQUEST)
        .json(util.fail(statusCode.BAD_REQUEST, responseMessage.NO_PILL));
    }

    return res.status(pillInfo.status).json(pillInfo);
  } catch (error) {
    console.log('getPillInfo Controller 에러: ' + error);
    return res
      .status(statusCode.INTERNAL_SERVER_ERROR)
      .json(util.fail(statusCode.INTERNAL_SERVER_ERROR, responseMessage.INTERNAL_SERVER_ERROR));
  }
};

/**
 * @알림_리스트_전체_조회
 * @route ~/notice/list
 * @access private
 * @err 1. 헤더에 유저 정보가 잘못되었을 때
 */
const getNoticeList = async (req, res) => {
  try {
    const { user } = req.header;

    // 유저 정보가 헤더에 없는 경우
    if (!user) {
      return res
        .status(statusCode.FORBIDDEN)
        .json(util.fail(statusCode.FORBIDDEN, responseMessage.NO_AUTHENTICATED));
    }

    const noticeList = await noticeService.getNoticeList(user.id);

    return res.status(noticeList.status).json(noticeList);
  } catch (error) {
    console.log('getNoticeList Controller 에러: ' + error);
    return res
      .status(statusCode.INTERNAL_SERVER_ERROR)
      .json(util.fail(statusCode.INTERNAL_SERVER_ERROR, responseMessage.INTERNAL_SERVER_ERROR));
  }
};

/**
 * @약_상태_업데이트
 * @route ~/notice/list/:pillId
 * @access private
 * @err 1. 헤더에 유저 정보가 잘못되었을 때
 *      2. 입력값이 잘못 되었을 때
 *      3. 해당 약의 주인이 아닐 때
 *      4. 이미 처리된 약일 때
 */
const updateSendPill = async (req, res) => {
  try {
    const { user } = req.header;
    const { pillId } = req.params;
    const { isOkay } = req.body;

    // 유저 정보가 헤더에 없는 경우
    if (!user) {
      return res
        .status(statusCode.FORBIDDEN)
        .json(util.fail(statusCode.FORBIDDEN, responseMessage.NO_AUTHENTICATED));
    }

    const updateSendPill = await noticeService.updateSendPill(user.id, pillId, isOkay);
    // 잘못된 값이 들어왔을 때
    if (updateSendPill === returnType.WRONG_REQUEST_VALUE) {
      return res
        .status(statusCode.BAD_REQUEST)
        .json(statusCode.BAD_REQUEST, responseMessage.WRONG_PILL_STATE);
    }

    // 약 개수 초과시
    if (updateSendPill === returnType.PILL_COUNT_OVER) {
      return res
        .status(statusCode.BAD_REQUEST)
        .json(util.fail(statusCode.BAD_REQUEST, responseMessage.PILL_COUNT_OVER));
    }

    // 해당 약의 주인이 아닐 때
    if (updateSendPill === returnType.NO_PILL_USER) {
      return res
        .status(statusCode.UNAUTHORIZED)
        .json(util.fail(statusCode.UNAUTHORIZED, responseMessage.PILL_UNAUTHORIZED));
    }

    // 이미 처리된 약일 때
    if (updateSendPill === returnType.ALREADY_COMPLETE) {
      return res
        .status(statusCode.BAD_REQUEST)
        .json(util.fail(statusCode.BAD_REQUEST, responseMessage.ALREADY_PILL_ACCEPT));
    }

    return res.status(updateSendPill.status).json(updateSendPill);
  } catch (error) {
    console.log('updateSendPill Controller 에러: ' + error);
    return res
      .status(statusCode.INTERNAL_SERVER_ERROR)
      .json(util.fail(statusCode.INTERNAL_SERVER_ERROR, responseMessage.INTERNAL_SERVER_ERROR));
  }
};

module.exports = {
  updateMemberName,
  updateIsOkay,
  getMember,
  sendGroup,
  getPillInfo,
  getNoticeList,
  updateSendPill,
};
