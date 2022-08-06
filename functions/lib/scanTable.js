const convertSnakeToCamel = require('./convertSnakeToCamel');

const scanTable = async function* (client, tableName, where, sort, limit) {
  // async generator
  let after = where.after || 0;
  let totalCount = 0;

  while (after !== -1) {
    const rows = await client.query(`
            SELECT *
            FROM ${tableName}
            WHERE ${sort.fieldName} ${sort.direction === 'ASC' ? '>' : '<'} ${after}
            ${where.wheres ? `AND ${where.wheres}` : ''}
            ORDER BY ${sort.fieldName} ${sort.direction}
            LIMIT ${limit}
        `);

    const convertedRows = rows.map((row) => convertSnakeToCamel.keysToCamel(row));

    totalCount += convertedRows.length;
    after =
      convertedRows.length < limit
        ? -1
        : convertedRows?.[convertedRows.length - 1]?.[sort.fieldName];

    yield { after, convertedRows, totalCount };
  }
};

module.exports = {
  scanTable,
};
