const dayjs = require('dayjs');
const _ = require('lodash');
const convertSnakeToCamel = require('../lib/convertSnakeToCamel');

const addUser = async (client, username, socialId, deviceToken) => {
  const now = dayjs().add(9, 'hour');
  const { rows } = await client.query(
    `
    INSERT INTO "user"
    (username, social_id, created_at, updated_at, device_token)
    VALUES
    ($1, $2, $3, $3, $4)
    RETURNING id, username, social_id, created_at, updated_at, device_token
    `,
    [username, socialId, now, deviceToken],
  );
  return convertSnakeToCamel.keysToCamel(rows[0]);
};

const findUserById = async (client, userId) => {
  const { rows } = await client.query(
    `
    SELECT * FROM "user"
    WHERE id = $1
    
    `,
    [userId],
  );
  return convertSnakeToCamel.keysToCamel(rows);
};

const findUserBySocialId = async (client, socialId) => {
  const { rows } = await client.query(
    `
    SELECT * FROM "user"
    WHERE social_id = $1
    
    `,
    [socialId],
  );
  return convertSnakeToCamel.keysToCamel(rows[0]);
};

const updateDeviceToken = async (client, userId, deviceToken) => {
  const now = dayjs().add(9, 'hour');
  const { rows: existingRows } = await client.query(
    `
    SELECT * FROM "user"
    WHERE id = $1
    
    `,
    [userId],
  );

  if (existingRows.length === 0) return false;

  const data = _.merge({}, convertSnakeToCamel.keysToCamel(existingRows[0]), { deviceToken });

  const { rows } = await client.query(
    `
    UPDATE "user" 
    SET device_token = $1, updated_at = $3
    WHERE id = $2
    RETURNING * 
    `,
    [data.deviceToken, userId, now],
  );
  return convertSnakeToCamel.keysToCamel(rows[0]);
};

const findUserByName = async (client, username) => {
  const { rows } = await client.query(
    `
    SELECT id as member_id, username as member_name
    FROM "user"
    WHERE username = $1

    `,
    [username],
  );
  return convertSnakeToCamel.keysToCamel(rows);
};

const findUserNameById = async (client, userId) => {
  const { rows } = await client.query(
    `
    SELECT username FROM "user"
    WHERE id = $1
    `,
    [userId],
  );
  return convertSnakeToCamel.keysToCamel(rows);
};

const findDeviceTokenById = async (client, userId) => {
  try {
    const { rows } = await client.query(
      `
      SELECT device_token
      FROM "user"
      WHERE id = $1
      `,
      [userId],
    );
    return convertSnakeToCamel.keysToCamel(rows[0]);
  } catch (error) {
    throw new Error('userDB.findDeviceTokenById에서 오류 발생: ' + error);
  }
};

const updateUserNameById = async (client, userId, username) => {
  try {
    const { rows } = await client.query(
      `
      UPDATE "user"
      SET username = $1
      WHERE id = $2
      `,
      [username, userId],
    );

    return convertSnakeToCamel.keysToCamel(rows);
  } catch (error) {
    throw new Error('userDB.updateUserNameById에서 오류 발생: ' + error);
  }
};

const findPillById = async (client, userId) => {
  try {
    const { rows } = await client.query(
      `
      SELECT p.id, p.color, p.pill_name
      FROM "user" as u JOIN pill p on u.id = p.user_id
      WHERE u.id = $1 AND p.is_stop = false;
      `,
      [userId],
    );
    return convertSnakeToCamel.keysToCamel(rows);
  } catch (error) {
    throw new Error('userDB.findPillById에서 오류 발생: ' + error);
  }
};

const emptyDeviceTokenById = async (client, userId) => {
  const now = dayjs().add(9, 'hour');
  try {
    const { rows } = await client.query(
      `
      UPDATE "user"
      SET device_token = '', updated_at = $2
      WHERE id = $1
      RETURNING *
      `,
      [userId, now],
    );
    return convertSnakeToCamel.keysToCamel(rows[0]);
  } catch (error) {
    throw new Error('userDB.emptyDeviceTokenById에서 오류 발생: ' + error);
  }
};

const softDeleteUser = async (client, userId) => {
  const now = dayjs().add(9, 'hour');
  try {
    const { rows } = await client.query(
      `
      UPDATE "user"
      SET username = '탈퇴한사용자'
        , social_id = ''
        , device_token = ''
        , is_deleted = TRUE
        , updated_at = $2
        , deleted_at = $2
      WHERE id = $1
      RETURNING *
      `,
      [userId, now],
    );
    return convertSnakeToCamel.keysToCamel(rows[0]);
  } catch (error) {
    throw new Error('userDB.softDeleteUser에서 오류 발생: ' + error);
  }
};

const isShare = async (client, userId, memberId) => {
  try {
    const { rows } = await client.query(
      `
      select user_id, sender_id, is_okay
      from "notice" join send_group sg on notice.id = sg.notice_id
      where user_id = $1 AND sender_id = $2 AND is_okay = 'accept' OR is_okay = 'waiting'
      `,
      [memberId, userId],
    );
    return convertSnakeToCamel.keysToCamel(rows[0]);
  } catch (error) {
    throw new Error('userDB.isShare에서 오류 발생: ' + error);
  }
};

module.exports = {
  addUser,
  findUserById,
  findUserBySocialId,
  updateDeviceToken,
  findUserByName,
  findUserNameById,
  findDeviceTokenById,
  updateUserNameById,
  findPillById,
  emptyDeviceTokenById,
  softDeleteUser,
  isShare,
};
