class IPFSService {
  constructor(opts) {
    // placeholder constructor
  }

  async pinJSON(name, json) {
    // simulate pinning
    const cid = `fakeCID-${Date.now()}`;
    const url = `https://ipfs.io/ipfs/${cid}`;
    console.log(`Pinned ${name} to IPFS: ${cid}`);
    return { cid, url };
  }
}

module.exports = IPFSService;
