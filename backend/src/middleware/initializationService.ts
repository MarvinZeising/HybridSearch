import { createPostsIndex, purgePostsIndexes } from '../posts/createIndex.ts';
import { createPagesIndex, purgePagesIndexes } from '../pages/createIndex.ts';
import { createUsersIndex, purgeUsersIndexes } from '../users/createIndex.ts';
import { createBranchIndexes, purgeBranchIndexes } from '../branches/createIndex.ts';
import { purgeMonstacheDatabases } from '../purgeUtils.ts';
import deployModel from '../models/deployModel.ts';
import { initializeDefaultPosts } from '../posts/NewsPost.ts';
import { initializeDefaultPages } from '../pages/Page.ts';
import { initializeDefaultUsers } from '../users/User.ts';

class InitializationService {
  private isInitialized: boolean;

  constructor() {
    this.isInitialized = false;
  }

  async initialize(): Promise<void> {
    try {
      console.log('Starting server initialization...');

      await Promise.all([
        purgePostsIndexes(),
        purgePagesIndexes(),
        purgeUsersIndexes(),
        purgeBranchIndexes(),
      ]);

      console.log('Purging Monstache databases...');
      await purgeMonstacheDatabases();

      console.log('Deploying ML models...');
      const [sentenceTransformerModelId, rerankerModelId] = await Promise.all([
        deployModel('sentence-transformer.json'),
        deployModel('cross-encoder.json')
      ]);

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
      console.log('Server initialization complete.');
    } catch (error) {
      console.error('Initialization error:', error);
      throw error;
    }
  }

  getInitializationStatus(): boolean {
    return this.isInitialized;
  }
}

export default new InitializationService();
