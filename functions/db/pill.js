const _ = require('lodash');
const convertSnakeToCamel = require('../lib/convertSnakeToCamel');

const addPill = async (client, pillName, userId, color, isStop) => {
  const { rows } = await client.query(
    `
    INSERT INTO "pill"
    (pill_name, user_id, color, is_stop)
    VALUES
    ($1, $2, $3, $4)
    RETURNING *
    `,
    [pillName, userId, color, isStop]
  );
  return convertSnakeToCamel.keysToCamel(rows);
};

const getPillById = async (client, pillId) => {
  const { rows } = await client.query(
    `
    SELECT * FROM "pill"
    WHERE pill_id = $1
    `,
    [pillId],
  );
  return convertSnakeToCamel.keysToCamel(rows);
}

const getPillCountById = async(client, userId) => {
  const { rows } = await client.query(
    `
    SELECT COUNT(user_id) FROM "pill"
    WHERE user_id = $1
    `,
    [userId],
  );
  return convertSnakeToCamel.keysToCamel(rows);
}

module.exports = { addPill, getPillById, getPillCountById }