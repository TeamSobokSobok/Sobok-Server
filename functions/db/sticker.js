const _ = require('lodash');
const convertSnakeToCamel = require('../lib/convertSnakeToCamel');

const findStickerList = async (client) => {
  const { rows } = await client.query(
    `
    SELECT * FROM sticker
    
    `,
  );
  return convertSnakeToCamel.keysToCamel(rows);
};

module.exports = { findStickerList };
