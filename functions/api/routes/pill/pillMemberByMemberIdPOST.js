const functions = require('firebase-functions');
const util = require('../../../lib/util');
const statusCode = require('../../../constants/statusCode');
const responseMessage = require('../../../constants/responseMessage');
const db = require('../../../db/db');
const slackAPI = require('../../../middlewares/slackAPI');

const { pillDB, scheduleDB, sendPillDB, groupDB, userDB } = require('../../../db');
const dayjs = require('dayjs');

module.exports = async (req, res) => {
  const { memberId } = req.params;
  const { pillList } = req.body;
  const { user } = req.header;
  const week = new Array('일', '월', '화', '수', '목', '금', '토');

  if (!pillList || !memberId) {
    return res.status(statusCode.BAD_REQUEST).send(util.fail(statusCode.BAD_REQUEST, responseMessage.NULL_VALUE));
  }

  let client;

  try {
    client = await db.connect(req);

    // 캘린더 공유를 수락했는지 확인
    const findSendGroup = await groupDB.findSendGroupIsOkay(client, user.id, memberId);
    if (findSendGroup.length === 0) return res.status(statusCode.UNAUTHORIZED).send(util.fail(statusCode.UNAUTHORIZED, responseMessage.NO_AUTHENTICATED));

    const findUser = await userDB.findUserById(client, memberId);
    if (findUser.length === 0) return res.status(statusCode.BAD_REQUEST).send(util.fail(statusCode.BAD_REQUEST, responseMessage.NO_USER));

    const now = dayjs().add(9, 'hour');

    let pill;
    let sendPillInfo = [];

    // 약 리스트에서 약 하나씩 순회, 약 정보 db에 저장 ()
    for (let index = 0; index < pillList.length; index++) {
      pill = pillList[index];
      let newPill = await pillDB.addPill(client, pill.pillName, null, pill.color, false);

      // 약 주기 정보 날짜별로 db에 저장
      let startDate = new Date(pill.start);
      let endDate = new Date(pill.end);

      const term = Math.abs(endDate - startDate) / (1000 * 3600 * 24) + 1;
      if (pill.cycle === '1') {
        for (let day = 0; day < term; day++) {
          for (let t = 0; t < pill.time.length; t++) {
            let newSchedule = await scheduleDB.addSchedule(client, newPill[0].id, null, pill.start, pill.end, pill.cycle, startDate, pill.specific, pill.day, pill.time[t]);
          }
          startDate.setDate(startDate.getDate() + 1);
        }
      }

      if (pill.cycle === '2') {
        let dayList = pill.day.split(', ');

        for (let day = 0; day < term; day++) {
          for (let d = 0; d < dayList.length; d++) {
            if (week[startDate.getDay()] === dayList[d]) {
              for (let t = 0; t < pill.time.length; t++) {
                let newSchedule = await scheduleDB.addSchedule(client, newPill[0].id, null, pill.start, pill.end, pill.cycle, startDate, pill.specific, pill.day, pill.time[t]);
              }
              break;
            }
          }
          startDate.setDate(startDate.getDate() + 1);
        }
      }

      if (pill.cycle === '3') {
        let specificNumber = pill.specific.substr(0, 1);
        let specificCycle = pill.specific.substr(1);

        if (specificCycle === 'day') {
          while (startDate < endDate) {
            for (let t = 0; t < pill.time.length; t++) {
              let newSchedule = await scheduleDB.addSchedule(client, newPill[0].id, null, pill.start, pill.end, pill.cycle, startDate, pill.specific, pill.day, pill.time[t]);
            }
            startDate.setDate(startDate.getDate() + Number(specificNumber));
          }
        }

        if (specificCycle === 'week') {
          while (startDate < endDate) {
            for (let t = 0; t < pill.time.length; t++) {
              let newSchedule = await scheduleDB.addSchedule(client, newPill[0].id, null, pill.start, pill.end, pill.cycle, startDate, pill.specific, pill.day, pill.time[t]);
            }
            startDate.setDate(startDate.getDate() + Number(specificNumber) * 7);
          }
        }

        if (specificCycle === 'month') {
          while (startDate < endDate) {
            for (let t = 0; t < pill.time.length; t++) {
              let newSchedule = await scheduleDB.addSchedule(client, newPill[0].id, null, pill.start, pill.end, pill.cycle, startDate, pill.specific, pill.day, pill.time[t]);
            }
            startDate.setMonth(startDate.getMonth() + Number(specificNumber));
          }
        }
      }

      let newSendPill = await sendPillDB.addSendPill(client, newPill[0].id, user.id, memberId, now);
      sendPillInfo.push(newSendPill);
    }

    const receiverName = await sendPillDB.getReceiverNameById(client, memberId);

    // 성공
    res.status(statusCode.OK).send(
      util.success(statusCode.OK, responseMessage.PILL_TRANSMIT_SUCCESS, {
        senderId: user.id,
        senderName: user.username,
        receiverId: Number(memberId),
        receiverName: receiverName[0].username,
        createdAt: now,
        sendPillInfo: sendPillInfo,
      }),
    );
  } catch (error) {
    functions.logger.error(`[ERROR] [${req.method.toUpperCase()}] ${req.originalUrl}`, `[CONTENT] ${error}`);
    console.log(error);

    const slackMessage = `[ERROR] [${req.method.toUpperCase()}] ${req.originalUrl} ${req.user ? `uid:${req.user.id}` : 'req.user 없음'} ${JSON.stringify(error)}`;
    slackAPI.sendMessageToSlack(slackMessage, slackAPI.DEV_WEB_HOOK_ERROR_MONITORING);

    res.status(statusCode.INTERNAL_SERVER_ERROR).send(util.fail(statusCode.INTERNAL_SERVER_ERROR, responseMessage.INTERNAL_SERVER_ERROR));
  } finally {
    client.release();
  }
};
