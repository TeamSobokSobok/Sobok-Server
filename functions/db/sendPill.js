const _ = require('lodash');
const convertSnakeToCamel = require('../lib/convertSnakeToCamel');

const addSendSchedule = async (client, pillId, senderId, receiverId) => {
  const { rows } = await client.query(
    `
    INSERT INTO "send_pill"
    (pill_id, sender_id, receiver_id)
    VALUES
    ($1, $2, $3)
    RETURNING *
    `,
    [pillId, senderId, receiverId]
  );
  return convertSnakeToCamel.keysToCamel(rows[0]);
}

module.exports = { addSendSchedule }