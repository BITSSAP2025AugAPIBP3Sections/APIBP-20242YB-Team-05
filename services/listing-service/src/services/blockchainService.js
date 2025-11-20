class BlockchainService {
  constructor(opts) {
    // placeholder constructor
  }

  async publishListingToChain({ ipfsCid, priceEth, category }) {
    // simulate blockchain tx
    console.log(`Publishing to blockchain: ${ipfsCid}, ${priceEth} ETH, ${category}`);
    const receipt = { transactionHash: `0xFAKE${Date.now()}` };
    return { receipt };
  }
}

module.exports = BlockchainService;
