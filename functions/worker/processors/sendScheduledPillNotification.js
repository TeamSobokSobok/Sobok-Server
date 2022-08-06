//TODO: schedule Table field 추가: schedule_date_time, sent_at
const _ = require('lodash');
const functions = require('firebase-functions');
const db = require('../../db/db');
const dayjs = require('dayjs');
const utc = require('dayjs/plugin/utc');
const timezone = require('dayjs/plugin/timezone');
const { scanTable } = require('../../lib/scanTable');
const { sendPillDB, pillDB, userDB, scheduleDB } = require('../../db');
const scheduleService = require('../../service/scheduleService');
const { toPath } = require('lodash');
dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.tz.setDefault('Asia/Seoul'); //TODO: timezone +9 체크

const sendScheduledPillNotification = async function () {
  const startTime = process.hrtime();
  const log = `scanTable | schedule : starts at ${Date.now()}`;
  const scheduleClient = await db.connect(log);

  functions.logger.log(`32351 : sendScheduledPillNotification 작업이 시작되었습니다.`);

  const totalResult = {
    i: 1,
    totalScheduleCount: 0,
    totalSentCount: 0,
  }; //TODO: add logging code

  for await (const rows of scanTable(
    scheduleClient,
    'schedule',
    {
      after: dayjs(),
      wheres: `sent_at IS NOT NULL AND schedule_date_time >= timestamp '${dayjs().startOf(
        'date',
      )}' AND schedule_date_time <= ${dayjs()}`,
    }, //TODO: query 최적화 - cacheable
    { fieldName: 'schedule_date_time', direction: 'ASC' },
    100,
  )) {
    const schedules = rows.convertedRows;
    totalResult.totalScheduleCount += schedules.length;

    const result = await Promise.all(
      schedules.map(async (schedule) => await scheduleService.sendScheduleNotification(schedule)),
    );

    totalResult.totalSentCount += _.compact(result).length;
    totalResult.i++;
  }

  functions.logger.log(
    `45276 : sendScheduledPillNotification 작업이 ${process
      .hrtime(startTime)[0]
      .toFixed(2)}초 만에 완료되었습니다.
      i: ${totalResult.i},
      totalScheduleCount: ${totalResult.totalScheduleCount},
      totalSentCount: ${totalResult.totalSentCount}`,
  );

  scheduleClient.release();

  return;
};

module.exports = {
  sendScheduledPillNotification,
};
