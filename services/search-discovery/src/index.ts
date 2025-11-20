#!/usr/bin/env node

/**
 * Nozama Search & Discovery API
 * 
 * Main entry point for the blockchain-based e-commerce search and discovery service.
 * This service provides:
 * - Product search with advanced filtering
 * - Category browsing with subcategories  
 * - Trending products discovery
 * - Search suggestions and autocomplete
 * - Integration with blockchain product registry
 * - IPFS metadata resolution
 */

import 'dotenv/config';
import server from './server';
import logger from './utils/logger';
import config from './config';

async function main() {
  try {
    // Validate required environment variables
    const requiredEnvVars = [
      'MONGODB_URI',
      'NODE_ENV'
    ];

    const missingEnvVars = requiredEnvVars.filter(envVar => !process.env[envVar]);
    
    if (missingEnvVars.length > 0) {
      logger.error('Missing required environment variables:', missingEnvVars);
      process.exit(1);
    }

    // Log startup information
    logger.info('🎯 Starting Nozama Search & Discovery API');
    logger.info(`📦 Service: ${config.SERVICE_NAME}`);
    logger.info(`🔢 Version: ${config.API_VERSION}`);
    logger.info(`🌍 Environment: ${config.NODE_ENV}`);
    logger.info(`🚪 Port: ${config.PORT}`);
    logger.info(`📊 Database: ${config.MONGODB_DB_NAME}`);
    logger.info(`🔍 Search timeout: ${config.SEARCH_TIMEOUT_MS}ms`);
    logger.info(`📄 Page size: ${config.DEFAULT_PAGE_SIZE} (max: ${config.MAX_PAGE_SIZE})`);
    
    // Start the server
    await server.start();
    
    logger.info('✅ Search & Discovery API is ready to serve requests');
    
  } catch (error) {
    logger.error('❌ Failed to start Search & Discovery API:', error);
    process.exit(1);
  }
}

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason: any, promise: Promise<any>) => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
  // Don't exit the process in production, but log the error
  if (config.NODE_ENV === 'development') {
    process.exit(1);
  }
});

// Handle uncaught exceptions
process.on('uncaughtException', (error: Error) => {
  logger.error('Uncaught Exception:', error);
  // Always exit on uncaught exceptions
  process.exit(1);
});

// Handle graceful shutdown
const gracefulShutdown = async (signal: string) => {
  logger.info(`Received ${signal}. Starting graceful shutdown...`);
  
  try {
    await server.stop();
    logger.info('✅ Graceful shutdown completed');
    process.exit(0);
  } catch (error) {
    logger.error('❌ Error during graceful shutdown:', error);
    process.exit(1);
  }
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Start the application
if (require.main === module) {
  main();
}

export default server;
