const express = require('express');
const router = express.Router();
const { ObjectId } = require('mongodb');
const { getCollection } = require('../config/db');

// PATCH /status/:id - Mark item status as recovered
router.patch('/status/:id', async (req, res) => {
  try {
    const id = req.params.id;
    const allItemCollection = getCollection('Items');
    const query = { _id: new ObjectId(id) };
    const updateDoc = { $set: { status: 'recovered' } };
    const result = await allItemCollection.updateOne(query, updateDoc);
    res.send(result);
  } catch (error) {
    res.status(500).send({ message: 'Error updating status', error });
  }
});

// GET /statistics - Get overview platform metrics
router.get('/statistics', async (req, res) => {
  try {
    const allItemCollection = getCollection('Items');
    const recoveredCollection = getCollection('allRecoveredItems');

    const totalItems = await allItemCollection.countDocuments();
    const lostItems = await allItemCollection.countDocuments({ status: 'notFound' });
    const foundItems = await allItemCollection.countDocuments({ status: 'found' });
    const recoveredItems = await recoveredCollection.countDocuments();

    res.json({
      totalItems,
      lostItems,
      foundItems,
      recoveredItems,
      recoveryRate: totalItems > 0 ? Math.round((recoveredItems / totalItems) * 100) : 0,
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch statistics' });
  }
});

module.exports = router;
