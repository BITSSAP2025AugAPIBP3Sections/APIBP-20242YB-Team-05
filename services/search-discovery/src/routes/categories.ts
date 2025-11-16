import { Router, Request, Response } from 'express';
import Category from '../models/Category';
import Product from '../models/Product';
import logger from '../utils/logger';
import config from '../config';

const router = Router();

/**
 * GET /categories
 * Get all categories with product counts
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const categories = await Category.getCategoriesWithCounts();
    
    res.json({
      categories,
      count: categories.length,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Error fetching categories:', error);
    res.status(500).json({
      error: {
        code: 'CATEGORIES_FETCH_ERROR',
        message: 'Failed to fetch categories',
        timestamp: new Date().toISOString()
      }
    });
  }
});

/**
 * GET /categories/:categoryId
 * Get category by ID with subcategories
 */
router.get('/:categoryId', async (req: Request, res: Response) => {
  try {
    const { categoryId } = req.params;
    
    if (!categoryId) {
      res.status(400).json({
        error: {
          code: 'MISSING_CATEGORY_ID',
          message: 'Category ID is required',
          timestamp: new Date().toISOString()
        }
      });
      return;
    }
    
    const category = await Category.findByIdWithSubcategories(categoryId);
    
    if (!category) {
      res.status(404).json({
        error: {
          code: 'CATEGORY_NOT_FOUND',
          message: `Category with ID '${categoryId}' not found`,
          timestamp: new Date().toISOString()
        }
      });
      return;
    }

    res.json(category);
  } catch (error) {
    logger.error('Error fetching category:', error);
    res.status(500).json({
      error: {
        code: 'CATEGORY_FETCH_ERROR',
        message: 'Failed to fetch category',
        timestamp: new Date().toISOString()
      }
    });
  }
});

/**
 * GET /categories/:categoryId/products
 * Get products in a specific category with pagination and filtering
 */
router.get('/:categoryId/products', async (req: Request, res: Response) => {
  try {
    const { categoryId } = req.params;
    const {
      page = 1,
      limit = config.DEFAULT_PAGE_SIZE,
      sortBy = 'popularity',
      subcategory,
      minPrice,
      maxPrice,
      minReputation,
      verified
    } = req.query;

    if (!categoryId) {
      res.status(400).json({
        error: {
          code: 'MISSING_CATEGORY_ID',
          message: 'Category ID is required',
          timestamp: new Date().toISOString()
        }
      });
      return;
    }

    // Validate pagination parameters
    const pageNum = Math.max(1, parseInt(page as string) || 1);
    const limitNum = Math.min(
      config.MAX_PAGE_SIZE,
      Math.max(1, parseInt(limit as string) || config.DEFAULT_PAGE_SIZE)
    );

    // Check if category exists
    const category = await Category.findByIdWithSubcategories(categoryId);
    if (!category) {
      res.status(404).json({
        error: {
          code: 'CATEGORY_NOT_FOUND',
          message: `Category with ID '${categoryId}' not found`,
          timestamp: new Date().toISOString()
        }
      });
      return;
    }

    // Build filter object
    const filter: any = {
      category: categoryId,
      isActive: true
    };

    // Add subcategory filter if specified
    if (subcategory) {
      filter.subcategory = subcategory;
    }

    // Add price filters
    if (minPrice !== undefined || maxPrice !== undefined) {
      filter.price = {};
      if (minPrice !== undefined) {
        const minPriceNum = parseFloat(minPrice as string);
        if (!isNaN(minPriceNum)) filter.price.$gte = minPriceNum;
      }
      if (maxPrice !== undefined) {
        const maxPriceNum = parseFloat(maxPrice as string);
        if (!isNaN(maxPriceNum)) filter.price.$lte = maxPriceNum;
      }
    }

    // Add reputation filter
    if (minReputation !== undefined) {
      const minReputationNum = parseInt(minReputation as string);
      if (!isNaN(minReputationNum)) {
        filter['seller.reputation'] = { $gte: minReputationNum };
      }
    }

    // Add verified sellers filter
    if (verified === 'true') {
      filter['seller.verified'] = true;
    }

    // Build sort object
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

    // Execute query with pagination
    const skip = (pageNum - 1) * limitNum;
    
    const [products, totalCount] = await Promise.all([
      Product.find(filter)
        .sort(sort)
        .skip(skip)
        .limit(limitNum)
        .lean(),
      Product.countDocuments(filter)
    ]);

    const totalPages = Math.ceil(totalCount / limitNum);
    
    const response = {
      results: products,
      pagination: {
        currentPage: pageNum,
        totalPages,
        totalResults: totalCount,
        resultsPerPage: limitNum,
        hasNextPage: pageNum < totalPages,
        hasPreviousPage: pageNum > 1
      },
      filters: {
        category: categoryId,
        ...(subcategory && { subcategory }),
        ...(minPrice !== undefined && { minPrice: parseFloat(minPrice as string) }),
        ...(maxPrice !== undefined && { maxPrice: parseFloat(maxPrice as string) }),
        ...(minReputation !== undefined && { minReputation: parseInt(minReputation as string) }),
        ...(verified === 'true' && { verified: true }),
        sortBy: sortBy as string
      },
      category: {
        id: category.id,
        name: category.name,
        description: category.description,
        productCount: category.productCount
      },
      timestamp: new Date().toISOString()
    };

    res.json(response);
  } catch (error) {
    logger.error('Error fetching category products:', error);
    res.status(500).json({
      error: {
        code: 'CATEGORY_PRODUCTS_FETCH_ERROR',
        message: 'Failed to fetch products for category',
        timestamp: new Date().toISOString()
      }
    });
  }
});

export default router;
