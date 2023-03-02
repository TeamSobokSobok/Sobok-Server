const dayjs = require('dayjs');
const _ = require('lodash');
const convertSnakeToCamel = require('../lib/convertSnakeToCamel');

const addLikeSchedule = async (client, scheduleId, senderId, stickerId) => {
  const now = dayjs().add(9, 'hour');
  const { rows } = await client.query(
    `
      INSERT INTO "like_schedule"
      (schedule_id, sender_id, sticker_id, created_at, updated_at)
      VALUES
      ($1, $2, $3, $4, $4)
      RETURNING id as like_schedule_id, schedule_id, sender_id, sticker_id, created_at, updated_at
      `,
    [scheduleId, senderId, stickerId, now],
  );
  return convertSnakeToCamel.keysToCamel(rows[0]);
};

const updateSticker = async (client, likeScheduleId, stickerId) => {
  const now = dayjs().add(9, 'hour');
  const { rows } = await client.query(
    `
    UPDATE like_schedule
    SET sticker_id = $1, updated_at = $3
    WHERE id = $2
    RETURNING id as like_schedule_id, schedule_id, sender_id, sticker_id, created_at, updated_at 
    
    `,
    [stickerId, likeScheduleId, now],
  );
  return convertSnakeToCamel.keysToCamel(rows);
};

const updateScheduleSentAt = async (client, scheduleId) => {
  const now = dayjs().add(9, 'hour');
  const { rows } = await client.query(
    `
    UPDATE schedule
    SET sent_at = $1, updated_at = $1
    WHERE id = $2
    RETURNING id as schedule_id, pill_id, user_id, schedule_date, schedule_time, is_check
    `,
    [now, scheduleId],
  );
  return convertSnakeToCamel.keysToCamel(rows[0]);
};

const updateScheduleIsCheck = async (client, scheduleId, isCheck) => {
  const now = dayjs().add(9, 'hour');
  const { rows } = await client.query(
    `
    UPDATE schedule
    SET is_check = $1, updated_at = $3
    WHERE id = $2
    RETURNING id as schedule_id, pill_id, user_id, schedule_date, schedule_time, is_check
    `,
    [isCheck, scheduleId, now],
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
          , count(case when is_check = true THEN  1 END ) as is_check_count
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
    SELECT DISTINCT p.id AS pill_id, p.pill_name
    , p.color, s.start_date, s.end_date
    , s.take_interval, s.schedule_day, s.schedule_specific
    FROM schedule AS s 
    LEFT OUTER JOIN pill as p ON s.pill_id = p.id
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
    SELECT like_schedule.id as like_schedule_id, schedule_id, sticker_id, sticker_img, username
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
    SELECT like_schedule.id as like_schedule_id, sticker_id
    FROM like_schedule
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
    SELECT like_schedule.id as like_schedule_id, sticker_id
    FROM like_schedule
    WHERE schedule_id = $1
    ORDER BY updated_at DESC
    LIMIT 4
    `,
    [scheduleId],
  );
  return convertSnakeToCamel.keysToCamel(rows);
};

const deleteScheduleByDate = async (client, pillId, date) => {
  const { rows } = await client.query(
    `
    DELETE FROM schedule
    WHERE pill_id = $1 AND schedule_date >= $2
    `,
    [pillId, date],
  );
  return convertSnakeToCamel.keysToCamel(rows);
};

const findAllLikeScheduleByScheduleId = async (client, scheduleId) => {
  const { rows } = await client.query(
    `
    SELECT * FROM like_schedule
    WHERE schedule_id = $1
    `,
    [scheduleId],
  );
  return convertSnakeToCamel.keysToCamel(rows);
};

const findLikeScheduleBySenderId = async (client, scheduleId, senderId) => {
  const { rows } = await client.query(
    `
    SELECT * FROM like_schedule
    WHERE schedule_id = $1 AND sender_id = $2
    `,
    [scheduleId, senderId],
  );
  return convertSnakeToCamel.keysToCamel(rows);
};

// CREATE
/**
 * addSchedule
 * 사용자 약 주기 추가 쿼리
 * @param pillId 해당 약 아이디
 * @param userId 해당 약을 추가하는 유저 아이디
 * @param takeInterval 복용 간격 선택 ex) 매일, 특정 요일, 특정 간격
 * @param date 약 복용 날짜
 * @param day 특정 요일 ex) 월, 수, 금
 * @param specific 특정 간격 ex) 1week
 * @param time 시간 리스트
 * @param start 복용 시작 날짜
 * @param end 복용 종료 날짜
 * @returns 추가된 약의 pillName
 */
const addSchedule = async (
  client,
  pillId,
  userId,
  takeInterval,
  date,
  day,
  specific,
  time,
  start,
  end,
) => {
  try {
    const schedule_date_time = dayjs(date + time, 'YYYY-MM-DDHH:mm:ss').format();

    const { rows } = await client.query(
      `
      INSERT INTO "schedule" (pill_id, user_id, take_interval, schedule_date, schedule_day, schedule_specific, schedule_time, start_date, end_date, is_check, schedule_date_time)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING *
      `,
      [
        pillId,
        userId,
        takeInterval,
        date,
        day,
        specific,
        time,
        start,
        end,
        false,
        schedule_date_time,
      ],
    );
    return convertSnakeToCamel.keysToCamel(rows[0]);
  } catch (error) {
    throw new Error('scheduleDao.addSchedule에서 오류 발생: ' + error);
  }
};

// READ
/**
 * getMyCalendar
 * 내 캘린더 조회 쿼리
 * @param userId - 해당 약 사용자 아이디
 * @param startMonth - 해당 월 시작일
 * @param endMonth - 해당 월 종료일
 */
const getMyCalendar = async (client, userId, startMonth, endMonth) => {
  try {
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
      [userId, startMonth, endMonth],
    );
    return convertSnakeToCamel.keysToCamel(rows);
  } catch (error) {
    throw new Error('scheduleDB.getMyCalendar에서 오류 발생: ' + error);
  }
};

/**
 * getMyScheduleTime
 * 해당 날짜 복약 시간 리스트
 * @param date - 조회할 날짜
 * @param userId - 유저 아이디
 */
const getMyScheduleTime = async (client, userId, date) => {
  try {
    const { rows } = await client.query(
      `
      SELECT schedule_time
      FROM schedule
      WHERE user_id = $1 AND schedule_date = $2
      GROUP BY schedule_time
      `,
      [userId, date],
    );
    return convertSnakeToCamel.keysToCamel(rows);
  } catch (error) {
    throw new Error('scheduleDB.getMyScheduleTime에서 오류 발생: ' + error);
  }
};

/**
 * getMySchedule
 * 해당 날짜 복약 정보 조회
 * @param userId - 해당 유저 아이디
 * @param date - 해당 날짜
 * @param time - 해당 시간
 */
const getMySchedule = async (client, userId, date, time) => {
  try {
    const { rows } = await client.query(
      `
      SELECT s.id as schedule_id, p.id as pill_id, p.pill_name, s.is_check, p.color
      FROM schedule as s JOIN pill p on p.id = s.pill_id
      WHERE p.user_id = $1 AND schedule_date = $2 AND schedule_time = $3
      `,
      [userId, date, time],
    );

    return convertSnakeToCamel.keysToCamel(rows);
  } catch (error) {
    throw new Error('scheduleDB.getMySchedule에서 오류 발생: ' + error);
  }
};

// UPDATE
/**
 * acceptSendPill
 * 타인에게 받은 약 수락 쿼리
 * @param pillId
 * @param userId
 */
const acceptSendPill = async (client, pillId, userId) => {
  try {
    const { rows } = await client.query(
      `
      UPDATE "schedule"
      SET user_id = $1
      WHERE pill_id = $2
      `,
      [userId, pillId],
    );
    return convertSnakeToCamel.keysToCamel(rows[0]);
  } catch (error) {
    throw new Error('scehduleDB.acceptSendPill에서 오류 발생: ' + error);
  }
};

// DELETE

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
  deleteScheduleByDate,
  findAllLikeScheduleByScheduleId,
  findLikeScheduleBySenderId,
  acceptSendPill,
  getMyCalendar,
  getMyScheduleTime,
  getMySchedule,
  updateScheduleSentAt,
};
