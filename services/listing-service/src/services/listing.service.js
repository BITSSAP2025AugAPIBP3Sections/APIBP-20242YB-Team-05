const ListingModel = require('../models/Listing');

exports.findWithPagination = async (query, page, limit) => {
  const totalResults = await ListingModel.countDocuments(query);
  const listings = await ListingModel.find(query)
    .skip((page - 1) * limit)
    .limit(limit)
    .lean();

  return { totalResults, listings };
};
