// backend/server.js
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const axios = require('axios');

const app = express();
app.use(cors());
app.use(express.json());

// Connect to MongoDB
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://mongodb:27017/news?replicaSet=rs0';
mongoose.connect(MONGODB_URI)
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.error('MongoDB connection error:', err));

// NewsPost Schema
const newsPostSchema = new mongoose.Schema({
  title: String,
  description: String,
  createdAt: { type: Date, default: Date.now }
});

const NewsPost = mongoose.model('NewsPost', newsPostSchema);

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
    
    const searchResponse = await axios.post('http://opensearch:9200/news/_search', {
      query: {
        multi_match: {
          query: query,
          fields: ['title', 'description'],
          fuzziness: 'AUTO'
        }
      }
    });

    const hits = searchResponse.data.hits.hits;
    const postIds = hits.map(hit => hit._id);
    
    // Fetch full documents from MongoDB using the IDs
    const posts = await NewsPost.find({
      _id: { $in: postIds }
    }).sort({ createdAt: -1 });

    res.json(posts);
  } catch (err) {
    console.error('Search error:', err);
    res.status(500).json({ error: 'Failed to search posts' });
  }
});

const PORT = 4000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
