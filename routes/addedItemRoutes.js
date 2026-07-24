const express = require('express');
const router = express.Router();
const { ObjectId } = require('mongodb');
const { collections } = require('../config/db');
const verifyToken = require('../middleware/verifyToken');

// POST /addedItems - Submit new item form
router.post('/addedItems', async (req, res) => {
  try {
    const itemData = req.body;
    const result = await collections.items.insertOne(itemData);
    await collections.added.insertOne(itemData);
    res.status(201).send(result);
  } catch (error) {
    res.status(500).send({ message: 'Error adding item', error: error.message });
  }
});

// GET /addedItems - Get user added items (JWT protected)
router.get('/addedItems', verifyToken, async (req, res) => {
  try {
    const email = req.query.email;
    if (req.user.email !== email) {
      return res.status(403).send('forbidden');
    }
    const addedItems = await collections.added.find({ 'contactInfo.email': email }).toArray();
    res.send(addedItems);
  } catch (error) {
    res.status(500).send({ message: 'Error fetching user items', error: error.message });
  }
});

// GET /addedItems/:id - Get single added item
router.get('/addedItems/:id', async (req, res) => {
  try {
    const id = req.params.id;
    const addedItem = await collections.added.findOne({ _id: new ObjectId(id) });
    if (!addedItem) {
      return res.status(404).send({ error: 'Item not found' });
    }
    res.send(addedItem);
  } catch (error) {
    res.status(500).send({ error: 'Internal server error' });
  }
});

// PUT /addedItems/:id - Update item details
router.put('/addedItems/:id', async (req, res) => {
  try {
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

    const result = await collections.added.updateOne(query, updateDoc);

    if (result.modifiedCount === 1) {
      res.status(200).send({ message: 'Item updated successfully!' });
    } else if (result.matchedCount === 1) {
      res.status(200).send({ message: 'No changes were made to the item.' });
    } else {
      res.status(404).send({ error: 'Item not found.' });
    }
  } catch (error) {
    console.error('Failed to update the item:', error);
    res.status(500).send({ error: 'Internal server error.' });
  }
});

// DELETE /addedItems/:id - Delete item
router.delete('/addedItems/:id', async (req, res) => {
  try {
    const id = req.params.id;
    const result = await collections.added.deleteOne({ _id: new ObjectId(id) });
    res.send(result);
  } catch (error) {
    res.status(500).send({ error: 'Failed to delete item' });
  }
});

module.exports = router;
