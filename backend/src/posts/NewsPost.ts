import mongoose, { Document, Model } from 'mongoose';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import axios from 'axios';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface INewsPost extends Document {
  title: string;
  description: string;
  content: string;
  branchId: string;
  createdAt: Date;
}

const NewsPostSchema = new mongoose.Schema<INewsPost>({
  title: String,
  description: String,
  content: String,
  branchId: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});

interface NewsPostModel extends Model<INewsPost> {
  search(query: string, branchId: string): Promise<any[]>;
}

const NewsPost = mongoose.model<INewsPost, NewsPostModel>('Post', NewsPostSchema);

NewsPost.search = async function(query: string, branchId: string) {
  try {
    const searchBody = {
      query: {
        hybrid: {
          filter: {
            term: {
              branchId: branchId
            }
          },
          queries: [
            {
              multi_match: {
                query: query,
                fields: ['title^4', 'description'],
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
      ext: {
        rerank: {
          query_context: {
            query_text: query
          }
        }
      }
    };

    const searchResponse = await axios.post(`http://opensearch:9200/posts/_search?search_pipeline=posts-search-pipeline`, searchBody);

    const hits = searchResponse.data.hits.hits;

    const postIds = hits.map((hit: any) => hit._id);
    const plainPosts = await this.find({
      _id: { $in: postIds }
    });

    return plainPosts.map((post: any) => {
      const score = hits.find((x: any) => x._id === post.id)._score;
      return { ...post._doc, score };
    }).sort((a: any, b: any) => b.score - a.score);
  } catch (error: any) {
    console.error('Search error:', error.response?.data || error);
    throw new Error('Failed to search posts');
  }
};

export async function initializeDefaultPosts(): Promise<void> {
  try {
    console.log('Creating news posts collection');
    await NewsPost.createCollection();

    const count = await NewsPost.countDocuments();
    if (count === 0) {
      console.log('No posts found, inserting default posts...');

      const defaultPostsPath = path.join(__dirname, 'assets', 'default-posts.json');
      const defaultPosts = JSON.parse(fs.readFileSync(defaultPostsPath, 'utf8'));

      await NewsPost.insertMany(defaultPosts);

      console.log('Default posts inserted successfully');
    } else {
      console.log('Database already contains posts, skipping default posts insertion');
    }
  } catch (error) {
    console.error('Error inserting default posts:', error);
    throw error;
  }
}

export { NewsPost };
