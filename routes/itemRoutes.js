const express = require('express');
const router = express.Router();
const { ObjectId } = require('mongodb');
const { collections } = require('../config/db');

// GET /items - Home page recent 6 items
router.get('/items', async (req, res) => {
  try {
    const lostItems = await collections.items.find({}).sort({ date: -1 }).limit(6).toArray();
    res.send(lostItems);
  } catch (error) {
    res.status(500).send({ message: 'Error fetching recent items', error: error.message });
  }
});

// GET /allItems - Supports 10-item pagination (?page=1&limit=10)
router.get('/allItems', async (req, res) => {
  try {
    const page = parseInt(req.query.page);
    const limit = parseInt(req.query.limit) || 10;

    if (page) {
      const skip = (page - 1) * limit;
      const items = await collections.items.find({}).skip(skip).limit(limit).toArray();
      const total = await collections.items.countDocuments({});
      return res.send({ items, total, page, totalPages: Math.ceil(total / limit) });
    }

    const allItems = await collections.items.find({}).toArray();
    res.send(allItems);
  } catch (error) {
    res.status(500).send({ message: 'Error fetching all items', error: error.message });
  }
});

// GET /items/:id - Get single item by ID
router.get('/items/:id', async (req, res) => {
  try {
    const id = req.params.id;
    const query = { _id: new ObjectId(id) };
    const result = await collections.items.findOne(query);
    if (!result) {
      return res.status(404).send({ message: 'Item not found' });
    }
    res.send(result);
  } catch (error) {
    res.status(500).send({ message: 'Error fetching item details', error: error.message });
  }
});

module.exports = router;
