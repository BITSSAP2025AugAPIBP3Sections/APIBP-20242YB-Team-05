const Listing = require('../models/Listing.js');

// List all listings
exports.listListings = async (req, res) => {
  try {
    const listings = await Listing.find();
    res.json({ listings });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get a single listing by ID
exports.getListing = async (req, res) => {
  try {
    const listing = await Listing.findById(req.params.id);
    if (!listing) return res.status(404).json({ error: 'Listing not found' });
    res.json(listing);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Create a new listing
exports.createListing = async (req, res) => {
  try {
    const newListing = new Listing(req.body);
    await newListing.save();
    res.status(201).json(newListing);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// Update a listing by ID
exports.updateListing = async (req, res) => {
  try {
    const updatedListing = await Listing.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!updatedListing) return res.status(404).json({ error: 'Listing not found' });
    res.json(updatedListing);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// Delete a listing by ID
exports.deleteListing = async (req, res) => {
  try {
    const deleted = await Listing.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ error: 'Listing not found' });
    res.json({ message: 'Listing deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
