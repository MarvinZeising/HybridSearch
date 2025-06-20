import express from 'express';
import cors from 'cors';
import connectMongoDB from './mongodb.js';
import { NewsPost, initializeDefaultPosts } from './posts/NewsPost.js';
import { createIndex } from './posts/createIndex.js';
import deployModel from "./models/deployModel.js";

const app = express();
app.use(cors());
app.use(express.json());

// Track initialization status
let isInitialized = false;

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
    const { title, description, content } = req.body;
    const post = new NewsPost({ title, description, content });
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
    const { title, description, content } = req.body;
    const post = await NewsPost.findByIdAndUpdate(
      req.params.id,
      { title, description, content },
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

// Delete a post
app.delete('/api/news/:id', async (req, res) => {
  try {
    const post = await NewsPost.findByIdAndDelete(req.params.id);
    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }
    res.status(204).send();
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete post' });
  }
});

app.post('/api/news/search', async (req, res) => {
  try {
    const { query } = req.body;
    const posts = await NewsPost.search(query);
    res.json(posts);
  } catch (error) {
    console.error('Search error:', error.error ? error.error.root_cause : error);
    res.status(500).json({ error: 'Failed to search posts' });
  }
});

app.post('/api/news/search-reranked', async (req, res) => {
  try {
    const { query } = req.body;
    const posts = await NewsPost.searchWithReranking(query);
    res.json(posts);
  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({ error: 'Failed to search posts' });
  }
});

const PORT = 4000;
app.listen(PORT, async () => {
  console.log(`Server running on port ${PORT}`);

  await connectMongoDB();

  try {
    const [sentenceTransformerModelId, rerankerModelId] = await Promise.all([
      deployModel('sentence-transformer.json'),
      deployModel('cross-encoder.json')
    ])

    await Promise.all([
      createIndex(sentenceTransformerModelId, rerankerModelId),
      initializeDefaultPosts()
    ])

    isInitialized = true;
    console.log('Server initialization completed successfully');
  } catch (error) {
    console.error('Error during initialization:', error);
    // Don't set isInitialized to true if there's an error
  }
});
