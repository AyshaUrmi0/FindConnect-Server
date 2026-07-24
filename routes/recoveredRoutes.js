const express = require('express');
const router = express.Router();
const { ObjectId } = require('mongodb');
const { getCollection } = require('../config/db');

// POST /recoveredItems - Add recovered item record
router.post('/recoveredItems', async (req, res) => {
  try {
    const recoveredCollection = getCollection('allRecoveredItems');
    const recoveryData = req.body;
    const result = await recoveredCollection.insertOne(recoveryData);
    res.status(201).send(result);
  } catch (error) {
    console.error('Error inserting recovered item:', error);
    res.status(500).send({ message: 'Internal Server Error', error });
  }
});

// PUT /recoveredItems/:id - Update item status to recovered
router.put('/recoveredItems/:id', async (req, res) => {
  try {
    const itemsCollection = getCollection('Items');
    const id = req.params.id;
    const query = { _id: new ObjectId(id) };
    const updateDoc = { $set: { status: 'recovered' } };
    const result = await itemsCollection.updateOne(query, updateDoc);
    res.send(result);
  } catch (error) {
    res.status(500).send({ message: 'Error updating recovery status', error });
  }
});

// GET /recoveredItems - Get all or user-specific recovered items with pagination
router.get('/recoveredItems', async (req, res) => {
  try {
    const recoveredCollection = getCollection('allRecoveredItems');
    const email = req.query.email;
    const page = parseInt(req.query.page);
    const limit = parseInt(req.query.limit) || 10;
    const query = email ? { email } : {};

    if (page) {
      const skip = (page - 1) * limit;
      const items = await recoveredCollection.find(query).skip(skip).limit(limit).toArray();
      const total = await recoveredCollection.countDocuments(query);
      return res.send({ items, total, page, totalPages: Math.ceil(total / limit) });
    }

    const recoveredItems = await recoveredCollection.find(query).toArray();
    res.send(recoveredItems);
  } catch (error) {
    res.status(500).send({ message: 'Error fetching recovered items', error });
  }
});

module.exports = router;
