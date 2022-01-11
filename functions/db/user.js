const _ = require('lodash');
const convertSnakeToCamel = require('../lib/convertSnakeToCamel');

const addUser = async (client, email, username, idFirebase) => {
  const { rows } = await client.query(
    `
    INSERT INTO "user"
    (email, username, id_firebase)
    VALUES
    ($1, $2, $3)
    RETURNING *
    `,

    [email, username, idFirebase],
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
  return convertSnakeToCamel.keysToCamel(rows[0]);
};

const findUserByIdFirebase = async (client, idFirebase) => {
  const { rows } = await client.query(
    `
    SELECT * FROM "user"
    WHERE id_firebase = $1
    
    `,
    [idFirebase],
  );
  return convertSnakeToCamel.keysToCamel(rows[0]);
};

const findUserByEmail = async (client, email) => {
  const { rows } = await client.query(
    `
    SELECT * FROM "user"
    WHERE email = $1
    
    `,
    [email],
  );
  return convertSnakeToCamel.keysToCamel(rows[0]);
};

const setUserToken = async (client, user, accessToken) => {
  const { rows: existingRows } = await client.query(
    `
    SELECT * FROM "user"
    WHERE id = $1
    
    `,
    [user.id],
  );

  if (existingRows.length === 0) return false;

  const data = _.merge({}, convertSnakeToCamel.keysToCamel(existingRows[0]), { accessToken });

  const { rows } = await client.query(
    `
    UPDATE "user" 
    SET access_token = $1, updated_at = now()
    WHERE id = $2
    RETURNING * 
    `,
    [data.accessToken, user.id],
  );
  return convertSnakeToCamel.keysToCamel(rows[0]);
};

module.exports = { addUser, findUserById, findUserByIdFirebase, findUserByEmail, setUserToken };
