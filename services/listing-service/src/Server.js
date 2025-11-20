const express = require('express');
const listingRoutes = require('./routes/listings.routes.js');

const app = express();
app.use(express.json());

// Health endpoint
app.get('/health', (req, res) => res.json({ status: 'ok' }));

// Listings routes
app.use('/api/v1/listings', listingRoutes);

module.exports = app;
