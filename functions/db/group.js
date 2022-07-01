const dayjs = require('dayjs');
const _ = require('lodash');
const convertSnakeToCamel = require('../lib/convertSnakeToCamel');

// CREATE
const addSendGroup = async (client, noticeId, memberName) => {
  const now = dayjs().add(9, 'hour');
  const { rows } = await client.query(
    `
    INSERT INTO send_group
    (member_name, notice_id, is_send, is_okay, created_at, updated_at)
    VALUES
    ($1, $2, true, 'wating', $3, $3)
    RETURNING *
    `,
    [memberName, noticeId, now],
  );
  return convertSnakeToCamel.keysToCamel(rows[0]);
};

// READ
const findMember = async (client, userId) => {
  const { rows } = await client.query(
    `
    SELECT * 
    FROM "send_group" sg
    JOIN "notice" n
    ON sg.notice_id = n.id
    WHERE n.sender_id = $1 AND sg.is_okay = 'accept'
    
    `,
    [userId],
  );
  return convertSnakeToCamel.keysToCamel(rows);
};

const findSendGroupBySendGroupId = async (client, sendGroupId) => {
  const { rows } = await client.query(
    `
    SELECT * 
    FROM "send_group" sg
    JOIN "notice" n
    ON sg.notice_id = n.id
    WHERE sg.id = $1 
    `,
    [sendGroupId],
  );
  return convertSnakeToCamel.keysToCamel(rows[0]);
};

const findSendGroupIsOkay = async (client, userId, senderId) => {
  const { rows } = await client.query(
    `
    SELECT user_id, sender_id, member_name, is_send, is_okay
    FROM notice JOIN send_group sg on notice.id = sg.notice_id
    WHERE user_id = $1 AND sender_id = $2 AND is_okay = 'accept';  
    `,
    [userId, senderId],
  );
  return convertSnakeToCamel.keysToCamel(rows[0]);
};

const findAllMemberByUserId = async (client, userId) => {
  const { rows } = await client.query(
    `
    SELECT s.id as group_id, s.sender_id, u.username, s.is_okay, s.is_send, s.created_at, s.updated_at
    FROM send_group as s
    left join "user" u on u.id = s.sender_id
    WHERE s.sender_id = $1
    `,
    [userId],
  );
  return convertSnakeToCamel.keysToCamel(rows);
};

const findCalendarInfo = async (client, userId) => {
  try {
    const { rows } = await client.query(
      `
      SELECT notice_id, section, is_okay, is_send, n.created_at as created_at, username as sender_name
      FROM notice as n JOIN send_group sg on n.id = sg.notice_id JOIN "user" u on u.id = n.sender_id
      WHERE n.user_id = $1
      `,
      [userId],
    );
    return convertSnakeToCamel.keysToCamel(rows);
  } catch (error) {
    throw new Error('group.findCalendarInfo에서 오류 발생: ' + error);
  }
};

// UPDATE
const updateMemberName = async (client, memberName, groupId) => {
  const now = dayjs().add(9, 'hour');
  const { rows } = await client.query(
    `
    UPDATE send_group
    SET member_name = $1, updated_at = $2
    WHERE id = $3
    RETURNING id as group_id, member_name 
    
    `,
    [memberName, now, groupId],
  );
  return convertSnakeToCamel.keysToCamel(rows);
};

const updateSendGroup = async (client, sendGroupId, isOkay) => {
  const now = dayjs().add(9, 'hour');
  const { rows } = await client.query(
    `
      UPDATE "send_group"
      SET is_okay = $1, updated_at = $2
      WHERE id = $3
      RETURNING *
    `,
    [isOkay, now, sendGroupId],
  );
  return convertSnakeToCamel.keysToCamel(rows[0]);
};

// DELETE

module.exports = {
  findAllMemberByUserId,
  findCalendarInfo,
  findMember,
  findSendGroupBySendGroupId,
  findSendGroupIsOkay,
  updateMemberName,
  updateSendGroup,
  addSendGroup,
};
