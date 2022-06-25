const { userDB } = require('../db');
const db = require('../db/db');

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
};
