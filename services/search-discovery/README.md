# Nozama Search & Discovery API

A comprehensive search and discovery service for the blockchain-based e-commerce platform. This service provides advanced product search, category browsing, trending discovery, and search suggestions with integration to blockchain product registry and IPFS metadata.

## Features

- **Advanced Product Search**: Full-text search with filtering by category, price, seller reputation, and more
- **Category Management**: Hierarchical category browsing with subcategories
- **Trending Discovery**: Algorithm-based trending products using views, sales, and recency
- **Search Suggestions**: Real-time search autocomplete and suggestions
- **Blockchain Integration**: Product data synced from smart contracts
- **IPFS Metadata**: Product images and metadata resolved from IPFS
- **Performance Optimized**: MongoDB indexes and aggregation pipelines for fast queries
- **Scalable Architecture**: Built with TypeScript, Express.js, and MongoDB

## API Endpoints

### Search Endpoints
- `GET /api/v1/search` - Advanced product search with filters
- `GET /api/v1/search/trending` - Get trending products
- `GET /api/v1/search/products/:productId` - Get product by ID
- `GET /api/v1/search/suggestions` - Get search suggestions

### Category Endpoints
- `GET /api/v1/categories` - Get all categories
- `GET /api/v1/categories/:categoryId` - Get category details
- `GET /api/v1/categories/:categoryId/products` - Get products in category

### Health & Monitoring
- `GET /health` - Health check endpoint
- `GET /health/ready` - Readiness probe
- `GET /health/live` - Liveness probe

## Quick Start

### Prerequisites

- Node.js 18+ and npm
- MongoDB Atlas connection (or local MongoDB)
- Populated blockchain data and sample products

### Installation

1. **Install dependencies:**
   ```bash
   cd services/search-discovery
   npm install
   ```

2. **Set up environment variables:**
   ```bash
   cp .env.example .env
   # Edit .env with your MongoDB Atlas connection string and other config
   ```

3. **Ensure MongoDB is populated:**
   ```bash
   # From project root
   cd scripts
   npm install
   node populate-mongodb.js
   ```

4. **Build the TypeScript code:**
   ```bash
   npm run build
   ```

5. **Start the service:**
   ```bash
   npm start
   # or for development:
   npm run dev
   ```

The API will be available at `http://localhost:3002`

### Testing the API

Run the comprehensive test suite:

```bash
# Make sure the API is running first
npm test

# Or run the simple test script:
node test-api.js
```

## Configuration

Key environment variables in `.env`:

```bash
# Server Configuration
PORT=3002
NODE_ENV=development
API_VERSION=v1

# Database (MongoDB Atlas)
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/database
MONGODB_DB_NAME=nozama-search

# Blockchain Configuration
BLOCKCHAIN_RPC_URL=http://localhost:8545
PRODUCT_REGISTRY_ADDRESS=0x...
REPUTATION_CONTRACT_ADDRESS=0x...

# IPFS Configuration
IPFS_GATEWAY_URL=https://ipfs.io/ipfs/
PINATA_API_KEY=your_pinata_key
PINATA_SECRET_KEY=your_pinata_secret

# API Limits
DEFAULT_PAGE_SIZE=20
MAX_PAGE_SIZE=100
SEARCH_TIMEOUT_MS=5000
RATE_LIMIT_MAX_REQUESTS=100
```

## API Usage Examples

### Search Products

```bash
# Search all products
curl "http://localhost:3002/api/v1/search"

# Search with query
curl "http://localhost:3002/api/v1/search?q=smartphone"

# Advanced search with filters
curl "http://localhost:3002/api/v1/search?q=laptop&category=electronics&minPrice=500&maxPrice=2000&verified=true&sortBy=price_asc"

# Pagination
curl "http://localhost:3002/api/v1/search?page=2&limit=10"
```

### Browse Categories

```bash
# Get all categories
curl "http://localhost:3002/api/v1/categories"

# Get category details
curl "http://localhost:3002/api/v1/categories/electronics"

# Get products in category
curl "http://localhost:3002/api/v1/categories/electronics/products?sortBy=popularity"
```

### Trending & Discovery

```bash
# Get trending products
curl "http://localhost:3002/api/v1/search/trending"

# Trending in specific timeframe and category
curl "http://localhost:3002/api/v1/search/trending?timeframe=7d&category=fashion&limit=5"

# Search suggestions
curl "http://localhost:3002/api/v1/search/suggestions?q=iph"
```

### Product Details

```bash
# Get product by ID
curl "http://localhost:3002/api/v1/search/products/1"
```

## Database Schema

### Products Collection
```javascript
{
  productId: String,           // Unique product identifier
  name: String,               // Product name (searchable)
  description: String,        // Product description (searchable)
  price: Number,              // Price in ETH
  priceUSD: Number,           // Price in USD
  category: String,           // Main category
  subcategory: String,        // Subcategory
  tags: [String],             // Search tags
  stock: Number,              // Available quantity
  views: Number,              // View count for trending
  sales: Number,              // Sales count for trending
  featured: Boolean,          // Featured flag
  isActive: Boolean,          // Active status
  seller: {                   // Seller information
    address: String,          // Blockchain address
    did: String,              // Decentralized ID
    name: String,            // Seller name
    reputation: Number,       // Reputation score (0-100)
    verified: Boolean,        // Verified seller
    totalSales: Number       // Total sales count
  },
  blockchain: {               // Blockchain data
    network: String,          // Blockchain network
    contractAddress: String,  // Smart contract address
    tokenId: String,         // NFT token ID
    transactionHash: String, // Creation transaction
    blockNumber: Number      // Block number
  },
  images: [{                 // IPFS images
    cid: String,             // IPFS content ID
    url: String,             // Gateway URL
    thumbnail: String        // Thumbnail CID
  }],
  createdAt: Date,
  updatedAt: Date
}
```

### Categories Collection
```javascript
{
  id: String,                 // Category ID
  name: String,              // Category name
  description: String,       // Category description
  productCount: Number,      // Number of products
  subcategories: [{          // Nested subcategories
    id: String,
    name: String,
    description: String,
    productCount: Number,
    parentCategory: String
  }],
  icon: String,              // IPFS icon CID
  createdAt: Date,
  updatedAt: Date
}
```

## Performance & Scalability

### Database Indexes
- Text search index on `name`, `description`, `tags`
- Compound indexes for common query patterns
- Single field indexes on filtering fields

### Trending Algorithm
```javascript
trendingScore = 
  Math.log(views + 1) * 10 +     // Logarithmic view score
  sales * 5 +                    // Linear sales score  
  (featured ? 20 : 0) +          // Featured boost
  recentBoost                    // Time-based boost for new products
```

### Rate Limiting
- 100 requests per 15-minute window per IP
- Configurable via environment variables

## Architecture Integration

This service integrates with other microservices:

- **Storefront Service**: Receives product creation events
- **Order Management**: Updates sales counts
- **Identity & Reputation**: Fetches seller reputation data
- **Blockchain Indexer**: Syncs product registry events

## Development

### Project Structure
```
services/search-discovery/
├── src/
│   ├── config/           # Configuration management
│   ├── models/           # MongoDB schemas
│   ├── routes/           # API route handlers  
│   ├── utils/            # Utility functions
│   ├── server.ts         # Express server setup
│   └── index.ts          # Application entry point
├── test-api.js           # Simple API test
├── package.json          # Dependencies and scripts
└── README.md             # This file
```

### Available Scripts

```bash
npm run build       # Build TypeScript to JavaScript
npm run start       # Start production server
npm run dev         # Start development server with hot reload
npm run test        # Run test suite
npm run lint        # Run ESLint
npm run clean       # Clean build directory
```

### Adding New Features

1. **New Search Filters**: Add filter logic in `Product.searchProducts()` static method
2. **New Endpoints**: Create route files in `src/routes/` and register in `server.ts`
3. **Database Changes**: Update models in `src/models/` and add migration scripts
4. **Performance**: Add new indexes in `populate-mongodb.js`

## Monitoring & Logging

- Winston logging with configurable levels
- Health check endpoints for Kubernetes
- Performance metrics collection
- Error tracking and monitoring

## Security

- Helmet.js for security headers
- CORS configuration
- Rate limiting
- Input validation and sanitization
- MongoDB query sanitization

## Deployment

The service is containerized and can be deployed to:
- Kubernetes clusters
- Docker Swarm
- Cloud platforms (AWS, GCP, Azure)

See `Dockerfile` and deployment manifests in the deployment directory.

## License

This project is part of the Nozama blockchain e-commerce platform.
