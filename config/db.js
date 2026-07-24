const { MongoClient, ServerApiVersion } = require('mongodb');
require('dotenv').config();

let client = null;

function getDb() {
  if (!client) {
    const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.sth4y.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;
    client = new MongoClient(uri, {
      serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
      }
    });
  }
  return client.db('allItems');
}

function getCollection(collectionName) {
  return getDb().collection(collectionName);
}

module.exports = {
  getDb,
  getCollection,
};
