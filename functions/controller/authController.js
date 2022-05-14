const functions = require('firebase-functions');
const util = require('../../../lib/util');
const statusCode = require('../../../constants/statusCode');
const responseMessage = require('../../../constants/responseMessage');
const db = require('../../../db/db');
const functions = require('firebase-functions');

const { authService } = require('../service');

module.exports = {
  authEmail: async (req, res) => {
    let client;

    try {
      client = await db.connect(req);

      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(statusCode.BAD_REQUEST).send(util.fail(statusCode.BAD_REQUEST, responseMessage.NULL_VALUE));
      }

      const user = authService.authEmail(email, password);

      res.status(statusCode.OK).send(util.success(statusCode.OK, responseMessage.LOGIN_SUCCESS, user));
    } catch (error) {
      console.log(error);
      functions.logger.error(`[EMAIL LOGIN ERROR] [${req.method.toUpperCase()}] ${req.originalUrl}`, `[CONTENT] email:${email} ${error}`);

      res.status(statusCode.INTERNAL_SERVER_ERROR).send(util.fail(statusCode.INTERNAL_SERVER_ERROR, responseMessage.INTERNAL_SERVER_ERROR));
    } finally {
      client.release();
    }
  },
  signUp: async (req, res) => {
    let client;

    try {
      client = await db.connect(req);

      const { email, name, password } = req.body;

      if (!email || !name || !password) {
        return res.status(statusCode.BAD_REQUEST).send(util.fail(statusCode.BAD_REQUEST, responseMessage.NULL_VALUE));
      }

      const result = authService.signUp(email, name, password);

      res.status(statusCode.OK).send(util.success(statusCode.OK, responseMessage.CREATED_USER, result));
    } catch (error) {
      functions.logger.error(`[ERROR] [${req.method.toUpperCase()}] ${req.originalUrl}`, `[CONTENT] ${error}`);
      console.log(error);

      res.status(statusCode.INTERNAL_SERVER_ERROR).send(util.fail(statusCode.INTERNAL_SERVER_ERROR, responseMessage.INTERNAL_SERVER_ERROR));
    } finally {
      client.release();
    }
  },
};
