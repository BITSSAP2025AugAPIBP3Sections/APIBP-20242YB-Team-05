const mongoose = require('mongoose');

const ListingSchema = new mongoose.Schema({
  listingId: { type: String, unique: true },
  name: String,
  description: String,
  category: String,
  price: Number,
  currency: { type: String, default: 'ETH' },
  images: [{ cid: String, url: String }],
  stock: { type: Number, default: 0 },
  status: { type: String, enum: ['draft','published','archived'], default: 'draft' },
  seller: {
    address: String,
    did: String,
    name: String,
    reputation: Number,
    verified: Boolean
  },
  ipfsMetadata: { cid: String, url: String },
  blockchain: {
    network: String,
    contractAddress: String,
    tokenId: String,
    transactionHash: String
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Auto-generate listingId if missing
ListingSchema.pre('save', function(next) {
  if (!this.listingId) {
    this.listingId = `lst_${Math.random().toString(36).substring(2, 10)}${Date.now().toString(36)}`;
  }
  next();
});

module.exports = mongoose.model('Listing', ListingSchema);
