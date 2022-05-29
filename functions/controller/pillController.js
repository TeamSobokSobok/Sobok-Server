const { pillService } = require('../service');

const util = require('../lib/util');
const statusCode = require('../constants/statusCode');
const responseMessage = require('../constants/responseMessage');
const returnType = require('../constants/returnType');

/**
 * POST ~/pill
 * 약 추가하기
 * @private
 */
const addPill = async (req, res) => {
  try {
    const { user } = req.header;
    const { pillName, takeInterval, day, specific, time, start, end } = req.body;

    // 유저 정보가 헤더에 없는 경우
    if (!user) {
      return res
        .status(statusCode.FORBIDDEN)
        .json(util.fail(statusCode.FORBIDDEN, responseMessage.NO_AUTHENTICATED));
    }

    // 필요한 값이 없는 경우
    if (!pillName || !takeInterval || !time || !start || !end) {
      return res
        .status(statusCode.BAD_REQUEST)
        .json(util.fail(statusCode.BAD_REQUEST, responseMessage.NULL_VALUE));
    }

    // 약 추가 서비스
    const newPill = await pillService.addPill(
      pillName,
      user.id,
      takeInterval,
      day,
      specific,
      time,
      start,
      end,
    );
    if (newPill === returnType.PILL_COUNT_OVER) {
      return res
        .status(statusCode.BAD_REQUEST)
        .json(util.fail(statusCode.BAD_REQUEST, responseMessage.PILL_COUNT_OVER));
    }

    if (newPill === returnType.DB_NOT_FOUND) {
      return res
        .status(statusCode.DB_ERROR)
        .json(util.fail(statusCode.DB_ERROR, responseMessage.DB_ERROR));
    }

    return res.status(newPill.status).json(newPill);
  } catch (error) {
    console.log('addPill Controller 에러: ' + error);
    return res
      .status(statusCode.INTERNAL_SERVER_ERROR)
      .json(util.fail(statusCode.INTERNAL_SERVER_ERROR, responseMessage.INTERNAL_SERVER_ERROR));
  }
};

module.exports = {
  addPill,
};
