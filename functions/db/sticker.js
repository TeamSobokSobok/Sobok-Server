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

module.exports = { findStickerList };
