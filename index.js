const jwt = require('jsonwebtoken');
const express = require("express");
const cookieParser = require("cookie-parser");
const cors = require("cors");
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require("dotenv").config();

const app = express();
const port = process.env.PORT || 3000;

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

let client;
let clientPromise;

function getClientPromise() {
  if (!clientPromise) {
    client = new MongoClient(uri, {
      serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
      },
      serverSelectionTimeoutMS: 5000,
      connectTimeoutMS: 5000,
    });
    clientPromise = client.connect();
  }
  return clientPromise;
}

async function getCollection(collectionName) {
  const conn = await getClientPromise();
  return conn.db('allItems').collection(collectionName);
}

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

// GET /items (Home page 6 recent items)
app.get("/items", async (req, res) => {
  try {
    const lostItemCollection = await getCollection("Items");
    const lostItems = await lostItemCollection.find({}).sort({ date: -1 }).limit(6).toArray();
    res.send(lostItems);
  } catch (error) {
    res.status(500).send({ message: "Error fetching items", error: error.message });
  }
});

// GET /allItems
app.get("/allItems", async (req, res) => {
  try {
    const allItemCollection = await getCollection("Items");
    const page = parseInt(req.query.page);
    const limit = parseInt(req.query.limit) || 10;

    if (page) {
      const skip = (page - 1) * limit;
      const items = await allItemCollection.find({}).skip(skip).limit(limit).toArray();
      const total = await allItemCollection.countDocuments({});
      return res.send({ items, total, page, totalPages: Math.ceil(total / limit) });
    }

    const allItems = await allItemCollection.find({}).toArray();
    res.send(allItems);
  } catch (error) {
    res.status(500).send({ message: "Error fetching all items", error: error.message });
  }
});

app.get('/items/:id', async (req, res) => {
  try {
    const lostItemCollection = await getCollection("Items");
    const id = req.params.id;
    const result = await lostItemCollection.findOne({ _id: new ObjectId(id) });
    res.send(result);
  } catch (error) {
    res.status(500).send({ error: error.message });
  }
});

app.post('/recoveredItems', async (req, res) => {
  try {
    const recoveredItemsCollection = await getCollection("allRecoveredItems");
    const result = await recoveredItemsCollection.insertOne(req.body);
    res.status(201).send(result); 
  } catch (error) {
    res.status(500).send({ message: "Internal Server Error", error: error.message });
  }
});

app.put('/recoveredItems/:id', async (req, res) => {
  try {
    const lostItemCollection = await getCollection("Items");
    const id = req.params.id;
    const result = await lostItemCollection.updateOne({ _id: new ObjectId(id) }, { $set: { status: "recovered" } });
    res.send(result);
  } catch (error) {
    res.status(500).send({ error: error.message });
  }
});

app.get('/recoveredItems', async (req, res) => {
  try {
    const recoveredItemsCollection = await getCollection("allRecoveredItems");
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
  } catch (error) {
    res.status(500).send({ error: error.message });
  }
});

app.patch('/status/:id', async (req, res) => {
  try {
    const allItemCollection = await getCollection("Items");
    const id = req.params.id;
    const result = await allItemCollection.updateOne({ _id: new ObjectId(id) }, { $set: { status: 'recovered' } });
    res.send(result);
  } catch (error) {
    res.status(500).send({ error: error.message });
  }
});  

app.post('/addedItems', async (req, res) => {
  try {
    const updateCollection = await getCollection("Items");
    const addedItemsCollection = await getCollection("addedItems");
    const itemData = req.body;
    const result = await updateCollection.insertOne(itemData);
    await addedItemsCollection.insertOne(itemData);
    res.status(201).send(result);
  } catch (error) {
    res.status(500).send({ error: error.message });
  }
});

app.get('/addedItems', verifyToken, async (req, res) => {
  try {
    const addedItemsCollection = await getCollection("addedItems");
    const email = req.query.email;
    if (req.user.email !== req.query.email) {
      return res.status(403).send('forbidden');
    }
    const addedItems = await addedItemsCollection.find({ "contactInfo.email": email }).toArray();
    res.send(addedItems);
  } catch (error) {
    res.status(500).send({ error: error.message });
  }
});

app.get('/addedItems/:id', async (req, res) => {
  try {
    const addedItemsCollection = await getCollection("addedItems");
    const id = req.params.id;
    const addedItem = await addedItemsCollection.findOne({ _id: new ObjectId(id) });
    res.send(addedItem);
  } catch (error) {
    res.status(500).send({ error: error.message });
  }
});

app.put('/addedItems/:id', async (req, res) => {
  try {
    const addedItemsCollection = await getCollection("addedItems");
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
  try {
    const addedItemsCollection = await getCollection("addedItems");
    const id = req.params.id;
    const result = await addedItemsCollection.deleteOne({ _id: new ObjectId(id) });
    res.send(result);
  } catch (error) {
    res.status(500).send({ error: error.message });
  }
});

app.get('/statistics', async (req, res) => {
  try {
    const allItemCollection = await getCollection("Items");
    const recoveredItemsCollection = await getCollection("allRecoveredItems");
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
    res.status(500).json({ error: 'Failed to fetch statistics', details: error.message });
  }
});

app.get("/", (req, res) => {
  res.send("Server is running..........");
});

if (process.env.NODE_ENV !== 'production') {
  app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
  });
}

module.exports = app;
