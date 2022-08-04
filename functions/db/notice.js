const dayjs = require('dayjs');
const _ = require('lodash');
const convertSnakeToCamel = require('../lib/convertSnakeToCamel');

// CREATE
const addNotice = async (client, memberId, senderId, section) => {
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

// READ
const findSenderName = async (client, memberId, senderId) => {
  try {
    const { rows } = await client.query(
      `
      SELECT sg.member_name
      FROM notice as n JOIN send_group as sg ON n.id = sg.notice_id
      WHERE n.user_id = $1 AND n.sender_id = $2
      `,
      [memberId, senderId],
    );

    return convertSnakeToCamel.keysToCamel(rows[0]);
  } catch (error) {
    throw new Error('noticeDB.findSenderName에서 오류 발생: ' + error);
  }
};

const findSendGroup = async (client, userId, senderId, section) => {
  try {
    const { rows } = await client.query(
      `
      SELECT *
      FROM notice
      WHERE user_id = $1 AND sender_id = $2 AND section = $3
      `,

      [userId, senderId, section],
    );

    return convertSnakeToCamel.keysToCamel(rows);
  } catch (error) {
    throw new Error('noticeDB.findSendGroup에서 오류 발생: ' + error);
  }
};
// UPDATE

// DELETE

module.exports = { addNotice, findSenderName, findSendGroup };
