import mongoose from 'mongoose';
import axios from 'axios';

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

// Static method to search branches using OpenSearch (with reranking)
Branch.search = async function(query, branchId = null) {
  try {
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
      search_pipeline: 'branches-search-pipeline',
      ext: {
        rerank: { // rerank results using cross-encoder
          query_context: {
            query_text: query
          }
        }
      }
    };

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

// Static method to perform central search on branch index (with reranking)
Branch.centralSearch = async function(query, branchId) {
  try {
    // Query the branch index directly, which contains all aggregated data for this branch
    const searchBody = {
      query: {
        hybrid: {
          queries: [
            {
              multi_match: {
                query: query,
                fields: ['title^4', 'description^2', 'content', 'firstName^3', 'lastName^3', 'jobTitle^2', 'department^2', 'fullName^4'],
                type: 'best_fields',
                fuzziness: 'AUTO'
              }
            },
            {
              nested: {
                score_mode: 'max',
                path: 'embeddings',
                query: {
                  neural: {
                    'embeddings.knn': {
                      query_text: query,
                      k: 10
                    }
                  }
                }
              }
            }
          ]
        }
      },
      search_pipeline: 'branches-search-pipeline-reranked',
      ext: {
        rerank: {
          query_context: {
            query_text: query
          }
        }
      }
    };

    // Execute search on the branch index
    const searchResponse = await axios.post(`http://opensearch:9200/branch-${branchId}/_search`, searchBody);
    const hits = searchResponse.data.hits.hits;
    const total = searchResponse.data.hits.total.value;

    // Transform results to include type and score information
    const results = hits.map(hit => {
      const source = hit._source;
      return {
        ...source,
        score: hit._score,
        type: source.type || 'branch' // Use the type from the source, fallback to 'branch'
      };
    });

    return {
      results: results,
      totalHits: {
        total: total,
        posts: results.filter(r => r.type === 'post').length,
        pages: results.filter(r => r.type === 'page').length,
        users: results.filter(r => r.type === 'user').length,
        branches: results.filter(r => r.type === 'branch').length
      }
    };
  } catch (error) {
    console.error('Branch central search error:', error.response?.data || error);
    throw new Error('Failed to perform central search');
  }
};

export { Branch };
