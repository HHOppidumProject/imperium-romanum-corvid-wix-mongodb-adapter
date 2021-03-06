const { v4: uuid } = require('uuid');
const BadRequestError = require('../model/error/bad-request')
const NotFoundError = require('../model/error/not-found')

const { parseFilter } = require('./support/filter-parser')
const { parseSort } = require('./support/sort-parser')
const {
  select,
  count,
  insert,
  update,
  deleteOne
} = require('../client/database')

/**
 * @typedef { import("mongodb").MongoClient } MongoClient
 */

/**
 * <h1> Gets a list of items based on a filter. </h1>
 * 
 * Gets the collection name, the filter, number of items to skip from the start, the sort order, and the limit of the number of items to retreive from the request's JSON body.
 * 
 * @param {JSON} payload  The body of the request
 * @param {MongoClient} dbClient  The MongoDB database client
 * 
 * @returns {JSON} JSON result of the items queried and the total count of items returned.
 */
exports.find = async (payload, dbClient) => {

  // Declare variables from the fields in the payload
  const { 
    collectionName, // Get Collection name
    filter, // Get the filter
    sort, // Get the sort order
    skip, // Get the number of items to skip before taking the first item
    limit // Get the maximum amount of items to retreive
  } = payload

  if (!collectionName)
    throw new BadRequestError('Missing collectionName in request body')
  if (!skip && skip !== 0)
    throw new BadRequestError('Missing skip in request body')
  if (!limit) throw new BadRequestError('Missing limit in request body')

  //Parse the filter
  const parsedFilter = parseFilter(filter)

  const [itemsRaw, totalCount] = await Promise.all([
    select(
      collectionName,
      parsedFilter,
      parseSort(sort),
      skip,
      limit
    ),
    count(collectionName, parsedFilter)
  ]);

  const items = itemsRaw.map(wrapDates)

  return { items, totalCount }
}

exports.get = async payload => {
  const { collectionName, itemId } = payload
  if (!collectionName)
    throw new BadRequestError('Missing collectionName in request body')
  if (!itemId) throw new BadRequestError('Missing itemId in request body')

  const item = (await select(collectionName, `WHERE _id = '${itemId}'`))
    .map(wrapDates)
    .shift()

  if (!item) {
    throw new NotFoundError(`Item with id ${itemId} not found.`)
  }

  return { item }
}

exports.insert = async payload => {

  const { collectionName, item } = payload
  
  if (!collectionName)
    throw new BadRequestError('Missing collectionName in request body')
  if (!item) throw new BadRequestError('Missing item in request body')

  if (!item._id) item._id = uuid()

  const inserted = wrapDates(await insert(collectionName, extractDates(item), collectionName));

  return { item: inserted }
}

exports.update = async payload => {
  const { collectionName, item } = payload
  if (!collectionName)
    throw new BadRequestError('Missing collectionName in request body')
  if (!item) throw new BadRequestError('Missing item in request body')

  const updated = wrapDates(await update(collectionName, extractDates(item), collectionName));

  return { item: updated }
}

exports.remove = async payload => {
  const { collectionName, itemId } = payload
  if (!collectionName)
    throw new BadRequestError('Missing collectionName in request body')
  if (!itemId) throw new BadRequestError('Missing itemId in request body')

  const item = (await select(collectionName, `WHERE _id = '${itemId}'`))
    .map(wrapDates)
    .shift()
  const itemsChanged = await deleteOne(collectionName, itemId)

  if (!itemsChanged || !item) {
    throw new NotFoundError(`Item with id ${itemId} does not exist.`)
  }

  return { item }
}

exports.count = async payload => {
  const { collectionName, filter } = payload
  if (!collectionName)
    throw new BadRequestError('Missing collectionName in request body')

  const totalCount = await count(collectionName, parseFilter(filter))

  return { totalCount }
}

const extractDates = item => {
  Object.keys(item).map(key => {
    const value = item[key];
    if (value === null) return;

    const reISO = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2}(?:\.\d*))(?:Z|(\+|-)([\d|:]*))?$/;

    if (typeof value === 'object' && '$date' in value) {
      item[key] = new Date(value['$date']);
    }

    if (typeof value === 'string') {
      const re = reISO.exec(value);
      if (re) {
        item[key] = new Date(value);
      }
    }
  })

  return item
}

const wrapDates = item => {
  Object.keys(item)
    .map(key => {
      if (item[key] instanceof Date) {
        item[key] = { $date: item[key] }
      }
    })

  return item
}