const db = require('../db/db');
const { pillDao } = require('../db');

const util = require('../lib/util');
const statusCode = require('../constants/statusCode');
const responseMessage = require('../constants/responseMessage');

/**
 * addPill
 * 약 추가 및 스케줄 생성 서비스
 * @param pillName - 추가할 약의 이름
 * @param userId - 약을 추가한 유저의 아이디
 */
const addPill = async (pillName, userId) => {
  let client;
  const log = `pillDao.addPill | pillName = ${pillName}, userId = ${userId}`;

  try {
    client = await db.connect(log);
    await client.query('BEGIN');

    // 현재 유저의 약 개수 반환
    const pills = await pillDao.getPillCount(client, userId);
    const pillCount = Number(pills.count) + pillName.length;
    if (pillCount > 5) {
      return util.fail(statusCode.BAD_REQUEST, responseMessage.PILL_COUNT_OVER);
    }

    // 약 추가 쿼리 실행
    let newPill = [];
    for (let nameLoop = 0; nameLoop < pillName.length; nameLoop++) {
      // 랜덤 컬러 생성
      const color = Math.floor(Math.random() * 5 + 1);

      newPill.push(await pillDao.addPill(client, pillName[nameLoop], userId, color));
    }
    if (!newPill) throw new Error('addPill 약 추가 중 오류 발생');

    await client.query('COMMIT');

    return util.success(statusCode.CREATED, responseMessage.PILL_ADDITION_SUCCESS, newPill);
  } catch (error) {
    console.error('addPill error 발생: ' + error);
    await client.query('ROLLBACK');
  } finally {
    client.release();
  }
};

module.exports = {
  addPill,
};
