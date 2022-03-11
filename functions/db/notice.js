const dayjs = require('dayjs');
const _ = require('lodash');
const convertSnakeToCamel = require('../lib/convertSnakeToCamel');

// CREATE
const addNotice = async (client, userId, sendId, section) => {
  const now = dayjs().add(9, 'hour');
  const { rows } = await client.query(
    `
    INSERT INTO notice
    (user_id, send_id, section, created_at, updated_at)
    VALUES
    ($1, $2, $3, $4, $4)
    RETURNING *
    `,
    [userId, sendId, section, now],
  );
  return convertSnakeToCamel.keysToCamel(rows[0]);
};

module.exports = { addNotice };
