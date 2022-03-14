const dayjs = require('dayjs');
const _ = require('lodash');
const convertSnakeToCamel = require('../lib/convertSnakeToCamel');

// CREATE
const addSendPill = async (client, pillId, senderId, receiverId, now) => {
  const { rows } = await client.query(
    `
    INSERT INTO "send_pill"
    (pill_id, sender_id, receiver_id, created_at, updated_at, is_send)
    VALUES
    ($1, $2, $3, $4, $4, true)
    RETURNING id, pill_id, is_send, is_okay
    `,
    [pillId, senderId, receiverId, now],
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

// UPDATE

// DELETE

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

module.exports = { addSendPill, getReceiverNameById, getsendPillByCreatedAt, updateSendPillByPillId, getSenderIdByReceiverId, getUserIdByPillId, getIsOkayByPillId };
