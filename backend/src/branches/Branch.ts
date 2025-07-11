import mongoose, { Document, Model } from 'mongoose';
import axios from 'axios';

interface IBranch extends Document {
  title: string;
  description: string;
  content: string;
  branchId: string;
  createdAt: Date;
  createdBy: string;
  createdByName: string;
  updatedAt: Date;
  updatedBy: string;
  updatedByName: string;
}

const BranchSchema = new mongoose.Schema<IBranch>({
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

interface BranchModel extends Model<IBranch> {
  search(query: string, branchId?: string | null): Promise<any[]>;
  searchContent(query: string, branchId: string): Promise<any>;
}

const Branch = mongoose.model<IBranch, BranchModel>('Branch', BranchSchema);

Branch.search = async function(query: string, branchId: string | null = null) {
  try {
    const indexName = branchId ? `branch-${branchId}` : 'branch-*';
    const searchBody = {
      query: {
        hybrid: {
          queries: [
            {
              multi_match: {
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
                  neural: {
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
        rerank: {
          query_context: {
            query_text: query
          }
        }
      }
    };

    const searchResponse = await axios.post(`http://opensearch:9200/${indexName}/_search`, searchBody);
    const hits = searchResponse.data.hits.hits;

    const branchIds = hits.map((hit: any) => hit._id);
    const plainBranches = await this.find({
      _id: { $in: branchIds }
    });

    return plainBranches.map((branch: any) => {
      const score = hits.find((x: any) => x._id === branch.id)?._score || 0;
      return { ...branch._doc, score };
    }).sort((a: any, b: any) => b.score - a.score);
  } catch (error: any) {
    console.error('Branch search error:', error.response?.data || error);
    throw new Error('Failed to search branches');
  }
};

BranchSchema.statics.searchContent = async function(query: string, branchId: string) {
  try {
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

    const searchResponse = await axios.post(`http://opensearch:9200/branch-${branchId}/_search`, searchBody);
    const hits = searchResponse.data.hits.hits;

    const total = searchResponse.data.hits.total.value;

    const results = hits.map((hit: any) => {
      const source = hit._source;
      return {
        ...source,
        score: hit._score,
        type: source.type || 'branch'
      };
    });

    return {
      results: results,
      totalHits: {
        total: total,
        posts: results.filter((r: any) => r.type === 'post').length,
        pages: results.filter((r: any) => r.type === 'page').length,
        users: results.filter((r: any) => r.type === 'user').length,
        branches: results.filter((r: any) => r.type === 'branch').length
      }
    };
  } catch (error: any) {
    console.error('Branch central search error:', error.response?.data || error);
    throw new Error('Failed to perform central search');
  }
};

export { Branch };
