const express = require('express');
const router = express.Router();
const listingController = require('../controllers/listing.controller.js');

// List all listings
router.get('/', listingController.listListings);

// Get single listing
router.get('/:id', listingController.getListing);

// Create new listing
router.post('/', listingController.createListing);

// Update listing
router.put('/:id', listingController.updateListing);

// Delete listing
router.delete('/:id', listingController.deleteListing);

module.exports = router;
