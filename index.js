const jwt = require('jsonwebtoken');
const express = require("express");
const cookieParser = require("cookie-parser");
const cors = require("cors");
const app = express();
const port = process.env.PORT || 3000;
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require("dotenv").config();

app.use(cors({
  origin: [
    'http://localhost:5173',
    'https://findconnect-45273.web.app',
    'https://findconnect-45273.firebaseapp.com',
  ], 
  credentials: true
}));
app.use(express.json());

const bodyParser = require('body-parser');
app.use(cookieParser());
app.use(bodyParser.json());

const verifyToken = (req, res, next) => {
  const token = req.cookies?.token;
  if (!token) return res.status(401).send('Access Denied');

  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) return res.status(401).send('Invalid Token');
    req.user = decoded;
    next();
  });
};

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.sth4y.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
    const lostItemCollection = client.db("allItems").collection("Items");
    const allItemCollection = client.db("allItems").collection("Items");
    const recoveredItemsCollection = client.db("allItems").collection("allRecoveredItems");
    const addedItemsCollection = client.db('allItems').collection('addedItems');
    const updateCollection = client.db('allItems').collection('Items');

    // JWT
    app.post('/jwt', (req, res) => {
      const user = req.body;
      const token = jwt.sign(user, process.env.JWT_SECRET, { expiresIn: '10h' });
      res.cookie('token', token, { 
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",
      }).send({ success: true });
    });

    app.post('/logout', (req, res) => {
      res.clearCookie('token', {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",
      }).send({ success: true });
    });

    // GET /items (Home page recent items)
    app.get("/items", async (req, res) => {
      const cursor = lostItemCollection.find({}).sort({ date: -1 }).limit(6);
      const lostItems = await cursor.toArray();
      res.send(lostItems);
    });

    // GET /allItems (with 10-item pagination support ?page=1&limit=10)
    app.get("/allItems", async (req, res) => {
      const page = parseInt(req.query.page);
      const limit = parseInt(req.query.limit) || 10;

      if (page) {
        const skip = (page - 1) * limit;
        const items = await allItemCollection.find({}).skip(skip).limit(limit).toArray();
        const total = await allItemCollection.countDocuments({});
        return res.send({ items, total, page, totalPages: Math.ceil(total / limit) });
      }

      const cursor = allItemCollection.find({});
      const allItems = await cursor.toArray();
      res.send(allItems);
    });

    app.get('/items/:id', async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await lostItemCollection.findOne(query);
      res.send(result);
    });

    // POST /recoveredItems
    app.post('/recoveredItems', async (req, res) => {
      try {
        const recoveryData = req.body;
        const result = await recoveredItemsCollection.insertOne(recoveryData);
        res.status(201).send(result); 
      } catch (error) {
        res.status(500).send({ message: "Internal Server Error", error });
      }
    });

    app.put('/recoveredItems/:id', async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const updateDoc = { $set: { status: "recovered" } };
      const result = await lostItemCollection.updateOne(query, updateDoc);
      res.send(result);
    });

    // GET /recoveredItems (with 10-item pagination support ?page=1&limit=10)
    app.get('/recoveredItems', async (req, res) => {
      const email = req.query.email;
      const page = parseInt(req.query.page);
      const limit = parseInt(req.query.limit) || 10;
      const query = email ? { "email": email } : {};

      if (page) {
        const skip = (page - 1) * limit;
        const items = await recoveredItemsCollection.find(query).skip(skip).limit(limit).toArray();
        const total = await recoveredItemsCollection.countDocuments(query);
        return res.send({ items, total, page, totalPages: Math.ceil(total / limit) });
      }

      const recoveredItems = await recoveredItemsCollection.find(query).toArray();
      res.send(recoveredItems);
    });

    app.patch('/status/:id', async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const updateDoc = { $set: { status: 'recovered' } };
      const result = await allItemCollection.updateOne(query, updateDoc);
      res.send(result);
    });  

    app.post('/addedItems', async (req, res) => {
      const itemData = req.body;
      const result = await updateCollection.insertOne(itemData);
      await addedItemsCollection.insertOne(itemData);
      res.status(201).send(result);
    });

    app.get('/addedItems', verifyToken, async (req, res) => {
      const email = req.query.email;
      if (req.user.email !== req.query.email) {
        return res.status(403).send('forbidden');
      }
      const addedItems = await addedItemsCollection.find({ "contactInfo.email": email }).toArray();
      res.send(addedItems);
    });

    app.get('/addedItems/:id', async (req, res) => {
      const id = req.params.id;
      const addedItem = await addedItemsCollection.findOne({ _id: new ObjectId(id) });
      res.send(addedItem);
    });

    app.put('/addedItems/:id', async (req, res) => {
      const id = req.params.id; 
      const updatedItem = req.body; 
      const query = { _id: new ObjectId(id) }; 
      const updateDoc = {
        $set: {
          postType: updatedItem.postType, 
          title: updatedItem.title,       
          description: updatedItem.description, 
          category: updatedItem.category,  
          location: updatedItem.location, 
          date: new Date(updatedItem.date), 
        },
      };

      try {
        const result = await addedItemsCollection.updateOne(query, updateDoc);
        if (result.modifiedCount === 1) {
          res.status(200).send({ message: 'Item updated successfully!' });
        } else if (result.matchedCount === 1) {
          res.status(200).send({ message: 'No changes were made to the item.' });
        } else {
          res.status(404).send({ error: 'Item not found.' });
        }
      } catch (error) {
        res.status(500).send({ error: 'Internal server error.' });
      }
    });

    app.delete('/addedItems/:id', async (req, res) => {
      const id = req.params.id;
      const result = await addedItemsCollection.deleteOne({ _id: new ObjectId(id) });
      res.send(result);
    });

    app.get('/statistics', async (req, res) => {
      try {
        const totalItems = await allItemCollection.countDocuments();
        const lostItems = await allItemCollection.countDocuments({ status: 'notFound' });
        const foundItems = await allItemCollection.countDocuments({ status: 'found' });
        const recoveredItems = await recoveredItemsCollection.countDocuments();
        
        res.json({
          totalItems,
          lostItems,
          foundItems,
          recoveredItems,
          recoveryRate: totalItems > 0 ? Math.round((recoveredItems / totalItems) * 100) : 0
        });
      } catch (error) {
        res.status(500).json({ error: 'Failed to fetch statistics' });
      }
    });

  } finally {}
}

run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("Server is running..........");
});

if (process.env.NODE_ENV !== 'production') {
  app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
  });
}

module.exports = app;
