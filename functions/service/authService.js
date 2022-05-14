const { signInWithEmailAndPassword } = require('firebase/auth');
const { firebaseAuth } = require('../config/firebaseClient');
const { userDB } = require('../db');
const db = require('../db/db');
const util = require('../lib/util');
const jwtHandlers = require('../lib/jwtHandlers');

module.exports = {
  authEmail: async (email, password) => {
    let client;

    try {
      client = await db.connect(req);

      const userFirebase = await signInWithEmailAndPassword(firebaseAuth, email, password)
        .then((user) => user)
        .catch((e) => {
          console.log(e);
          return { err: true, error: e };
        });

      if (userFirebase.err) {
        if (userFirebase.error.code === 'auth/user-not-found') {
          return res.status(statusCode.NOT_FOUND).json(util.fail(statusCode.NOT_FOUND, responseMessage.NO_USER));
        } else if (userFirebase.error.code === 'auth/invalid-email') {
          return res.status(statusCode.NOT_FOUND).json(util.fail(statusCode.NOT_FOUND, responseMessage.INVALID_EMAIL));
        } else if (userFirebase.error.code === 'auth/wrong-password') {
          return res.status(statusCode.NOT_FOUND).json(util.fail(statusCode.NOT_FOUND, responseMessage.MISS_MATCH_PW));
        } else {
          return res.status(statusCode.INTERNAL_SERVER_ERROR).json(util.fail(statusCode.INTERNAL_SERVER_ERROR, responseMessage.INTERNAL_SERVER_ERROR));
        }
      }

      const {
        user: { uid: idFirebase },
      } = userFirebase;
      // const idFirebase = userFirebase.user.uid; 랑 같음

      //const findUser = await userDB.getUserByUid(client, uid);

      const findUser = await userDB.findUserByIdFirebase(client, idFirebase);

      //const { accesstoken } = jwtHandlers.sign(findUser);

      return findUser;
    } catch (error) {
      functions.logger.error(`[ERROR] [${req.method.toUpperCase()}] ${req.originalUrl}`, `[CONTENT] ${error}`);
      console.log(error);

      const slackMessage = `[ERROR] [${req.method.toUpperCase()}] ${req.originalUrl} ${req.header.user ? `uid:${req.header.user.id}` : 'req.user 없음'} ${JSON.stringify(error)}`;
      slackAPI.sendMessageToSlack(slackMessage, slackAPI.DEV_WEB_HOOK_ERROR_MONITORING);
    } finally {
      client.release();
    }
  },
};
