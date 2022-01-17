const dayjs = require('dayjs');
const _ = require('lodash');
const convertSnakeToCamel = require('../lib/convertSnakeToCamel');

const addSendPill = async (client, pillId, senderId, receiverId, time) => {
  const now = dayjs(time).add(9, 'hour');
  const { rows } = await client.query(
    `
    INSERT INTO "send_pill"
    (pill_id, sender_id, receiver_id, created_at, updated_at)
    VALUES
    ($1, $2, $3, $4, $4)
    RETURNING id as send_pill_id, pill_id, is_send, is_okay
    `,
    [pillId, senderId, receiverId, now],
  );
  return convertSnakeToCamel.keysToCamel(rows[0]);
};

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

const getPillIdByMemberId = async (client, senderId, receiverId, createdAt) => {
  const { rows } = await client.query(
    `
    SELECT pill_id
    FROM send_pill
    WHERE sender_id = $1 AND receiver_id = $2 AND created_at = $3 AND is_okay is null;
    `,
    [senderId, receiverId, createdAt],
  );
  return convertSnakeToCamel.keysToCamel(rows);
};

const acceptSendPillByPillId = async (client, pillId) => {
  const now = dayjs().add(9, 'hour');
  const { rows } = await client.query(
    `
    UPDATE send_pill
    SET is_okay = true, updated_at = $2
    WHERE pill_id = $1
    `,
    [pillId, now],
  );
  return convertSnakeToCamel.keysToCamel(rows);
};

const refuseSendPillByPillId = async (client, pillId) => {
  const now = dayjs().add(9, 'hour');
  const { rows } = await client.query(
    `
    UPDATE send_pill
    SET is_okay = false, updated_at = $2
    WHERE pill_id = $1
    `,
    [pillId, now],
  );
  return convertSnakeToCamel.keysToCamel(rows);
};

const getSenderIdByReceiverId = async (client, receiverId) => {
  const { rows } = await client.query(
    `
    SELECT DISTINCT sender_id, receiver_id, is_okay, is_send, created_at FROM send_pill
    WHERE receiver_id = $1
    `,
    [receiverId],
  );
  return convertSnakeToCamel.keysToCamel(rows);
};

const getUserIdByPillId = async (client, pillId) => {
  const { rows } = await client.query(
    `
    SELECT receiver_id FROM send_pill
    WHERE pill_id = $1
    `,
    [pillId],
  );
  return convertSnakeToCamel.keysToCamel(rows);
};

module.exports = { addSendPill, getReceiverNameById, getPillIdByMemberId, acceptSendPillByPillId, refuseSendPillByPillId, getSenderIdByReceiverId, getUserIdByPillId };
