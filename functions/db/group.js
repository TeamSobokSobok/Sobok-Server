const _ = require('lodash');
const convertSnakeToCamel = require('../lib/convertSnakeToCamel');

const findMember = async (client, userId) => {
  const { rows } = await client.query(
    `
    SELECT id as group_id, member_id, member_name FROM "send_group"
    WHERE user_id = $1
    ORDER BY created_at
    
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

const updateMemberName = async (client, memberName, groupId) => {
  const { rows } = await client.query(
    `
    UPDATE send_group
    SET member_name = $1, updated_at = now()
    WHERE id = $2
    RETURNING * 
    
    `,
    [memberName, groupId],
  );
  return convertSnakeToCamel.keysToCamel(rows);
};

module.exports = { findMember, findAllMemberByUserId, updateMemberName };