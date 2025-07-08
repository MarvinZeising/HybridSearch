import { createPostsIndex, createPagesIndex, createUsersIndex, purgePostsIndexes, purgePagesIndexes, purgeUsersIndexes } from '../posts/createIndex.js';
import { createBranchIndexes, purgeBranchIndexes } from '../branches/createIndex.js';
import { purgeMonstacheDatabases } from '../purgeUtils.js';
import deployModel from "../models/deployModel.js";
import { initializeDefaultPosts } from '../posts/NewsPost.js';
import { initializeDefaultPages } from '../pages/Page.js';
import { initializeDefaultUsers } from '../users/User.js';

class InitializationService {
  constructor() {
    this.isInitialized = false;
  }

  async initialize() {
    try {
      console.log('Starting server initialization...');

      // Step 1: Purge existing indexes
      console.log('Purging existing indexes...');
      await Promise.all([
        purgePostsIndexes(),
        purgePagesIndexes(),
        purgeUsersIndexes(),
        purgeBranchIndexes(),
      ]);

      // Step 2: Purge Monstache databases
      console.log('Purging Monstache databases...');
      await purgeMonstacheDatabases();

      // Step 3: Deploy models
      console.log('Deploying ML models...');
      const [sentenceTransformerModelId, rerankerModelId] = await Promise.all([
        deployModel('sentence-transformer.json'),
        deployModel('cross-encoder.json')
      ]);

      // Step 4: Create indexes and initialize default data
      console.log('Creating indexes and initializing default data...');
      await Promise.all([
        createPostsIndex(sentenceTransformerModelId, rerankerModelId),
        createPagesIndex(sentenceTransformerModelId, rerankerModelId),
        createUsersIndex(sentenceTransformerModelId, rerankerModelId),
        createBranchIndexes(sentenceTransformerModelId, rerankerModelId),
        initializeDefaultPosts(),
        initializeDefaultPages(),
        initializeDefaultUsers(),
      ]);

      this.isInitialized = true;
      console.log('Server initialization completed successfully');

      return true;
    } catch (error) {
      console.error('Error during initialization:', error);
      this.isInitialized = false;
      throw error;
    }
  }

  getInitializationStatus() {
    return this.isInitialized;
  }
}

export default new InitializationService();
