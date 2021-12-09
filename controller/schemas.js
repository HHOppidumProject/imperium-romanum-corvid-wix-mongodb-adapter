const Schema = require('../service/schema')

/**
 * 
 * @param {JSON} req 
 * @param {JSON} res 
 * @param {MongoClient} dbClient 
 */
exports.findSchemas = async (req, res, dbClient) => {
  const findResult = await Schema.find(req.body, dbClient)

  res.json(findResult)
}

/**
 * 
 * @param {JSON} req 
 * @param {JSON} res 
 * @param {MongoClient} dbClient 
 */
exports.listSchemas = async (req, res, dbClient) => {
  const findResult = await Schema.list(req.body, dbClient)

  res.json(findResult)
}
