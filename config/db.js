const { MongoClient, ServerApiVersion } = require('mongodb');
require('dotenv').config();

let client = null;

function getDb() {
  if (!client) {
    const rawUser = (process.env.DB_USER || '').trim();
    const rawPass = (process.env.DB_PASS || '').trim();
    
    // Safely URL-encode credentials if they contain special characters
    const user = rawUser.includes('%') ? rawUser : encodeURIComponent(rawUser);
    const pass = rawPass.includes('%') ? rawPass : encodeURIComponent(rawPass);

    const uri = `mongodb+srv://${user}:${pass}@cluster0.sth4y.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

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
