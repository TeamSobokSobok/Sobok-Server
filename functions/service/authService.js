const functions = require('firebase-functions');
const { signInWithEmailAndPassword } = require('firebase/auth');
const { firebaseAuth } = require('../config/firebaseClient');
const db = require('../db/db');
const util = require('../lib/util');
const admin = require('firebase-admin');
const jwtHandlers = require('../lib/jwtHandlers');
const { userDB } = require('../db');
const statusCode = require('../constants/statusCode');
const responseMessage = require('../constants/responseMessage');

module.exports = {
  authEmail: async (email, password) => {
    let client;
    let req = `email = ${email}, password = ${password}`;

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
          return responseMessage.NO_USER;
        } else if (userFirebase.error.code === 'auth/invalid-email') {
          return responseMessage.WRONG_EMAIL_CONVENTION;
        } else if (userFirebase.error.code === 'auth/wrong-password') {
          return responseMessage.MISS_MATCH_PW;
        } else {
          return responseMessage.INTERNAL_SERVER_ERROR;
        }
      }

      const {
        user: { uid: idFirebase },
      } = userFirebase;
      // const idFirebase = userFirebase.user.uid; 랑 같음

      //const findUser = await userDB.getUserByUid(client, uid);

      const findUser = await userDB.findUserByIdFirebase(client, idFirebase);

      return findUser;
    } catch (error) {
      functions.logger.error(
        `[ERROR] [${req.method.toUpperCase()}] ${req.originalUrl}`,
        `[CONTENT] ${error}`,
      );
      console.log(error);
    } finally {
      client.release();
    }
  },
  signUp: async (email, nickname, password) => {
    let client;
    let req = `email = ${email}, nickname = ${nickname}, password = ${password}`;

    try {
      client = await db.connect(req);

      const userFirebase = await admin
        .auth()
        .createUser({ email, password, nickname })
        .then((user) => user)
        .catch((e) => {
          console.log(e);
          return { err: true, error: e };
        });

      if (userFirebase.err) {
        if (userFirebase.error.code === 'auth/email-already-exists') {
          return responseMessage.ALREADY_EMAIL;
        } else if (userFirebase.error.code === 'auth/invalid-password') {
          return responseMessage.WRONG_PASSWORD_CONVENTION;
        } else {
          return responseMessage.INTERNAL_SERVER_ERROR;
        }
      }

      const idFirebase = userFirebase.uid;

      const newUser = await userDB.addUser(client, email, nickname, idFirebase);
      const { accesstoken } = jwtHandlers.sign(newUser);
      await userDB.setUserToken(client, newUser, accesstoken);

      return newUser;
    } catch (error) {
      functions.logger.error(
        `[ERROR] [${req.method.toUpperCase()}] ${req.originalUrl}`,
        `[CONTENT] ${error}`,
      );
      console.log(error);
    } finally {
      client.release();
    }
  },
};
