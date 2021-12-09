const BadRequestError = require('../../model/error/bad-request')
const mysql = require('mysql')

const EMPTY = ''

/**
 * 
 * Takes in a JSON representing the query to parse and transforms the filter into a string that can be interpreted as an instruction to the database.
 * 
 * * For a __combined__ filter to be considered it must have a logical operator embedded (AND, OR and NOT are supported).
 * * For a __basic__ filter to be considered it must have a query operation embedded:
 *    * EQ - Equal to
 *    * NE - Not equal to
 *    * LT - Less than
 *    * GT - Greater than
 *    * GTE - Greater than or equal to
 * 
 * @param {JSON} filter the filter to evaluate
 * @returns {JSON} the query to execute the parsed filter
 */
exports.parseFilter = filter => {

  /*
  * Check if the filter fulfils the minimum requirements to be passed:
  * * Exists
  * * Has an operator
  *
  */
  if (filter && filter.operator) {
    return parseInternal(filter);
  }

  return EMPTY
}

/**
 * 
 * @todo MIGRATE ALL STRING TO JSON REQUEST IN COMPLIANCE WITH [MONGO DB SPEC](https://docs.mongodb.com/manual/reference/operator/query/)
 * 
 * @param {JSON} filter the filter to evaluate
 * @returns {JSON} the result of the parse
 */
const parseInternal = filter => {

  // If the filter doesn't exist or the operator is undefined
  if (!filter || filter.operator === undefined) {
    return "TRUE = TRUE";
  }

  switch (filter.operator) {
    case '$and': {
      const value = filter.value.map(parseInternal).join(' AND ')
      return value ? `(${value})` : value
    }
    case '$or': {
      const value = filter.value.map(parseInternal).join(' OR ')
      return value ? `(${value})` : value
    }
    case '$not': {
      const value = parseInternal(filter.value[0])
      return value ? `NOT (${value})` : value
    }
    case '$ne':
      return `${filter.fieldName} <> ${mysql.escape(mapValue(filter.value))}`
    case '$lt':
      return `${filter.fieldName} < ${mysql.escape(mapValue(filter.value))}`
    case '$lte':
      return `${filter.fieldName} <= ${mysql.escape(mapValue(filter.value))}`
    case '$gt':
      return `${filter.fieldName} > ${mysql.escape(mapValue(filter.value))}`
    case '$gte':
      return `${filter.fieldName} >= ${mysql.escape(mapValue(filter.value))}`
    case '$hasSome': {
      const list = filter.value
        .map(mapValue)
        .map(date => mysql.escape(date, null, null))
        .join(', ')
      return list ? `${filter.fieldName} IN (${list})` : EMPTY
    }
    case '$contains':
      if (!filter.value || (filter.value && filter.value.length === 0)) {
        return '';
      }
      return `${filter.fieldName} LIKE ${mysql.escape(`%${filter.value}%`)}`
    case '$urlized': {
      const list = filter.value.map(s => s.toLowerCase()).join('[- ]')
      return list ? `LOWER(${filter.fieldName}) RLIKE '${list}'` : EMPTY
    }
    case '$startsWith':
      return `${filter.fieldName} LIKE ${mysql.escape(`${filter.value}%`)}`
    case '$endsWith':
      return `${filter.fieldName} LIKE ${mysql.escape(`%${filter.value}`)}`
    case '$eq': {
      return filter.value === null || filter.value === undefined
        ? `${filter.fieldName} IS NULL`
        : `${filter.fieldName} = ${mysql.escape(mapValue(filter.value))}`
    }
    default:
      throw new BadRequestError(
        `Filter of type ${filter.operator} is not supported.`
      )
  }
}

const mapValue = value => {

  if (value === null || value === undefined) return null;

  const reISO = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2}(?:\.\d*))(?:Z|(\+|-)([\d|:]*))?$/;

  if (typeof value === 'object' && '$date' in value) {
    return new Date(value['$date']);
  }

  if (typeof value === 'string') {
    const re = reISO.exec(value);
    if (re) {
      return new Date(value);
    }
  }

  return value;
}