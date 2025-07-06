import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import axios from 'axios';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const NewsPostSchema = new mongoose.Schema({
  title: String,
  description: String,
  content: String,
  branchId: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});

const NewsPost = mongoose.model('Post', NewsPostSchema);

// Static method to search posts using OpenSearch (with reranking)
NewsPost.search = async function(query, branchId) {
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
              multi_match: { // keyword search
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
      ext: {
        rerank: { // rerank results using cross-encoder
          query_context: {
            query_text: query
          }
        }
      }
    };

    const searchResponse = await axios.post(`http://opensearch:9200/posts/_search?search_pipeline=posts-search-pipeline`, searchBody);

    const hits = searchResponse.data.hits.hits;
    const postIds = hits.map(hit => hit._id);

    // Fetch full documents from MongoDB using the IDs
    const plainPosts = await this.find({
      _id: { $in: postIds }
    });

    return plainPosts.map((post) => {
      const score = hits.find(x => x._id === post.id)._score;
      return {...post._doc, score};
    })
    .sort((a, b) => b.score - a.score);
  } catch (error) {
    console.error('Search error:', error.response?.data || error);
    throw new Error('Failed to search posts');
  }
};

async function initializeDefaultPosts() {
  try {
    console.log('Creating news posts collection');
    await NewsPost.createCollection();

    // Check if we already have posts
    const count = await NewsPost.countDocuments();
    if (count === 0) {
      console.log('No posts found, inserting default posts...');

      // Read and parse the default posts
      const defaultPostsPath = path.join(__dirname, 'default-posts.json');
      const defaultPosts = JSON.parse(fs.readFileSync(defaultPostsPath, 'utf8'));

      // Insert the posts
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

export { NewsPost, initializeDefaultPosts };
