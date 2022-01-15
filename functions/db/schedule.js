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

const addLikeSchedule = async (client, scheduleId, senderId, stickerId) => {
  const { rows } = await client.query(
    `
      INSERT INTO "like_schedule"
      (schedule_id, sender_id, sticker_id)
      VALUES
      ($1, $2, $3)
      RETURNING *
      `,
    [scheduleId, senderId, stickerId],
  );
  return convertSnakeToCamel.keysToCamel(rows[0]);
};

const updateSticker = async (client, likeScheduleId, stickerId) => {
  const { rows } = await client.query(
    `
    UPDATE like_schedule
    SET sticker_id = $1, updated_at = now()
    WHERE id = $2
    RETURNING id as likeSchedule_id, schedule_id, sender_id, sticker_id, created_at, updated_at 
    
    `,
    [stickerId, likeScheduleId],
  );
  return convertSnakeToCamel.keysToCamel(rows);
};

const updateScheduleIsCheck = async (client, scheduleId, isCheck) => {
  const { rows } = await client.query(
    `
    UPDATE schedule
    SET is_check = $1, updated_at = now()
    WHERE id = $2
    RETURNING id as schedule_id, pill_id, user_id, schedule_date, schedule_time, is_check
    `,
    [isCheck, scheduleId],
  );
  return convertSnakeToCamel.keysToCamel(rows[0]);
};

const findScheduleByScheduleId = async (client, scheduleId) => {
  const { rows } = await client.query(
    `
    SELECT * FROM schedule
    WHERE id = $1

    `,
    [scheduleId],
  );
  return convertSnakeToCamel.keysToCamel(rows[0]);
};

const findCalendarByMemberId = async (client, memberId, startDate, endDate) => {
  const { rows } = await client.query(
    `
    SELECT schedule_date
          , count(schedule_date) as schedule_count
          , count(case when is_check=true THEN  1 END ) as is_check_count
    FROM schedule
    WHERE user_id = $1 AND schedule_date BETWEEN $2 AND $3
    GROUP BY schedule_date
    ORDER BY schedule_date

  `,
    [memberId, startDate, endDate],
  );
  return convertSnakeToCamel.keysToCamel(rows);
};

const findScheduleByMemberId = async (client, memberId, date, scheduleTime) => {
  const { rows } = await client.query(
    `
    SELECT schedule.id as schedule_id, pill_id, pill_name, schedule_time, is_check, color
    FROM schedule
    LEFT JOIN pill ON schedule.pill_id = pill.id
    WHERE schedule.user_id = $1 AND schedule_date = $2 AND schedule_time = $3

  `,
    [memberId, date, scheduleTime],
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
    [pillId],
  );
  return convertSnakeToCamel.keysToCamel(rows);
};

const findScheduleTimeByPillId = async (client, pillId) => {
  const { rows } = await client.query(
    `
    SELECT DISTINCT s.schedule_time
    FROM schedule as s LEFT OUTER JOIN pill as p ON s.pill_id = p.id
    WHERE p.id = $1;
    `,
    [pillId],
  );
  return convertSnakeToCamel.keysToCamel(rows);
};

const findScheduleTime = async (client, memberId, date) => {
  const { rows } = await client.query(
    `
    SELECT schedule_time FROM schedule
    WHERE user_id = $1 AND schedule_date = $2
    GROUP BY schedule_time;
    `,
    [memberId, date],
  );
  return convertSnakeToCamel.keysToCamel(rows);
};

const acceptPillByPillId = async (client, receiverId, pillId) => {
  const { rows } = await client.query(
    `
    UPDATE schedule
    SET user_id = $1
    WHERE pill_id = $2
    `,
    [receiverId, pillId],
  );
  return convertSnakeToCamel.keysToCamel(rows);
};

const findLikeSchedule = async (client, scheduleId, userId) => {
  const { rows } = await client.query(
    `
    SELECT like_schedule.id as like_schedule_id, schedule_id, sticker_img, username
    FROM like_schedule
    LEFT JOIN sticker ON sticker.id = like_schedule.sticker_id
    LEFT JOIN "user" ON "user".id = like_schedule.sender_id
    WHERE schedule_id = $1
    ORDER BY sender_id = $2 DESC, like_schedule.updated_at DESC
    `,
    [scheduleId, userId],
  );
  return convertSnakeToCamel.keysToCamel(rows);
};

const findUserLikeScheduleList = async (client, userId) => {
  const { rows } = await client.query(
    `
    SELECT * FROM like_schedule
    WHERE sender_id = $1
    `,
    [userId],
  );
  return convertSnakeToCamel.keysToCamel(rows);
};

const findLikeScheduleById = async (client, likeScheduleId) => {
  const { rows } = await client.query(
    `
    SELECT * FROM like_schedule
    WHERE id = $1
    `,
    [likeScheduleId],
  );
  return convertSnakeToCamel.keysToCamel(rows[0]);
};

const isLikedSchedule = async (client, likeScheduleList, userLikeScheduleList) => {
  const isContainSchedule = (userLikeScheduleList) => userLikeScheduleList === likeScheduleList;
  return userLikeScheduleList.some(isContainSchedule);
};

const findLikeScheduleByScheduleId = async (client, scheduleId, userId) => {
  const { rows } = await client.query(
    `
    SELECT like_schedule.id as like_schedule_id, sticker_img
    FROM like_schedule
    LEFT JOIN sticker ON sticker.id = like_schedule.sticker_id
    WHERE schedule_id = $1
    ORDER BY sender_id = $2 DESC, updated_at DESC
    LIMIT 4
    `,
    [scheduleId, userId],
  );
  return convertSnakeToCamel.keysToCamel(rows);
};

const deleteScheduleByPillId = async (client, pillId) => {
  const { rows } = await client.query(
    `
    DELETE FROM schedule
    WHERE pill_id = $1
    `,
    [pillId],
  );
  return convertSnakeToCamel.keysToCamel(rows);
};

const findMyLikeScheduleByScheduleId = async (client, scheduleId) => {
  const { rows } = await client.query(
    `
    SELECT like_schedule.id as like_schedule_id, sticker_img
    FROM like_schedule
    LEFT JOIN sticker ON sticker.id = like_schedule.sticker_id
    WHERE schedule_id = $1
    LIMIT 4
    `,
    [scheduleId],
  );
  return convertSnakeToCamel.keysToCamel(rows);
};

module.exports = {
  addSchedule,
  addLikeSchedule,
  updateSticker,
  findCalendarByMemberId,
  findScheduleByMemberId,
  findScheduleTime,
  findScheduleByPillId,
  findScheduleTimeByPillId,
  acceptPillByPillId,
  findLikeSchedule,
  findUserLikeScheduleList,
  findLikeScheduleById,
  isLikedSchedule,
  findScheduleByScheduleId,
  findLikeScheduleByScheduleId,
  deleteScheduleByPillId,
  updateScheduleIsCheck,
  findMyLikeScheduleByScheduleId,
};
