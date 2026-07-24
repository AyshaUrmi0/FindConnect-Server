const { MongoClient, ServerApiVersion } = require('mongodb');
require('dotenv').config();

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.sth4y.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

const db = client.db('allItems');

const collections = {
  items: db.collection('Items'),
  recovered: db.collection('allRecoveredItems'),
  added: db.collection('addedItems'),
};

module.exports = {
  client,
  db,
  collections,
};
