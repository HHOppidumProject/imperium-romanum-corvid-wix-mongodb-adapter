const mongoUtil = require('./mongoUtil');


exports.select = (table, clause = '', sortClause = '', skip = 0, limit = 1) =>
  query(
    `SELECT * FROM ${table} ${clause} ${sortClause} LIMIT ${skip}, ${limit}`,
    {},
    identity => identity
  )

exports.insert = (table, item) =>
  query(`INSERT INTO ${table} SET ?`, item, () => item)

exports.update = (table, item) =>
  query(
    `UPDATE ${table} SET ? WHERE _id = ${connection.escape(item._id)}`,
    item,
    () => item
  )

exports.deleteOne = (table, itemId) =>
  query(
    `DELETE FROM ${table} WHERE _id = ${connection.escape(itemId)}`,
    {},
    result => result.affectedRows
  )

exports.count = (table, clause) =>
  query(
    `SELECT COUNT(*) FROM ${table} ${clause}`,
    {},
    result => result[0]['COUNT(*)']
  )

exports.describeDatabase = () =>
  query('SHOW TABLES', {}, async result => {
    const tables = result.map(entry => entry[`Tables_in_${sqlConfig.database}`])

    return Promise.all(
      tables.map(async table => {
        const columns = await describeTable(table)

        return {
          table,
          columns
        }
      })
    )
  })

const describeTable = table =>
  query(`DESCRIBE ${table}`, {}, result => {
    return result.map(entry => {
      return {
        name: entry['Field'],
        type: entry['Type'],
        isPrimary: entry['Key'] === 'PRI'
      }
    })
  })

  exports.query = async (db_name, collectionName, query, dbClient) => {
    // get mongodb collection ref
    const mongo = await mongoUtil.getDb(db_name, dbClient);
    const collRef = mongo.collection(collectionName);
  
    return collRef
      .find(query.filter.query, query.filter.aggregate)
      .sort(query.sort.sort)
      .skip(parseInt(query.skip))
      .limit(parseInt(query.limit))
      .toArray(); // get a promise
  };
