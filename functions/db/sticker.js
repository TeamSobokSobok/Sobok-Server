const _ = require('lodash');
const convertSnakeToCamel = require('../lib/convertSnakeToCamel');

// CREATE

// READ
const findStickerListById = async (client, userId, scheduleId) => {
  try {
    const { rows } = await client.query(
      `
      SELECT ls.id, sticker_id
      FROM like_schedule AS ls JOIN schedule s ON ls.schedule_id = s.id
      WHERE user_id = $1 AND s.id = $2
      `,
      [userId, scheduleId],
    );

    return convertSnakeToCamel.keysToCamel(rows);
  } catch (error) {
    throw new Error('stickerDB.findStickerListById에서 Error 발생: ' + error);
  }
};

// UPDATE

// DELETE

const findStickerList = async (client) => {
  const { rows } = await client.query(
    `
    SELECT id as sticker_id, sticker_img 
    FROM sticker
    
    `,
  );
  return convertSnakeToCamel.keysToCamel(rows);
};

const deleteStickerByUserId = async (client, userId) => {
  await client.query(
    `
    DELETE FROM like_schedule
    WHERE sender_id = $1
    `,
    [userId],
  );
};

module.exports = { findStickerList, findStickerListById, deleteStickerByUserId };
