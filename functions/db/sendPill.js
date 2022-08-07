const dayjs = require('dayjs');
const _ = require('lodash');
const convertSnakeToCamel = require('../lib/convertSnakeToCamel');

// CREATE
const addSendPill = async (client, pillId, noticeId) => {
  const { rows } = await client.query(
    `
    INSERT INTO "send_pill"
    (pill_id, notice_id)
    VALUES
    ($1, $2)
    `,
    [pillId, noticeId],
  );
  return convertSnakeToCamel.keysToCamel(rows[0]);
};

// READ
const getReceiverNameById = async (client, receiverId) => {
  const { rows } = await client.query(
    `
    SELECT DISTINCT u.username, s.receiver_id FROM send_pill as s
    LEFT JOIN "user" u on u.id = s.receiver_id
    WHERE s.receiver_id = $1
    `,
    [receiverId],
  );
  return convertSnakeToCamel.keysToCamel(rows);
};

const getUserIdByPillId = async (client, pillId) => {
  const { rows } = await client.query(
    `
    SELECT receiver_id FROM send_pill
    WHERE pill_id = $1 AND is_okay is null
    `,
    [pillId],
  );
  return convertSnakeToCamel.keysToCamel(rows);
};

const getsendPillByCreatedAt = async (client, senderId, receiverId, createdAt) => {
  const { rows } = await client.query(
    `
    SELECT *
    FROM send_pill
    WHERE sender_id = $1 AND receiver_id = $2 AND created_at = $3;
    `,
    [senderId, receiverId, createdAt],
  );
  return convertSnakeToCamel.keysToCamel(rows);
};

const getSenderIdByReceiverId = async (client, receiverId) => {
  const { rows } = await client.query(
    `
    SELECT DISTINCT sender_id, receiver_id, is_okay, is_send, created_at, updated_at
    FROM send_pill
    WHERE receiver_id = $1
    `,
    [receiverId],
  );
  return convertSnakeToCamel.keysToCamel(rows);
};

const getIsOkayByPillId = async (client, pillId) => {
  const { rows } = await client.query(
    `
    SELECT is_okay FROM send_pill
    WHERE pill_id = $1
    `,
    [pillId],
  );
  return convertSnakeToCamel.keysToCamel(rows);
};

const findSendPillInfo = async (client, userId) => {
  try {
    const { rows } = await client.query(
      `
      SELECT notice_id, section, is_okay, is_send, n.created_at as created_at, username as sender_name, pill_name, pill_id
      FROM notice as n JOIN send_pill sp on n.id = sp.notice_id JOIN "user" u on u.id = n.sender_id JOIN pill p on p.id = sp.pill_id
      WHERE n.user_id = $1
      `,
      [userId],
    );
    return convertSnakeToCamel.keysToCamel(rows);
  } catch (error) {
    throw new Error('sendPillDB.findSendPillInfo에서 오류 발생: ' + error);
  }
};

const getSendPillUser = async (client, pillId) => {
  try {
    const { rows } = await client.query(
      `
      SELECT pill_id, is_okay, user_id, sender_id
      FROM send_pill as sp JOIN notice n on n.id = sp.notice_id
      WHERE pill_id = $1;
      `,
      [pillId],
    );
    return convertSnakeToCamel.keysToCamel(rows[0]);
  } catch (error) {
    throw new Error('sendPillDB.getSendPillUser에서 오류 발생: ' + error);
  }
};

// UPDATE
const updateSendPillByPillId = async (client, pillId, isOkay) => {
  const now = dayjs().add(9, 'hour');
  const { rows } = await client.query(
    `
    UPDATE send_pill
    SET is_okay = $1, updated_at = $3
    WHERE pill_id = $2
    `,
    [isOkay, pillId, now],
  );
  return convertSnakeToCamel.keysToCamel(rows);
};

const updateSendPill = async (client, pillId, acceptState) => {
  try {
    const { rows } = await client.query(
      `
      UPDATE "send_pill"
      SET is_okay = $1
      WHERE pill_id = $2
      `,
      [acceptState, pillId],
    );
    return convertSnakeToCamel.keysToCamel(rows[0]);
  } catch (error) {
    throw new Error('sendPillDB.updateSendPill에서 오류 발생: ' + error);
  }
};
// DELETE

module.exports = {
  addSendPill,
  getReceiverNameById,
  getsendPillByCreatedAt,
  findSendPillInfo,
  updateSendPillByPillId,
  getSenderIdByReceiverId,
  getUserIdByPillId,
  getIsOkayByPillId,
  updateSendPill,
  getSendPillUser,
};
