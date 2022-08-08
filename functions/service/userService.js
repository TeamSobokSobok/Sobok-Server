const returnType = require('../constants/returnType');
const { userDB, scheduleDB } = require('../db');
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

  /**
   * 해당 유저 약 리스트 조회 서비스
   * getUserPillList
   * @param userId
   */
  getUserPillList: async (userId) => {
    let client;
    const log = `userDB.getUserPillList | userId = ${userId}`;

    try {
      client = await db.connect(log);

      const user = await userDB.findUserById(client, userId);
      if (!user) return returnType.NON_EXISTENT_USER;

      const pillList = await userDB.findPillById(client, userId);
      return pillList;
    } catch (error) {
      console.error('getUserPillList error 발생: ' + error);
    } finally {
      client.release();
    }
  },

  /**
   * 해당 유저 약 상세조회 서비스
   * getUserPillInfo
   * @param userId
   * @param pillId
   */
  getUserPillInfo: async (userId, pillId) => {
    let client;
    const log = `scheduleDB.getUserPillInfo | userId = ${userId}, pillId = ${pillId}`;

    try {
      client = await db.connect(log);

      const user = await userDB.findUserById(client, userId);
      if (!user) return returnType.NON_EXISTENT_USER;

      const pillInfo = await scheduleDB.findScheduleByPillId(client, pillId);
      const pillTime = await scheduleDB.findScheduleTimeByPillId(client, pillId);

      let timeList = [];
      pillTime.forEach((time) => {
        timeList.push(time.scheduleTime);
      });

      pillInfo[0].time = timeList;

      return pillInfo;
    } catch (error) {
      console.error('getUserPillInfo error 발생: ' + error);
    } finally {
      client.release();
    }
  },
};
