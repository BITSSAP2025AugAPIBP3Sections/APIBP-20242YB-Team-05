const listingService = require('../services/listing.service');
const blockchainService = require('../services/blockchainService');
const ipfsService = require('../services/ipfsService');

class ListingController {
  async create(req, res, next) {
    try {
      const listing = await listingService.createListing(req.body);
      res.status(201).json(listing);
    } catch (error) {
      next(error);
    }
  }

  async get(req, res, next) {
    try {
      const listings = await listingService.getAllListings();
      res.json(listings);
    } catch (error) {
      next(error);
    }
  }

  async getById(req, res, next) {
    try {
      const listing = await listingService.getListingById(req.params.id);
      if (!listing) {
        return res.status(404).json({ message: 'Listing not found' });
      }
      res.json(listing);
    } catch (error) {
      next(error);
    }
  }

  async publish(req, res, next) {
    try {
      const { id } = req.params;
      const listing = await listingService.getListingById(id);

      if (!listing) {
        return res.status(404).json({ message: 'Listing not found' });
      }

      // 1. Upload metadata to IPFS
      const ipfsCID = await ipfsService.uploadMetadata({
        name: listing.name,
        description: listing.description,
        images: listing.images,
      });

      // 2. Publish to blockchain
      const tx = await blockchainService.publishListing(listing, ipfsCID);

      // 3. Update local status
      const updatedListing = await listingService.updateListing(id, {
        status: 'published',
        ipfsCID,
        blockchain: {
          network: 'localhost',
          contractAddress: blockchainService.getContractAddress(),
          transactionHash: tx.hash,
        },
      });

      res.json({
        message: 'Listing published successfully!',
        listing: updatedListing,
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new ListingController();
