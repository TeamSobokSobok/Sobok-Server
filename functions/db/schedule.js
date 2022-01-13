const _ = require('lodash');
const convertSnakeToCamel = require('../lib/convertSnakeToCamel');

const addSchedule = async (client, pillId, userId, start, end, cycle, date, specific, day, time) => {
  const { rows } = await client.query(
    `
      INSERT INTO "schedule"
      (pill_id, user_id, start_date, end_date, schedule_cycle, schedule_date, schedule_specific, schedule_day, schedule_time)
      VALUES
      ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *
      `,
    [pillId, userId, start, end, cycle, date, specific, day, time],
  );
  return convertSnakeToCamel.keysToCamel(rows);
};

const findScheduleByMemberId = async (client, memberId, startDate, endDate) => {
  const { rows } = await client.query(
    `
    SELECT schedule_date
          , count(schedule_date) as schedule_count
          , count(case when is_check=true THEN  1 END ) as is_check_count
    FROM schedule
    WHERE user_id = $1 AND schedule_date BETWEEN $2 AND $3
    GROUP BY schedule_date;

  `,
    [memberId, startDate, endDate],
  );
  return convertSnakeToCamel.keysToCamel(rows);
};

const findScheduleByPillId = async (client, pillId) => {
  const { rows } = await client.query(
    `
    SELECT DISTINCT p.pill_name, p.color, s.start_date, s.end_date, s.schedule_cycle, s.schedule_day, s.schedule_specific
    FROM schedule as s LEFT OUTER JOIN pill as p ON s.pill_id = p.id
    WHERE p.id = $1;
    `,
    [pillId]
  );
  return convertSnakeToCamel.keysToCamel(rows);
}

const findScheduleTimeByPillId = async (client, pillId) => {
  const { rows } = await client.query(
    `
    SELECT DISTINCT s.schedule_time
    FROM schedule as s LEFT OUTER JOIN pill as p ON s.pill_id = p.id
    WHERE p.id = $1;
    `,
    [pillId]
  );
  return convertSnakeToCamel.keysToCamel(rows);
}
module.exports = { addSchedule, findScheduleByMemberId, findScheduleByPillId, findScheduleTimeByPillId };
