const express = require('express')
const bodyParser = require('body-parser')
const items = require('./controller/items')
const schemas = require('./controller/schemas')
const provision = require('./controller/provision')
const { wrapError, errorMiddleware } = require('./utils/error-middleware')
const authMiddleware = require('./utils/auth-middleware')
const mongoUtil = require('./client/mongoUtil');
const app = express()
const port = process.env.PORT || 8080


/**
 * @type {import('./service/storage').MongoClient}
 */
let client;

/**
 * Entry point is asynchronous function,
 * 
 * @todo Go through all code and document it - using jsdoc - to allow it to be more easily understood
 */

(async function () {

    client = await mongoUtil.getClient();
    console.log('===MongoDB connected===');

    app.use(bodyParser.json())
    app.use(authMiddleware)

    app.post('/schemas/find', wrapError(schemas.findSchemas, client))
    app.post('/schemas/list', wrapError(schemas.listSchemas, client))
    app.post('/data/find', wrapError(items.findItems, client))
    app.post('/data/get', wrapError(items.getItem, client))
    app.post('/data/insert', wrapError(items.insertItem, client))
    app.post('/data/update', wrapError(items.updateItem, client))
    app.post('/data/remove', wrapError(items.removeItem, client))
    app.post('/data/count', wrapError(items.countItems, client))
    app.post('/provision', wrapError(provision.provision, client))

    app.use(errorMiddleware)

    app.listen(port, () => console.log(`MongoDB adapter listening on port ${port}!`))
});
