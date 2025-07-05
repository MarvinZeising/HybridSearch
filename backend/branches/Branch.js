import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import axios from 'axios';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const BranchSchema = new mongoose.Schema({
  title: String,
  description: String,
  content: String,
  branchId: String,
  createdAt: { type: Date, default: Date.now },
  createdBy: String,
  createdByName: String,
  updatedAt: { type: Date, default: Date.now },
  updatedBy: String,
  updatedByName: String
});

const Branch = mongoose.model('Branch', BranchSchema);

// Static method to search branches using OpenSearch
Branch.search = async function(query, branchId = null, useReranking = false) {
  try {
    const searchPipeline = useReranking ? 'branches-search-pipeline-reranked' : 'branches-search-pipeline';

    // If searching in a specific branch, use that index, otherwise search all branch indices
    const indexName = branchId ? `branch-${branchId}` : 'branch-*';

    const searchBody = {
      query: {
        hybrid: {
          queries: [
            {
              multi_match: { // keyword search
                query: query,
                fields: ['title^4', 'description^2', 'content'],
                type: 'best_fields',
                fuzziness: 'AUTO'
              }
            },
            {
              nested: {
                score_mode: 'max',
                path: 'embeddings',
                query: {
                  neural: { // neural search using sentence transformer
                    'embeddings.knn': {
                      query_text: query,
                      k: 5
                    }
                  }
                }
              }
            }
          ]
        }
      },
      search_pipeline: searchPipeline
    };

    // Add reranking context if using reranking
    if (useReranking) {
      searchBody.ext = {
        rerank: { // rerank results using cross-encoder
          query_context: {
            query_text: query
          }
        }
      };
    }

    const searchResponse = await axios.post(`http://opensearch:9200/${indexName}/_search`, searchBody);

    const hits = searchResponse.data.hits.hits;
    const branchIds = hits.map(hit => hit._id);

    // Fetch full documents from MongoDB using the IDs
    const plainBranches = await this.find({
      _id: { $in: branchIds }
    });

    return plainBranches.map((branch) => {
      const score = hits.find(x => x._id === branch.id)?._score || 0;
      return {...branch._doc, score};
    })
    .sort((a, b) => b.score - a.score);
  } catch (error) {
    console.error('Branch search error:', error.response?.data || error);
    throw new Error('Failed to search branches');
  }
};

async function initializeDefaultBranches() {
  try {
    console.log('Creating branches collection');
    await Branch.createCollection();

    // Check if we already have branches
    const count = await Branch.countDocuments();
    if (count === 0) {
      console.log('No branches found, inserting default branches...');

      // Read and parse the default branches
      const defaultBranchesPath = path.join(__dirname, 'default-branches.json');
      const defaultBranches = JSON.parse(fs.readFileSync(defaultBranchesPath, 'utf8'));

      // Insert the branches
      await Branch.insertMany(defaultBranches);
      console.log('Default branches inserted successfully');
    } else {
      console.log('Database already contains branches, skipping default branches insertion');
    }
  } catch (error) {
    console.error('Error inserting default branches:', error);
    throw error;
  }
}

export { Branch, initializeDefaultBranches };
