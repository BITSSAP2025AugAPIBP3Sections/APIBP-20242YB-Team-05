import mongoose, { Schema, Document, Model } from 'mongoose';

// Interface for TypeScript
export interface IProduct extends Document {
  productId: string;
  name: string;
  description: string;
  price: number;
  priceUSD: number;
  category: string;
  subcategory?: string;
  tags: string[];
  stock: number;
  views: number;
  sales: number;
  featured: boolean;
  isActive: boolean;
  seller: {
    address: string;
    did: string;
    name: string;
    reputation: number;
    verified: boolean;
    totalSales: number;
  };
  blockchain: {
    network: string;
    contractAddress: string;
    tokenId: string;
    transactionHash: string;
    blockNumber: number;
  };
  images: Array<{
    cid: string;
    url: string;
    thumbnail: string;
  }>;
  createdAt: Date;
  updatedAt: Date;
  incrementViews(): Promise<IProduct>;
  incrementSales(): Promise<IProduct>;
}

export interface IProductModel extends Model<IProduct> {
  searchProducts(searchParams: any): Promise<IProduct[]>;
}

// MongoDB Schema
const ProductSchema: Schema = new Schema({
  productId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  description: {
    type: String,
    required: true,
    trim: true,
    maxlength: 2000
  },
  price: {
    type: Number,
    required: true,
    min: 0
  },
  priceUSD: {
    type: Number,
    required: true,
    min: 0
  },
  category: {
    type: String,
    required: true,
    index: true
  },
  subcategory: {
    type: String,
    index: true
  },
  tags: [{
    type: String,
    trim: true
  }],
  stock: {
    type: Number,
    required: true,
    min: 0,
    default: 0
  },
  views: {
    type: Number,
    default: 0,
    min: 0
  },
  sales: {
    type: Number,
    default: 0,
    min: 0
  },
  featured: {
    type: Boolean,
    default: false,
    index: true
  },
  isActive: {
    type: Boolean,
    default: true,
    index: true
  },
  seller: {
    address: {
      type: String,
      required: true,
      index: true
    },
    did: {
      type: String,
      required: true
    },
    name: {
      type: String,
      required: true,
      trim: true
    },
    reputation: {
      type: Number,
      min: 0,
      max: 100,
      index: true
    },
    verified: {
      type: Boolean,
      default: false,
      index: true
    },
    totalSales: {
      type: Number,
      default: 0,
      min: 0
    }
  },
  blockchain: {
    network: {
      type: String,
      required: true,
      enum: ['Ethereum', 'Polygon', 'Arbitrum', 'localhost']
    },
    contractAddress: {
      type: String,
      required: true
    },
    tokenId: {
      type: String,
      required: true
    },
    transactionHash: {
      type: String,
      required: true
    },
    blockNumber: {
      type: Number,
      required: true
    }
  },
  images: [{
    cid: {
      type: String,
      required: true
    },
    url: {
      type: String,
      required: true
    },
    thumbnail: {
      type: String,
      required: true
    }
  }]
}, {
  timestamps: true,
  collection: 'products'
});

// Compound indexes for better query performance
ProductSchema.index({ category: 1, price: 1 });
ProductSchema.index({ category: 1, 'seller.reputation': -1 });
ProductSchema.index({ featured: 1, views: -1 });
ProductSchema.index({ isActive: 1, createdAt: -1 });
ProductSchema.index({ 'seller.verified': 1, 'seller.reputation': -1 });

// Text index for search functionality
ProductSchema.index({ 
  name: 'text', 
  description: 'text', 
  tags: 'text' 
}, {
  weights: {
    name: 10,
    description: 5,
    tags: 1
  },
  name: 'text_search_index'
});

// Virtual for trending score calculation
ProductSchema.virtual('trendingScore').get(function(this: IProduct) {
  const viewScore = Math.log(this.views + 1) * 10;
  const salesScore = this.sales * 5;
  const recentBoost = this.featured ? 20 : 0;
  const timeBoost = this.createdAt ? Math.max(0, 30 - Math.floor((Date.now() - this.createdAt.getTime()) / (1000 * 60 * 60 * 24))) : 0;
  
  return Math.round(viewScore + salesScore + recentBoost + timeBoost);
});

// Methods
ProductSchema.methods.incrementViews = function() {
  this.views += 1;
  return this.save();
};

ProductSchema.methods.incrementSales = function() {
  this.sales += 1;
  return this.save();
};

// Static methods for search queries
ProductSchema.statics.searchProducts = function(searchParams: any) {
  const {
    query,
    category,
    tags,
    minPrice,
    maxPrice,
    minReputation,
    verified,
    sortBy = 'popularity',
    page = 1,
    limit = 20
  } = searchParams;

  const filter: any = { isActive: true };

  // Text search
  if (query) {
    filter.$text = { $search: query };
  }

  // Category filter
  if (category) {
    filter.category = category;
  }

  // Tags filter
  if (tags && tags.length > 0) {
    filter.tags = { $in: tags };
  }

  // Price range
  if (minPrice !== undefined || maxPrice !== undefined) {
    filter.price = {};
    if (minPrice !== undefined) filter.price.$gte = minPrice;
    if (maxPrice !== undefined) filter.price.$lte = maxPrice;
  }

  // Seller reputation
  if (minReputation !== undefined) {
    filter['seller.reputation'] = { $gte: minReputation };
  }

  // Verified sellers only
  if (verified === true) {
    filter['seller.verified'] = true;
  }

  // Sorting
  let sort: any = {};
  switch (sortBy) {
    case 'price_asc':
      sort = { price: 1 };
      break;
    case 'price_desc':
      sort = { price: -1 };
      break;
    case 'newest':
      sort = { createdAt: -1 };
      break;
    case 'reputation':
      sort = { 'seller.reputation': -1, views: -1 };
      break;
    case 'popularity':
    default:
      sort = { views: -1, sales: -1 };
      break;
  }

  // Add text search score if searching
  if (query) {
    sort = { score: { $meta: 'textScore' }, ...sort };
  }

  const skip = (page - 1) * limit;

  return this.find(filter)
    .sort(sort)
    .skip(skip)
    .limit(limit)
    .exec();
};

export default mongoose.model<IProduct, IProductModel>('Product', ProductSchema) as IProductModel;
