const _ = require('lodash');
const convertSnakeToCamel = require('../lib/convertSnakeToCamel');

const getPillIdByUserId = async (client, senderId, receiverId) => {
    const { rows } = await client.query(
        `
        SELECT pill_id FROM send_pill
        WHERE sender_id = $1 AND receiver_id = $2
        `,
        [senderId, receiverId]
    );
    return convertSnakeToCamel.keysToCamel(rows);
};

module.exports = { getPillIdByUserId }