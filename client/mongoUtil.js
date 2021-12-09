const MongoClient = require('mongodb').MongoClient;
const mongoConfig = require('./mongodbConfig');
const uri = mongoConfig.URI;

module.exports = {
  /**
   * 
   * @param {string} db_name 
   * @param {MongoClient} dbClient 
   * @returns {Db} instance of a MongoDB database
   */
  getDb: (db_name, dbClient) => {
    try {
      return dbClient.db(db_name);
    } catch (e) {
      return e;
    }
  },
  /**
   * 
   * @returns {MongoClient} A MongoDB client instance
   */
  getClient: () => {
    try {
      return new MongoClient(uri, { useUnifiedTopology: true }).connect();
    } catch (e) {
      return e;
    }
  },
};
