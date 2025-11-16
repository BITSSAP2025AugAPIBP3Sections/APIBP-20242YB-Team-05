import mongoose from 'mongoose';
import config from './index';
import logger from '../utils/logger';

class Database {
  private static instance: Database;
  private isConnected = false;

  private constructor() {}

  static getInstance(): Database {
    if (!Database.instance) {
      Database.instance = new Database();
    }
    return Database.instance;
  }

  async connect(): Promise<void> {
    if (this.isConnected) {
      return;
    }

    try {
      const mongoUri = config.MONGODB_URI;
      
      // Replace placeholder password if needed
      const uri = mongoUri.includes('<db_password>') 
        ? mongoUri.replace('<db_password>', process.env.MONGODB_PASSWORD || '')
        : mongoUri;

      await mongoose.connect(uri, {
        dbName: config.MONGODB_DB_NAME,
        maxPoolSize: 10,
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 45000,
        bufferCommands: false
      });

      this.isConnected = true;
      logger.info('✅ Connected to MongoDB Atlas successfully');

      // Handle connection events
      mongoose.connection.on('error', (error) => {
        logger.error('MongoDB connection error:', error);
      });

      mongoose.connection.on('disconnected', () => {
        logger.warn('MongoDB disconnected');
        this.isConnected = false;
      });

      mongoose.connection.on('reconnected', () => {
        logger.info('MongoDB reconnected');
        this.isConnected = true;
      });

    } catch (error) {
      logger.error('Failed to connect to MongoDB:', error);
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    if (!this.isConnected) {
      return;
    }

    try {
      await mongoose.connection.close();
      this.isConnected = false;
      logger.info('📡 Disconnected from MongoDB');
    } catch (error) {
      logger.error('Error disconnecting from MongoDB:', error);
      throw error;
    }
  }

  getConnectionStatus(): boolean {
    return this.isConnected && mongoose.connection.readyState === 1;
  }

  async healthCheck(): Promise<{ status: string; database: string; collections?: string[] }> {
    try {
      if (!this.isConnected) {
        return { status: 'disconnected', database: config.MONGODB_DB_NAME };
      }

      // Ping the database
      await mongoose.connection.db?.admin().ping();
      
      // Get collection names
      const collections = await mongoose.connection.db?.listCollections().toArray();
      const collectionNames = collections?.map(col => col.name) || [];

      return {
        status: 'healthy',
        database: config.MONGODB_DB_NAME,
        collections: collectionNames
      };
    } catch (error) {
      logger.error('Database health check failed:', error);
      return { status: 'error', database: config.MONGODB_DB_NAME };
    }
  }
}

export default Database.getInstance();
