const dayjs = require('dayjs');
const returnType = require('../constants/returnType');
const { userDB, scheduleDB, pillDB } = require('../db');
const db = require('../db/db');
const { nicknameVerify } = require('../lib/nicknameVerify');

/**
 * updateUsername
 * 유저 닉네임 업데이트 로직
 * @param userId - 닉네임을 변경할 유저 아이디
 * @param username - 변경할 닉네임
 */
const updateUsername = async (userId, username) => {
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
};

module.exports = {
  updateUsername,
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

      const pillUserCheck = await pillDB.getPillUser(client, pillId);
      console.log(pillUserCheck);
      if (pillUserCheck.userId !== user.id || pillUserCheck.length === 0)
        return returnType.NO_PILL_USER;

      const pillInformation = await pillDB.getPillDetail(client, pillId);

      let timeList = [];
      pillInformation.forEach((pill) => {
        timeList.push(pill.scheduleTime);
      });

      return {
        pillName: pillInformation[0].pillName,
        scheduleDay: pillInformation[0].scheduleDay,
        startDate: dayjs(pillInformation[0].startDate).format('YYYY-MM-DD'),
        endDate: dayjs(pillInformation[0].endDate).format('YYYY-MM-DD'),
        scheduleTime: timeList,
      };
    } catch (error) {
      console.error('getUserPillInfo error 발생: ' + error);
    } finally {
      client.release();
    }
  },

  isCalendarShare: async (userId, memberId) => {
    let client;
    const log = `userService.isCalendarShare | userId = ${userId}, memberId = ${memberId}`;

    try {
      client = await db.connect(log);
      let isMember = false;

      const isShare = await userDB.isShare(client, userId, memberId);
      if (!isShare) {
        return isMember;
      }

      return isShare.isOkay;
    } catch (error) {
      console.error('getUserPillInfo error 발생: ' + error);
    } finally {
      client.release();
    }
  },
};
