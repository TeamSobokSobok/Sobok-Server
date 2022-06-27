const dayjs = require('dayjs');
const _ = require('lodash');
const convertSnakeToCamel = require('../lib/convertSnakeToCamel');

const getPillById = async (client, pillId) => {
  const { rows } = await client.query(
    `
    SELECT * FROM "pill"
    WHERE id = $1
    `,
    [pillId],
  );
  return convertSnakeToCamel.keysToCamel(rows);
};

const getPillCountById = async (client, userId) => {
  const { rows } = await client.query(
    `
    SELECT COUNT(user_id) FROM "pill"
    WHERE user_id = $1
    `,
    [userId],
  );
  return convertSnakeToCamel.keysToCamel(rows);
};

const acceptPillByPillId = async (client, receiverId, pillId) => {
  const { rows } = await client.query(
    `
    UPDATE pill
    SET user_id = $1
    WHERE id = $2 AND user_id is null
    `,
    [receiverId, pillId],
  );
  return convertSnakeToCamel.keysToCamel(rows);
};

const updatePillNameByPillId = async (client, pillId, pillName) => {
  const { rows } = await client.query(
    `
    UPDATE pill
    SET pill_name = $1
    WHERE id = $2
    `,
    [pillName, pillId],
  );
  return convertSnakeToCamel.keysToCamel(rows);
};

const getUserIdByPillId = async (client, pillId) => {
  const { rows } = await client.query(
    `
    SELECT user_id FROM pill
    WHERE id = $1
    `,
    [pillId],
  );
  return convertSnakeToCamel.keysToCamel(rows);
};

const deletePillByPillId = async (client, pillId) => {
  const { rows } = await client.query(
    `
    DELETE FROM pill
    WHERE id = $1
    `,
    [pillId],
  );
  return convertSnakeToCamel.keysToCamel(rows);
};

const stopPillByPillId = async (client, pillId) => {
  const { rows } = await client.query(
    `
    UPDATE pill
    SET is_stop = true
    WHERE id = $1
    `,
    [pillId],
  );
  return convertSnakeToCamel.keysToCamel(rows);
};

// CREATE

/**
 * addPill
 * 사용자 약 추가 쿼리문
 * @param pill_name 해당 약 아이디
 * @param userId 해당 약을 추가하는 유저 아이디
 * @param color 해당 약의 색상
 * @returns 추가된 약의 pillName
 */
const addPill = async (client, pillName, userId, color) => {
  try {
    const { rows } = await client.query(
      `
      INSERT INTO "pill" (pill_name, user_id, color)
      VALUES ($1, $2, $3)
      RETURNING id, pill_name
      `,
      [pillName, userId, color],
    );
    return convertSnakeToCamel.keysToCamel(rows[0]);
  } catch (error) {
    throw new Error('pillDao.addPill에서 오류 발생: ' + error);
  }
};

// READ

/**
 * getPillCount
 * 사용자의 약 개수 조회
 * @param userId 사용자 아이디
 */
const getPillCount = async (client, userId) => {
  try {
    const { rows } = await client.query(
      `
      SELECT COUNT(user_id) as pill_count
      FROM "pill"
      WHERE user_id = $1
      `,
      [userId],
    );
    return convertSnakeToCamel.keysToCamel(rows[0]);
  } catch (error) {
    throw new Error('pillDB.getPillCount에서 오류 발생: ' + error);
  }
};

/**
 * getPillInfo
 * 해당 약의 정보 조회
 * @param pillId 약 아이디
 */
const getPillInfo = async (client, pillId) => {
  try {
    const { rows } = await client.query(
      `
      SELECT DISTINCT pill_name, take_interval, schedule_time, start_date, end_date
      FROM pill JOIN schedule s on pill.id = s.pill_id
      WHERE pill_id = $1;
      `,
      [pillId],
    );
    return convertSnakeToCamel.keysToCamel(rows);
  } catch (error) {
    throw new Error('pillDB.getPillInfo에서 오류 발생: ' + error);
  }
}

// UPDATE
/**
 * acceptSendPill
 * 전송받은 약 수락
 * @param pillId 약 아이디
 */
const acceptSendPill = async (client, userId, pillId) => {
  try {
    const { rows } = await client.query(
      `
      UPDATE "pill"
      SET user_id = $1
      WHERE id = $2
      `,
      [userId, pillId],
    );
    return convertSnakeToCamel.keysToCamel(rows);
  } catch (error) {
    throw new Error('pillDB.acceptSendPill에서 오류 발생: ' + error);
  }
}

// DELETE

module.exports = {
  addPill,
  getPillCount,
  getPillInfo,
  getPillById,
  getPillCountById,
  acceptPillByPillId,
  updatePillNameByPillId,
  getUserIdByPillId,
  deletePillByPillId,
  stopPillByPillId,
  acceptSendPill,
};
