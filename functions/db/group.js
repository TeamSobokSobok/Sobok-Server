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

const findAllMemberByUserId = async (client, userId) => {
  const { rows } = await client.query(
    `
    SELECT s.id as group_id, s.user_id, u.username, s.is_okay, s.is_send, s.created_at
    FROM send_group as s
    left join "user" u on u.id = s.user_id
    WHERE s.member_id = $1
    `,
    [userId],
  );
  return convertSnakeToCamel.keysToCamel(rows);
};

module.exports = { findMember, findAllMemberByUserId };
