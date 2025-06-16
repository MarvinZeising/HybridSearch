import express from 'express';
import cors from 'cors';
import axios from 'axios';
import connectMongoDB from './mongodb.js';
import { NewsPost, initializeDefaultPosts } from './posts/NewsPost.js';
import { createIndex, hasIndex, getModelId } from './posts/createIndex.js';

const app = express();
app.use(cors());
app.use(express.json());

// Track initialization status
let isInitialized = false;
let modelId = ''

// Connect to MongoDB
connectMongoDB();

// Health check endpoint
app.get('/health', (req, res) => {
  if (!isInitialized) {
    return res.status(503).json({ status: 'initializing' });
  }
  res.status(200).json({ status: 'healthy' });
});

// API endpoint to create a news post
app.post('/api/news', async (req, res) => {
  try {
    const { title, description } = req.body;
    const post = new NewsPost({ title, description });
    await post.save();
    res.status(201).json(post);
  } catch (err) {
    res.status(500).json({ error: 'Failed to create post' });
  }
});

// Get all posts
app.get('/api/news', async (req, res) => {
  try {
    const posts = await NewsPost.find().sort({ createdAt: -1 });
    res.json(posts);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch posts' });
  }
});

// Get a single post
app.get('/api/news/:id', async (req, res) => {
  try {
    const post = await NewsPost.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }
    res.json(post);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch post' });
  }
});

// Update a post
app.put('/api/news/:id', async (req, res) => {
  try {
    const { title, description } = req.body;
    const post = await NewsPost.findByIdAndUpdate(
      req.params.id,
      { title, description },
      { new: true, runValidators: true }
    );
    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }
    res.json(post);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update post' });
  }
});

// Search posts using OpenSearch
app.post('/api/news/search', async (req, res) => {
  try {
    const { query } = req.body;

    const searchResponse = await axios.post('http://opensearch:9200/posts/_search', {
      query: {
        hybrid: {
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
              neural: {
                title_vector: {
                  query_text: query,
                  model_id: modelId,
                  k: 5
                }
              }
            },
            {
              neural: {
                description_vector: {
                  query_text: query,
                  model_id: modelId,
                  k: 5
                }
              }
            }
          ]
        }
      }
    });

    console.log(searchResponse.data.hits)
    const hits = searchResponse.data.hits.hits;
    const postIds = hits.map(hit => hit._id);

    // Fetch full documents from MongoDB using the IDs
    const plainPosts = await NewsPost.find({
      _id: { $in: postIds }
    })

    const posts = plainPosts.map((post) => {
      const score = hits.find(x => x._id === post.id)._score
      return {...post._doc, score}
    })
    .sort((a, b) => b.score - a.score);

    res.json(posts);
  } catch (err) {
    console.error('Search error:', err);
    res.status(500).json({ error: 'Failed to search posts' });
  }
});

const PORT = 4000;
app.listen(PORT, async () => {
  console.log(`Server running on port ${PORT}`);

  try {
    if (!await hasIndex()) {
      await Promise.all([
        createIndex(),
        initializeDefaultPosts()
      ])
    }

    modelId = await getModelId()
    console.log('Post Model ID: ', modelId)

    // Mark initialization as complete
    isInitialized = true;
    console.log('Server initialization completed successfully');
  } catch (error) {
    console.error('Error during initialization:', error);
    // Don't set isInitialized to true if there's an error
  }
});
