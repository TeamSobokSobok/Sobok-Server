const db = require('../db/db');
const jwtHandlers = require('../lib/jwtHandlers');
const { userDB } = require('../db');
const returnType = require('../constants/returnType');
const { nicknameVerify } = require('../lib/nicknameVerify');

module.exports = {
  signUp: async (socialId, email, username, deviceToken) => {
    let client;
    let req = `email = ${email}, username = ${username}, socialId = ${socialId}, deviceToken = ${deviceToken}`;

    try {
      client = await db.connect(req);

      const findUser = await userDB.findUserBySocialId(client, socialId);

      if (findUser) {
        return returnType.VALUE_ALREADY_EXIST;
      }

      if (nicknameVerify(username)) {
        return returnType.WRONG_NICKNAME_CONVENTION;
      }

      // 신규 사용자
      let newUser = await userDB.addUser(client, email, username, socialId, deviceToken);
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

  singIn: async (socialId, deviceToken) => {
    let client;
    let req = `socialId = ${socialId}`;

    try {
      client = await db.connect(req);

      const findUser = await userDB.findUserBySocialId(client, socialId);

      // 신규 사용자
      if (!findUser) {
        return returnType.NON_EXISTENT_USER;
      }

      console.log(findUser);
      // 회원가입 된 사용자
      let accesstoken = jwtHandlers.sign(findUser);
      accesstoken.isNew = false;

      await userDB.updateDeviceToken(client, findUser.id, deviceToken);

      return accesstoken;
    } catch (error) {
      console.log('singIn Service 에러 발생' + error);
    } finally {
      client.release();
    }
  },
};
