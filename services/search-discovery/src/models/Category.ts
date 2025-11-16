import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ICategory extends Document {
  id: string;
  name: string;
  description: string;
  productCount: number;
  subcategories?: ISubcategory[];
  icon?: string;
  createdAt: Date;
  updatedAt: Date;
  updateProductCount(count: number): Promise<ICategory>;
}

export interface ICategoryModel extends Model<ICategory> {
  getCategoriesWithCounts(): Promise<ICategory[]>;
  findByIdWithSubcategories(categoryId: string): Promise<ICategory | null>;
}

export interface ISubcategory {
  id: string;
  name: string;
  description: string;
  productCount: number;
  parentCategory: string;
}

const SubcategorySchema: Schema = new Schema({
  id: {
    type: String,
    required: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  productCount: {
    type: Number,
    default: 0,
    min: 0
  },
  parentCategory: {
    type: String,
    required: true
  }
});

const CategorySchema: Schema = new Schema({
  id: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  description: {
    type: String,
    trim: true,
    maxlength: 500
  },
  productCount: {
    type: Number,
    default: 0,
    min: 0
  },
  subcategories: [SubcategorySchema],
  icon: {
    type: String, // IPFS CID for category icon
    trim: true
  }
}, {
  timestamps: true,
  collection: 'categories'
});

// Indexes for better performance
CategorySchema.index({ productCount: -1 });
CategorySchema.index({ name: 'text', description: 'text' });

// Static method to get categories with product counts
CategorySchema.statics.getCategoriesWithCounts = function() {
  return this.find({})
    .sort({ productCount: -1, name: 1 })
    .exec();
};

// Static method to find category by ID
CategorySchema.statics.findByIdWithSubcategories = function(categoryId: string) {
  return this.findOne({ id: categoryId }).exec();
};

// Method to update product count
CategorySchema.methods.updateProductCount = async function(count: number) {
  this.productCount = count;
  return this.save();
};

export default mongoose.model<ICategory, ICategoryModel>('Category', CategorySchema) as ICategoryModel;
