import express from 'express';
import bodyParser from 'body-parser';

const app = express();
app.use(bodyParser.json());

let listings = []; // in-memory store

// Helper to paginate results
function paginate(array, page = 1, limit = 20) {
  const totalResults = array.length;
  const totalPages = Math.ceil(totalResults / limit);
  const start = (page - 1) * limit;
  const end = start + limit;
  return {
    listings: array.slice(start, end),
    pagination: { currentPage: page, totalPages, totalResults, resultsPerPage: limit },
  };
}

// GET /listings
app.get('/listings', (req, res) => {
  const { page = 1, limit = 20, seller, status, category } = req.query;
  let filtered = listings;
  if (seller) filtered = filtered.filter(l => l.seller?.address === seller || l.seller?.name === seller);
  if (status) filtered = filtered.filter(l => l.status === status);
  if (category) filtered = filtered.filter(l => l.category === category);
  res.json(paginate(filtered, Number(page), Number(limit)));
});

// POST /listings
app.post('/listings', (req, res) => {
  const { name, description, category, price, seller, currency = "ETH" } = req.body;
  if (!name || !description || !category || !price || !seller?.address || !seller?.name) {
    return res.status(400).json({ error: "Bad Request", message: "Missing required fields", timestamp: new Date() });
  }
  const listing = {
    listingId: `lst_${Date.now()}`,
    name,
    description,
    category,
    price,
    currency,
    images: [],
    stock: 0,
    status: 'draft',
    seller,
    ipfsMetadata: null,
    blockchain: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  listings.push(listing);
  res.status(201).json(listing);
});

// GET /listings/:listingId
app.get('/listings/:listingId', (req, res) => {
  const listing = listings.find(l => l.listingId === req.params.listingId);
  if (!listing) return res.status(404).json({ error: "Not Found", message: "Listing not found", timestamp: new Date() });
  res.json(listing);
});

// PUT /listings/:listingId
app.put('/listings/:listingId', (req, res) => {
  const listing = listings.find(l => l.listingId === req.params.listingId);
  if (!listing) return res.status(404).json({ error: "Not Found", message: "Listing not found", timestamp: new Date() });

  const { name, description, price, stock, status } = req.body;
  if (name) listing.name = name;
  if (description) listing.description = description;
  if (price) listing.price = price;
  if (stock) listing.stock = stock;
  if (status) listing.status = status;
  listing.updatedAt = new Date().toISOString();

  res.json(listing);
});

// DELETE /listings/:listingId
app.delete('/listings/:listingId', (req, res) => {
  const index = listings.findIndex(l => l.listingId === req.params.listingId);
  if (index === -1) return res.status(404).json({ error: "Not Found", message: "Listing not found", timestamp: new Date() });
  listings.splice(index, 1);
  res.status(204).send();
});

// POST /listings/:listingId/publish
app.post('/listings/:listingId/publish', (req, res) => {
  const listing = listings.find(l => l.listingId === req.params.listingId);
  if (!listing) return res.status(404).json({ error: "Not Found", message: "Listing not found", timestamp: new Date() });
  if (listing.status === 'published') return res.status(409).json({ error: "Conflict", message: "Listing already published", timestamp: new Date() });

  listing.status = 'published';
  listing.updatedAt = new Date().toISOString();
  // Here you could integrate IPFS or blockchain logic
  res.json(listing);
});

// Start server
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
