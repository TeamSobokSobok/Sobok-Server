const dayjs = require('dayjs');
const _ = require('lodash');
const convertSnakeToCamel = require('../lib/convertSnakeToCamel');

const addPill = async (client, pillName, userId, color, isStop) => {
  const now = dayjs().add(9, 'hour');
  const { rows } = await client.query(
    `
    INSERT INTO "pill"
    (pill_name, user_id, color, is_stop, create_at, updated_at)
    VALUES
    ($1, $2, $3, $4, $5, $5)
    RETURNING *
    `,
    [pillName, userId, color, isStop, now],
  );
  return convertSnakeToCamel.keysToCamel(rows);
};

const getPillById = async (client, pillId) => {
  const { rows } = await client.query(
    `
    SELECT * FROM "pill"
    WHERE id = $1
    `,
    [pillId],
  );
  return convertSnakeToCamel.keysToCamel(rows);
};

const getPillCountById = async (client, userId) => {
  const { rows } = await client.query(
    `
    SELECT COUNT(user_id) FROM "pill"
    WHERE user_id = $1
    `,
    [userId],
  );
  return convertSnakeToCamel.keysToCamel(rows);
};

const acceptPillByPillId = async (client, receiverId, pillId) => {
  const { rows } = await client.query(
    `
    UPDATE pill
    SET user_id = $1
    WHERE id = $2 AND user_id is null
    `,
    [receiverId, pillId],
  );
  return convertSnakeToCamel.keysToCamel(rows);
};

const updatePillNameByPillId = async (client, pillId, pillName) => {
  const { rows } = await client.query(
    `
    UPDATE pill
    SET pill_name = $1
    WHERE id = $2
    `,
    [pillName, pillId],
  );
  return convertSnakeToCamel.keysToCamel(rows);
};

const getUserIdByPillId = async (client, pillId) => {
  const { rows } = await client.query(
    `
    SELECT user_id FROM pill
    WHERE id = $1
    `,
    [pillId],
  );
  return convertSnakeToCamel.keysToCamel(rows);
};

const deletePillByPillId = async (client, pillId) => {
  const { rows } = await client.query(
    `
    DELETE FROM pill
    WHERE id = $1
    `,
    [pillId],
  );
  return convertSnakeToCamel.keysToCamel(rows);
};

const stopPillByPillId = async (client, pillId) => {
  const { rows } = await client.query(
    `
    UPDATE pill
    SET is_stop = true
    WHERE id = $1
    `,
    [pillId],
  );
  return convertSnakeToCamel.keysToCamel(rows);
};
module.exports = { addPill, getPillById, getPillCountById, acceptPillByPillId, updatePillNameByPillId, getUserIdByPillId, deletePillByPillId, stopPillByPillId };
