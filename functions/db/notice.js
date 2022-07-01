const dayjs = require('dayjs');
const _ = require('lodash');
const convertSnakeToCamel = require('../lib/convertSnakeToCamel');

// CREATE
const addNotice = async (client, senderId, memberId, section) => {
  const { rows } = await client.query(
    `
    INSERT INTO notice
    (user_id, sender_id, section)
    VALUES
    ($1, $2, $3)
    RETURNING *
    `,
    [memberId, senderId, section],
  );
  return convertSnakeToCamel.keysToCamel(rows[0]);
};

module.exports = { addNotice };
