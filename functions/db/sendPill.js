const _ = require('lodash');
const convertSnakeToCamel = require('../lib/convertSnakeToCamel');

const addSendPill = async (client, pillId, senderId, receiverId, time) => {
  const { rows } = await client.query(
    `
    INSERT INTO "send_pill"
    (pill_id, sender_id, receiver_id, created_at)
    VALUES
    ($1, $2, $3, $4)
    RETURNING id, pill_id, is_send, is_okay
    `,
    [pillId, senderId, receiverId, time],
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
  const { rows } = await client.query(
    `
    UPDATE send_pill
    SET is_okay = true
    WHERE pill_id = $1
    `,
    [pillId],
  );
  return convertSnakeToCamel.keysToCamel(rows);
};

const refuseSendPillByPillId = async (client, pillId) => {
  const { rows } = await client.query(
    `
    UPDATE send_pill
    SET is_okay = false
    WHERE pill_id = $1
    `,
    [pillId],
  );
  return convertSnakeToCamel.keysToCamel(rows);
};

const getSenderIdByReceiverId = async (client, receiverId) => {
  const { rows } = await client.query(
    `
    SELECT DISTINCT sender_id FROM send_pill
    WHERE receiver_id = $1
    `,
    [receiverId],
  );
  return convertSnakeToCamel.keysToCamel(rows);
};

module.exports = { addSendPill, getReceiverNameById, getPillIdByMemberId, acceptSendPillByPillId, refuseSendPillByPillId, getSenderIdByReceiverId };
