const dayjs = require('dayjs');
const convertSnakeToCamel = require('../lib/convertSnakeToCamel');

const saveNotice = async (client, senderId, receiverId, section) => {
  const now = dayjs().add(9, 'hour');
  const { rows } = await client.query(
    `
        INSERT INTO "notice"
        (sender_id, receiver_id, section, created_at, updated_at)
        VALUES
        ($1, $2, $3, $4, $4)
        `,
    [senderId, receiverId, section, now],
  );
  return convertSnakeToCamel.keysToCamel(rows);
};

module.exports = { saveNotice };
