const Storage = require('../service/storage')

exports.findItems = async (req, res, dbClient) => {
  const findResult = await Storage.find(req.body, dbClient)

  res.json(findResult)
}

exports.getItem = async (req, res, dbClient) => {
  const getResult = await Storage.get(req.body, dbClient)

  res.json(getResult)
}

exports.insertItem = async (req, res, dbClient) => {
  const insertResult = await Storage.insert(req.body, dbClient)

  res.json(insertResult)
}

exports.updateItem = async (req, res, dbClient) => {
  const updateResult = await Storage.update(req.body, dbClient)

  res.json(updateResult)
}

exports.removeItem = async (req, res, dbClient) => {
  const removeResult = await Storage.remove(req.body, dbClient)

  res.json(removeResult)
}

exports.countItems = async (req, res, dbClient) => {
  const countResult = await Storage.count(req.body, dbClient)

  res.json(countResult)
}
