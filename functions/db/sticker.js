const _ = require('lodash');
const convertSnakeToCamel = require('../lib/convertSnakeToCamel');

const findStickerList = async (client) => {
  const { rows } = await client.query(
    `
    SELECT id as sticker_id, sticker_img FROM sticker
    
    `,
  );
  return convertSnakeToCamel.keysToCamel(rows);
};

const findStickerListById = async (client, userId, scheduleId) => {
  try {
    const { rows } = await client.query(
      `
      SELECT ls.id, sticker_id
      FROM like_schedule as ls JOIN schedule s on ls.schedule_id = s.id
      WHERE user_id = $1 AND s.id = $2
      `,
      [userId, scheduleId],
    );

    return convertSnakeToCamel.keysToCamel(rows);
  } catch (error) {
    throw new Error('stickerDB.findStickerListById에서 Error 발생: ' + error);
  }
};

module.exports = { findStickerList, findStickerListById };
