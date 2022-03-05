const functions = require('firebase-functions');
const util = require('../../../lib/util');
const statusCode = require('../../../constants/statusCode');
const responseMessage = require('../../../constants/responseMessage');
const db = require('../../../db/db');
const slackAPI = require('../../../middlewares/slackAPI');

const { pillDB, scheduleDB, sendPillDB, groupDB, userDB } = require('../../../db');
const dayjs = require('dayjs');
const isSameOrBefore = require('dayjs/plugin/isSameOrBefore');

module.exports = async (req, res) => {
  const { memberId } = req.params;
  const { pillList } = req.body;
  const { user } = req.header;
  const week = new Array('일', '월', '화', '수', '목', '금', '토');

  dayjs.extend(isSameOrBefore);

  if (!user) {
    return res.status(statusCode.UNAUTHORIZED).send(util.fail(statusCode.UNAUTHORIZED, responseMessage.NO_AUTHENTICATED));
  }

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
      let startDate = dayjs(pill.start);
      let endDate = dayjs(pill.end);

      const term = endDate.diff(startDate, 'day') + 1;

      if (pill.cycle === '1') {
        for (let day = 0; day < term; day++) {
          for (let t = 0; t < pill.time.length; t++) {
            let newSchedule = await scheduleDB.addSchedule(client, newPill[0].id, null, pill.start, pill.end, pill.cycle, startDate.add(day, 'day'), pill.specific, pill.day, pill.time[t]);
          }
        }
      }

      if (pill.cycle === '2') {
        let dayList = pill.day.split(', ');
        console.log(dayList);

        for (let day = 0; day < term; day++) {
          for (let t = 0; t < pill.time.length; t++) {
            for (let dayCheck = 0; dayCheck < dayList.length; dayCheck++) {
              if (week[startDate.add(day, 'day').get('day')] === dayList[dayCheck]) {
                let newSchedule = await scheduleDB.addSchedule(client, newPill[0].id, null, pill.start, pill.end, pill.cycle, startDate.add(day, 'day'), pill.specific, pill.day, pill.time[t]);
              }
            }
          }
        }
      }

      if (pill.cycle === '3') {
        let specificNumber = Number(pill.specific.substr(0, 1));
        let specificCycle = pill.specific.substr(1);

        if (specificCycle === 'day') {
          for (let day = 0; day < term; day += specificNumber) {
            for (let t = 0; t < pill.time.length; t++) {
              let newSchedule = await scheduleDB.addSchedule(client, newPill[0].id, null, pill.start, pill.end, pill.cycle, startDate.add(day, 'day'), pill.specific, pill.day, pill.time[t]);
            }
          }
        }

        if (specificCycle === 'week') {
          for (let day = 0; day < term; day += 7) {
            for (let t = 0; t < pill.time.length; t++) {
              let newSchedule = await scheduleDB.addSchedule(
                client,
                newPill[0].id,
                null,
                pill.start,
                pill.end,
                pill.cycle,
                startDate.add(day * specificNumber, 'day'),
                pill.specific,
                pill.day,
                pill.time[t],
              );
            }
          }
        }

        if (specificCycle === 'month') {
          while (startDate.isSameOrBefore(endDate)) {
            for (let t = 0; t < pill.time.length; t++) {
              let newSchedule = await scheduleDB.addSchedule(client, newPill[0].id, null, pill.start, pill.end, pill.cycle, startDate, pill.specific, pill.day, pill.time[t]);
            }
            startDate = startDate.add(specificNumber, 'month');
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

    const slackMessage = `[ERROR] [${req.method.toUpperCase()}] ${req.originalUrl} ${req.user ? `uid:${req.header.user.id}` : 'req.user 없음'} ${JSON.stringify(error)}`;
    slackAPI.sendMessageToSlack(slackMessage, slackAPI.DEV_WEB_HOOK_ERROR_MONITORING);

    res.status(statusCode.INTERNAL_SERVER_ERROR).send(util.fail(statusCode.INTERNAL_SERVER_ERROR, responseMessage.INTERNAL_SERVER_ERROR));
  } finally {
    client.release();
  }
};
