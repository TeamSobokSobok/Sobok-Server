const _ = require('lodash');
const convertSnakeToCamel = require('../lib/convertSnakeToCamel');

const addUser = async (client, email, nickname, idFirebase, accesstoken) => {
  const { rows } = await client.query(
    `
    INSERT INTO "user"
    (nickname, email, uid, accesstoken)
    VALUES
    ($1, $2, $3, $4)
    RETURNING *

    `,
    [nickname, email, idFirebase, accesstoken],
  );
  return convertSnakeToCamel.keysToCamel(rows);
};

const getUserByUid = async (client, uid) => {
  const { rows } = await client.query(
    `
    SELECT * FROM "user"
    WHERE uid = $1
    
    `,
    [uid],
  );
  return convertSnakeToCamel.keysToCamel(rows);
};
module.exports = { addUser, getUserByUid };
