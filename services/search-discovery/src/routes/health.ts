import { Router, Request, Response } from 'express';
import database from '../config/database';
import config from '../config';

const router = Router();

/**
 * GET /health
 * Health check endpoint for service monitoring
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const timestamp = new Date().toISOString();
    
    // Check database connection
    const dbHealth = await database.healthCheck();
    
    const healthStatus = {
      service: 'nozama-search-discovery-api',
      status: 'healthy',
      timestamp,
      version: '1.0.0',
      environment: config.NODE_ENV,
      uptime: process.uptime(),
      database: dbHealth,
      memory: {
        used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
        total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
        external: Math.round(process.memoryUsage().external / 1024 / 1024)
      },
      system: {
        platform: process.platform,
        arch: process.arch,
        nodeVersion: process.version,
        pid: process.pid
      }
    };

    // Set status based on database health
    const httpStatus = dbHealth.status === 'healthy' ? 200 : 503;
    if (dbHealth.status !== 'healthy') {
      healthStatus.status = 'degraded';
    }

    res.status(httpStatus).json(healthStatus);
  } catch (error) {
    res.status(503).json({
      service: 'nozama-search-discovery-api',
      status: 'error',
      timestamp: new Date().toISOString(),
      error: {
        message: 'Health check failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      }
    });
  }
});

/**
 * GET /health/ready
 * Readiness probe for Kubernetes
 */
router.get('/ready', async (req: Request, res: Response) => {
  try {
    const dbConnected = database.getConnectionStatus();
    
    if (!dbConnected) {
      res.status(503).json({
        status: 'not ready',
        timestamp: new Date().toISOString(),
        reason: 'Database not connected'
      });
      return;
    }

    res.json({
      status: 'ready',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(503).json({
      status: 'not ready',
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * GET /health/live
 * Liveness probe for Kubernetes
 */
router.get('/live', (req: Request, res: Response) => {
  res.json({
    status: 'alive',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

export default router;
