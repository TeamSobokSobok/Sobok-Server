const _ = require('lodash');
const convertSnakeToCamel = require('../lib/convertSnakeToCamel');

const findMember = async (client, userId) => {
  const { rows } = await client.query(
    `
    SELECT member_id, member_name FROM "send_group"
    WHERE user_id = $1
    
    `,
    [userId],
  );
  return convertSnakeToCamel.keysToCamel(rows);
};

module.exports = { findMember };
