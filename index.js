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
app.use(cookieParser());

const verifyToken = (req, res, next) => {
  const token = req.cookies?.token;
  if (!token) return res.status(401).send('Access Denied');

  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) return res.status(401).send('Invalid Token');
    req.user = decoded;
    next();
  });
};

let cachedClient = null;

async function getDatabase() {
  if (cachedClient && cachedClient.topology && cachedClient.topology.isConnected()) {
    return cachedClient.db('allItems');
  }

  const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.sth4y.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

  cachedClient = new MongoClient(uri, {
    serverApi: {
      version: ServerApiVersion.v1,
      strict: true,
      deprecationErrors: true,
    },
    connectTimeoutMS: 10000,
    socketTimeoutMS: 45000,
  });

  await cachedClient.connect();
  return cachedClient.db('allItems');
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

// GET /items
app.get("/items", async (req, res) => {
  try {
    const db = await getDatabase();
    const lostItems = await db.collection("Items").find({}).sort({ date: -1 }).limit(6).toArray();
    res.send(lostItems);
  } catch (err) {
    res.status(500).send({ message: "Error fetching recent items", error: err.message });
  }
});

// GET /allItems (with 10-item pagination support ?page=1&limit=10)
app.get("/allItems", async (req, res) => {
  try {
    const db = await getDatabase();
    const collection = db.collection("Items");
    const page = parseInt(req.query.page);
    const limit = parseInt(req.query.limit) || 10;

    if (page) {
      const skip = (page - 1) * limit;
      const items = await collection.find({}).skip(skip).limit(limit).toArray();
      const total = await collection.countDocuments({});
      return res.send({ items, total, page, totalPages: Math.ceil(total / limit) });
    }

    const allItems = await collection.find({}).toArray();
    res.send(allItems);
  } catch (err) {
    res.status(500).send({ message: "Error fetching all items", error: err.message });
  }
});

app.get('/items/:id', async (req, res) => {
  try {
    const db = await getDatabase();
    const id = req.params.id;
    const result = await db.collection("Items").findOne({ _id: new ObjectId(id) });
    res.send(result);
  } catch (err) {
    res.status(500).send({ error: err.message });
  }
});

// GET & POST /recoveredItems (with 10-item pagination support ?page=1&limit=10)
app.post('/recoveredItems', async (req, res) => {
  try {
    const db = await getDatabase();
    const result = await db.collection("allRecoveredItems").insertOne(req.body);
    res.status(201).send(result); 
  } catch (error) {
    res.status(500).send({ message: "Internal Server Error", error });
  }
});

app.put('/recoveredItems/:id', async (req, res) => {
  try {
    const db = await getDatabase();
    const id = req.params.id;
    const result = await db.collection("Items").updateOne({ _id: new ObjectId(id) }, { $set: { status: "recovered" } });
    res.send(result);
  } catch (err) {
    res.status(500).send({ error: err.message });
  }
});

app.get('/recoveredItems', async (req, res) => {
  try {
    const db = await getDatabase();
    const collection = db.collection("allRecoveredItems");
    const email = req.query.email;
    const page = parseInt(req.query.page);
    const limit = parseInt(req.query.limit) || 10;
    const query = email ? { "email": email } : {};

    if (page) {
      const skip = (page - 1) * limit;
      const items = await collection.find(query).skip(skip).limit(limit).toArray();
      const total = await collection.countDocuments(query);
      return res.send({ items, total, page, totalPages: Math.ceil(total / limit) });
    }

    const recoveredItems = await collection.find(query).toArray();
    res.send(recoveredItems);
  } catch (err) {
    res.status(500).send({ error: err.message });
  }
});

app.patch('/status/:id', async (req, res) => {
  try {
    const db = await getDatabase();
    const id = req.params.id;
    const result = await db.collection("Items").updateOne({ _id: new ObjectId(id) }, { $set: { status: 'recovered' } });
    res.send(result);
  } catch (err) {
    res.status(500).send({ error: err.message });
  }
});  

app.post('/addedItems', async (req, res) => {
  try {
    const db = await getDatabase();
    const itemData = req.body;
    const result = await db.collection("Items").insertOne(itemData);
    await db.collection("addedItems").insertOne(itemData);
    res.status(201).send(result);
  } catch (err) {
    res.status(500).send({ error: err.message });
  }
});

app.get('/addedItems', verifyToken, async (req, res) => {
  try {
    const db = await getDatabase();
    const email = req.query.email;
    if (req.user.email !== email) {
      return res.status(403).send('forbidden');
    }
    const addedItems = await db.collection("addedItems").find({ "contactInfo.email": email }).toArray();
    res.send(addedItems);
  } catch (err) {
    res.status(500).send({ error: err.message });
  }
});

app.get('/addedItems/:id', async (req, res) => {
  try {
    const db = await getDatabase();
    const id = req.params.id;
    const addedItem = await db.collection("addedItems").findOne({ _id: new ObjectId(id) });
    res.send(addedItem);
  } catch (err) {
    res.status(500).send({ error: err.message });
  }
});

app.put('/addedItems/:id', async (req, res) => {
  try {
    const db = await getDatabase();
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

    const result = await db.collection("addedItems").updateOne(query, updateDoc);
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
    const db = await getDatabase();
    const id = req.params.id;
    const result = await db.collection("addedItems").deleteOne({ _id: new ObjectId(id) });
    res.send(result);
  } catch (err) {
    res.status(500).send({ error: err.message });
  }
});

app.get('/statistics', async (req, res) => {
  try {
    const db = await getDatabase();
    const totalItems = await db.collection("Items").countDocuments();
    const lostItems = await db.collection("Items").countDocuments({ status: 'notFound' });
    const foundItems = await db.collection("Items").countDocuments({ status: 'found' });
    const recoveredItems = await db.collection("allRecoveredItems").countDocuments();
    
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

app.get("/", (req, res) => {
  res.send("Server is running..........");
});

if (process.env.NODE_ENV !== 'production') {
  app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
  });
}

module.exports = app;
