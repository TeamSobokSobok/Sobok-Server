const _ = require('lodash');
const convertSnakeToCamel = require('../lib/convertSnakeToCamel');

const addSendPill = async (client, pillId, senderId, receiverId) => {
  const { rows } = await client.query(
    `
    INSERT INTO "send_pill"
    (pill_id, sender_id, receiver_id)
    VALUES
    ($1, $2, $3)
    RETURNING id, pill_id, is_send, is_okay
    `,
    [pillId, senderId, receiverId]
  );
  return convertSnakeToCamel.keysToCamel(rows[0]);
}

const getReceiverNameById = async (client, receiverId) => {
  const { rows } = await client.query(
    `
    SELECT DISTINCT u.username, s.receiver_id FROM send_pill as s
    LEFT JOIN "user" u on u.id = s.receiver_id
    WHERE s.receiver_id = $1
    `,
    [receiverId]
  );
  return convertSnakeToCamel.keysToCamel(rows[0]);
}

module.exports = { addSendPill, getReceiverNameById }