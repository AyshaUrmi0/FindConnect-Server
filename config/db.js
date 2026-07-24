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

let dbInstance = null;

async function connectDB() {
  if (!dbInstance) {
    await client.connect();
    dbInstance = client.db('allItems');
    console.log('Successfully connected to MongoDB!');
  }
  return dbInstance;
}

function getCollection(collectionName) {
  if (!dbInstance) {
    dbInstance = client.db('allItems');
  }
  return dbInstance.collection(collectionName);
}

module.exports = {
  client,
  connectDB,
  getCollection,
};
