import {createPostsIndex, purgePostsIndexes} from '../posts/createIndex.ts';
import {createPagesIndex, purgePagesIndexes} from '../pages/createIndex.ts';
import {createUsersIndex, purgeUsersIndexes} from '../users/createIndex.ts';
import {createBranchIndexes, purgeBranchIndexes} from '../branches/createIndex.ts';
import {purgeMonstacheDatabases} from '../purgeUtils.ts';
import {deployModel, loadModels, type Model} from '../models/deployModel.ts';
import {initializeDefaultPosts} from '../posts/NewsPost.ts';
import {initializeDefaultPages} from '../pages/Page.ts';
import {initializeDefaultUsers} from '../users/User.ts';

const modelSlugs = [
  'sentence-transformer',
  'cross-encoder',
  'semantic-highlighter',
  'gpt-4.1'
] as const;

class Initializer {
  private isInitialized = false;
  private models = [] as Model[];

  constructor() {
  }

  async initialize(): Promise<void> {
    try {
      console.log('Purging existing indexes and pipelines...');
      await Promise.all([
        purgePostsIndexes(),
        purgePagesIndexes(),
        purgeUsersIndexes(),
        purgeBranchIndexes(),
      ]);

      console.log('Purging Monstache databases...');
      await purgeMonstacheDatabases();

      console.log('Loading models...');
      this.models = await loadModels([...modelSlugs], {OPENAI_KEY: Bun.env.OPENAI_GPT_4_1_KEY || ''});

      console.log('Creating indexes and initializing default data...');
      await Promise.all([
        createPostsIndex(),
        createPagesIndex(),
        createUsersIndex(),
        createBranchIndexes(),
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

  getStatus(): boolean {
    return this.isInitialized;
  }

  getModel(name: typeof modelSlugs[number]): Model {
    return this.models.find(model => model.slug === name)!;
  }
}

export default new Initializer();
