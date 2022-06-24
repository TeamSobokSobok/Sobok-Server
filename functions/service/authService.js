const db = require('../db/db');
const jwtHandlers = require('../lib/jwtHandlers');
const { userDB } = require('../db');
const returnType = require('../constants/returnType');

module.exports = {
  signUp: async (socialId, email, username) => {
    let client;
    let req = `email = ${email}, username = ${username}, socialId = ${socialId}`;

    try {
      client = await db.connect(req);

      const findUser = await userDB.findUserBySocialId(client, socialId);

      if (findUser) {
        return returnType.VALUE_ALREADY_EXIST;
      }

      // 신규 사용자
      let newUser = await userDB.addUser(client, email, username, socialId);
      const { accesstoken } = jwtHandlers.sign(newUser);
      newUser.accesstoken = accesstoken;
      newUser.isNew = true;

      return newUser;
    } catch (error) {
      console.log('singUp Service 에러 발생' + error);
    } finally {
      client.release();
    }
  },

  singIn: async (socialId) => {
    let client;
    let req = `socialId = ${socialId}`;

    try {
      client = await db.connect(req);

      const findUser = await userDB.findUserBySocialId(client, socialId);

      // 신규 사용자
      if (!findUser) {
        return returnType.NON_EXISTENT_USER;
      }

      //
      let accesstoken = jwtHandlers.sign(findUser);
      accesstoken.isNew = false;

      return accesstoken;
    } catch (error) {
      console.log('singIn Service ㅇㅔㄹㅓ' + error);
    } finally {
      client.release();
    }
  },
};
