import { Router, Request, Response } from 'express';
import Identity, { IIdentity } from '../models/Identity';
import logger from '../utils/logger';
import { validateDID, validateAddress } from '../utils/validation';

const router = Router();

/**
 * POST /identities
 * Create a new identity (DID)
 */
router.post('/', async (req: Request, res: Response) => {
  try {
    const { address, name, bio, avatar, metadata } = req.body;

    // Validate required fields
    if (!address) {
      return res.status(400).json({
        error: {
          code: 'MISSING_ADDRESS',
          message: 'Address is required',
          timestamp: new Date().toISOString()
        }
      });
    }

    if (!validateAddress(address)) {
      return res.status(400).json({
        error: {
          code: 'INVALID_ADDRESS',
          message: 'Invalid Ethereum address format',
          timestamp: new Date().toISOString()
        }
      });
    }

    // Generate DID from address
    const did = `did:ethr:${address}`;

    // Check if identity already exists
    const existingIdentity = await Identity.findByDID(did);
    if (existingIdentity) {
      return res.status(409).json({
        error: {
          code: 'IDENTITY_EXISTS',
          message: 'Identity already exists for this address',
          timestamp: new Date().toISOString()
        }
      });
    }

    // Create new identity
    const identity = new Identity({
      did,
      address,
      name,
      bio,
      avatar,
      metadata: metadata || {}
    });

    await identity.save();

    logger.info(`Created new identity: ${did}`);

    res.status(201).json({
      did: identity.did,
      address: identity.address,
      name: identity.name,
      bio: identity.bio,
      avatar: identity.avatar,
      metadata: identity.metadata,
      verified: identity.verified,
      verification: identity.verification,
      reputationScore: identity.reputationScore,
      createdAt: identity.createdAt,
      updatedAt: identity.updatedAt
    });

  } catch (error) {
    logger.error('Error creating identity:', error);
    res.status(500).json({
      error: {
        code: 'IDENTITY_CREATION_ERROR',
        message: 'Failed to create identity',
        timestamp: new Date().toISOString()
      }
    });
  }
});

/**
 * GET /identities/:did
 * Get identity by DID
 */
router.get('/:did', async (req: Request, res: Response) => {
  try {
    const { did } = req.params;

    if (!validateDID(did)) {
      return res.status(400).json({
        error: {
          code: 'INVALID_DID',
          message: 'Invalid DID format',
          timestamp: new Date().toISOString()
        }
      });
    }

    const identity = await Identity.findByDID(did);

    if (!identity) {
      return res.status(404).json({
        error: {
          code: 'IDENTITY_NOT_FOUND',
          message: 'Identity not found',
          timestamp: new Date().toISOString()
        }
      });
    }

    res.json({
      did: identity.did,
      address: identity.address,
      name: identity.name,
      bio: identity.bio,
      avatar: identity.avatar,
      metadata: identity.metadata,
      verified: identity.verified,
      verification: identity.verification,
      reputationScore: identity.reputationScore,
      createdAt: identity.createdAt,
      updatedAt: identity.updatedAt
    });

  } catch (error) {
    logger.error('Error fetching identity:', error);
    res.status(500).json({
      error: {
        code: 'IDENTITY_FETCH_ERROR',
        message: 'Failed to fetch identity',
        timestamp: new Date().toISOString()
      }
    });
  }
});

export default router;