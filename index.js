const express = require('express');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const bodyParser = require('body-parser');
require('dotenv').config();

const { connectDB } = require('./config/db');

// Route Imports
const authRoutes = require('./routes/authRoutes');
const itemRoutes = require('./routes/itemRoutes');
const addedItemRoutes = require('./routes/addedItemRoutes');
const recoveredRoutes = require('./routes/recoveredRoutes');
const statsRoutes = require('./routes/statsRoutes');

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(
  cors({
    origin: [
      'http://localhost:5173',
      'https://findconnect-45273.web.app',
      'https://findconnect-45273.firebaseapp.com',
    ],
    credentials: true,
  })
);
app.use(express.json());
app.use(cookieParser());
app.use(bodyParser.json());

// Initialize Database Connection
connectDB().catch(console.dir);

// Register Modular Routers
app.use('/', authRoutes);
app.use('/', itemRoutes);
app.use('/', addedItemRoutes);
app.use('/', recoveredRoutes);
app.use('/', statsRoutes);

// Root Health Check Endpoint
app.get('/', (req, res) => {
  res.send('FindConnect Server is running..........');
});

// Start Server (for local testing)
if (process.env.NODE_ENV !== 'production') {
  app.listen(port, () => {
    console.log(`FindConnect Server is running on port ${port}`);
  });
}

// Export Express App for Vercel Serverless Deployment
module.exports = app;
