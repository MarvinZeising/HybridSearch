import mongoose, {Document, Model} from 'mongoose';
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
  search(query: string, branchId: string): Promise<any>;
}

const Branch = mongoose.model<IBranch, BranchModel>('Branch', BranchSchema);

Branch.search = async function(query: string, branchId: string) {
  try {
    const searchResponse = await axios.post(`http://opensearch:9200/branch-${branchId}/_search`, {
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
      search_pipeline: 'branches-search-pipeline',
      ext: {
        rerank: {
          query_context: {
            query_text: query
          }
        },
        generative_qa_parameters: {
          llm_model: 'gpt-4-1',
          llm_question: query,
          // memory_id: 'znCqcI0BfUsSoeNTntd7',
          context_size: 5,
          message_size: 5,
          timeout: 15
        }
      },
      highlight: {
        fields: {
          content: {
            type: 'unified' // 'semantic'
          }
        },
        pre_tags: ['<b>'],
        post_tags: ['</b>']
        // options: {
        //   model_id: semanticHighlighterModelId
        // }
      }
    });
    const hits = searchResponse.data.hits.hits;

    const results = hits.map((hit: any) => {
      const source = hit._source;
      return {
        ...source,
        highlights: hit.highlight?.content,
        score: hit._score,
        type: source.type || 'branch'
      };
    });

    return {
      results,
      totalHits: {
        total: searchResponse.data.hits.total.value,
        posts: results.filter((r: any) => r.type === 'post').length,
        pages: results.filter((r: any) => r.type === 'page').length,
        users: results.filter((r: any) => r.type === 'user').length,
      },
      rag: searchResponse.data.ext.retrieval_augmented_generation.answer
    }
  } catch (error: any) {
    console.error('Branch central search error:', error.response?.data || error);
    throw new Error('Failed to perform central search');
  }
};

export { Branch };
