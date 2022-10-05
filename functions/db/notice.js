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

const findSendGroup = async (client, memberId, senderId, section) => {
  // memberId : 공유 요청을 받은 사람
  // senderId : 공유 요청을 보낸 사람
  try {
    const { rows } = await client.query(
      `
      SELECT *
      FROM notice AS n JOIN send_group sg ON n.id = sg.notice_id
      WHERE user_id = $1 AND sender_id = $2 AND section = $3 AND is_okay NOT IN ('refuse')
      `,

      [memberId, senderId, section],
    );

    return convertSnakeToCamel.keysToCamel(rows[0]);
  } catch (error) {
    throw new Error('noticeDB.findSendGroup에서 오류 발생: ' + error);
  }
};

const findReceiveUser = async (client, noticeId) => {
  try {
    const { rows } = await client.query(
      `
      SELECT user_id
      FROM notice
      WHERE id = $1
      `,
      [noticeId],
    );

    return convertSnakeToCamel.keysToCamel(rows[0]);
  } catch (error) {
    throw new Error('noticeDB.findReceiveUser에서 오류 발생: ' + error);
  }
};

const findSendGroupBySenderId = async (client, senderId, section) => {
  try {
    const { rows } = await client.query(
      `
      SELECT sg.id AS sender_group_id, notice_id, section, is_okay, is_send
      FROM notice AS n JOIN send_group sg ON n.id = sg.notice_id
      WHERE n.sender_id = $1 AND section = $2 AND is_okay NOT IN ('refuse')
      `,
      [senderId, section],
    );
    return convertSnakeToCamel.keysToCamel(rows);
  } catch (error) {
    throw new Error('group.findSendGroup 오류 발생: ' + error);
  }
};
const findNoticeByNoticeId = async (client, noticeId) => {
  try {
    const { rows } = await client.query(
      `
      SELECT *
      FROM notice
      WHERE id = $1
      `,
      [noticeId],
    );
    return convertSnakeToCamel.keysToCamel(rows);
  } catch (error) {
    throw new Error('group.findSendGroup 오류 발생: ' + error);
  }
};

// UPDATE

// DELETE
const deleteNoticeByUserId = async (client, userId) => {
  await client.query(
    `
    DELETE FROM notice
    WHERE user_id = $1 OR sender_id = $1
    `,
    [userId],
  );
};

const deleteGroupByNoticeId = async (client, senderId, noticeId, section) => {
  await client.query(
    `
    DELETE
    FROM notice
    WHERE id = $1 AND sender_id = $2 AND section = $3
    `,
    [noticeId, senderId, section],
  );
};

module.exports = {
  addNotice,
  findSenderName,
  findSendGroup,
  findReceiveUser,
  deleteNoticeByUserId,
  findSendGroupBySenderId,
  findNoticeByNoticeId,
  deleteGroupByNoticeId,
};
