const express = require('express');
const router = express.Router();
const { ObjectId } = require('mongodb');
const { collections } = require('../config/db');

// PATCH /status/:id - Mark item status as recovered
router.patch('/status/:id', async (req, res) => {
  try {
    const id = req.params.id;
    const query = { _id: new ObjectId(id) };
    const updateDoc = { $set: { status: 'recovered' } };
    const result = await collections.items.updateOne(query, updateDoc);
    res.send(result);
  } catch (error) {
    res.status(500).send({ message: 'Error updating status', error: error.message });
  }
});

// GET /statistics - Get overview platform metrics
router.get('/statistics', async (req, res) => {
  try {
    const totalItems = await collections.items.countDocuments();
    const lostItems = await collections.items.countDocuments({ status: 'notFound' });
    const foundItems = await collections.items.countDocuments({ status: 'found' });
    const recoveredItems = await collections.recovered.countDocuments();

    res.json({
      totalItems,
      lostItems,
      foundItems,
      recoveredItems,
      recoveryRate: totalItems > 0 ? Math.round((recoveredItems / totalItems) * 100) : 0,
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch statistics', details: error.message });
  }
});

module.exports = router;
