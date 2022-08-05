const returnType = require('../constants/returnType');
const { userDB } = require('../db');
const db = require('../db/db');
const { nicknameVerify } = require('../lib/nicknameVerify');

module.exports = {
  getUsername: async (username) => {
    let client;
    const req = `username = ${username}`;

    try {
      client = await db.connect(req);

      const findUsername = await userDB.findUserByName(client, username);

      return findUsername;
    } catch (error) {
      console.log(error);
    } finally {
      client.release();
    }
  },

  updateUsername: async (userId, username) => {
    let client;
    const log = `userDB.updateUsername | userId = ${userId}, username = ${username}`;

    try {
      client = await db.connect(log);
      await client.query('BEGIN');

      const nicknameCheck = nicknameVerify(username);
      if (nicknameCheck) return returnType.WRONG_NICKNAME_CONVENTION;

      const user = await userDB.findUserById(client, userId);
      if (!user) return returnType.NON_EXISTENT_USER;

      const checkUsername = await userDB.findUserByName(client, username);
      if (checkUsername.length !== 0) return returnType.NICKNAME_ALREADY_EXIST;

      const updateUsername = await userDB.updateUserNameById(client, userId, username);
      await client.query('COMMIT');

      return updateUsername;
    } catch (error) {
      console.log(error);
      await client.query('ROLLBACK');
    } finally {
      client.release();
    }
  },
};
