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
      [pillId, userId, start, end, cycle, date, specific, day, time]
    );
    return convertSnakeToCamel.keysToCamel(rows);
};
  
module.exports = { addSchedule }