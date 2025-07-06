import express from 'express';
import cors from 'cors';
import connectMongoDB from './mongodb.js';
import { NewsPost, initializeDefaultPosts } from './posts/NewsPost.js';
import { createPostsIndex, createPagesIndex, createUsersIndex } from './posts/createIndex.js';
import { createBranchIndexes } from './branches/createIndex.js';
import deployModel from "./models/deployModel.js";
import { Page, initializeDefaultPages } from './pages/Page.js';
import { User, initializeDefaultUsers } from './users/User.js';
import { Branch } from './branches/Branch.js';
import axios from 'axios'; // Added for multisearch

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

// Search posts (with reranking)
app.post('/api/news/search', async (req, res) => {
  try {
    const { query, branchId } = req.body;

    if (!branchId) {
      return res.status(400).json({ error: 'branchId is required' });
    }

    const posts = await NewsPost.search(query, branchId);
    res.json(posts);
  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({ error: 'Failed to search posts' });
  }
});

// API endpoint to create a page
app.post('/api/pages', async (req, res) => {
  try {
    const { title, description, content, category, tags, isPublished } = req.body;
    const page = new Page({ title, description, content, category, tags, isPublished });
    await page.save();
    res.status(201).json(page);
  } catch (err) {
    res.status(500).json({ error: 'Failed to create page' });
  }
});

// Get all pages
app.get('/api/pages', async (req, res) => {
  try {
    const pages = await Page.find().sort({ createdAt: -1 });
    res.json(pages);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch pages' });
  }
});

// Get a single page
app.get('/api/pages/:id', async (req, res) => {
  try {
    const page = await Page.findById(req.params.id);
    if (!page) {
      return res.status(404).json({ error: 'Page not found' });
    }
    res.json(page);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch page' });
  }
});

// Update a page
app.put('/api/pages/:id', async (req, res) => {
  try {
    const { title, description, content, category, tags, isPublished } = req.body;
    const page = await Page.findByIdAndUpdate(
      req.params.id,
      { title, description, content, category, tags, isPublished, updatedAt: new Date() },
      { new: true, runValidators: true }
    );
    if (!page) {
      return res.status(404).json({ error: 'Page not found' });
    }
    res.json(page);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update page' });
  }
});

// Delete a page
app.delete('/api/pages/:id', async (req, res) => {
  try {
    const page = await Page.findByIdAndDelete(req.params.id);
    if (!page) {
      return res.status(404).json({ error: 'Page not found' });
    }
    res.status(204).send();
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete page' });
  }
});

// Search pages (with reranking)
app.post('/api/pages/search', async (req, res) => {
  try {
    const { query, branchId } = req.body;

    if (!branchId) {
      return res.status(400).json({ error: 'branchId is required' });
    }

    const pages = await Page.search(query, branchId);
    res.json(pages);
  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({ error: 'Failed to search pages' });
  }
});

// API endpoint to create a user
app.post('/api/users', async (req, res) => {
  try {
    const { firstName, lastName, email, jobTitle, department, managerId, employeeId, phone, location, profilePhoto } = req.body;
    const user = new User({
      firstName,
      lastName,
      email,
      jobTitle,
      department,
      managerId,
      employeeId,
      phone,
      location,
      profilePhoto
    });
    await user.save();
    res.status(201).json(user);
  } catch (err) {
    res.status(500).json({ error: 'Failed to create user' });
  }
});

// Get all users
app.get('/api/users', async (req, res) => {
  try {
    const users = await User.find().populate('managerId', 'firstName lastName email jobTitle').sort({ createdAt: -1 });
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// Get a single user
app.get('/api/users/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id).populate('managerId', 'firstName lastName email jobTitle');
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch user' });
  }
});

// Update a user
app.put('/api/users/:id', async (req, res) => {
  try {
    const { firstName, lastName, email, jobTitle, department, managerId, employeeId, phone, location, profilePhoto, isActive } = req.body;
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { firstName, lastName, email, jobTitle, department, managerId, employeeId, phone, location, profilePhoto, isActive, updatedAt: new Date() },
      { new: true, runValidators: true }
    );
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update user' });
  }
});

// Delete a user
app.delete('/api/users/:id', async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.status(204).send();
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete user' });
  }
});

// Get users by department
app.get('/api/users/department/:department', async (req, res) => {
  try {
    const users = await User.find({ department: req.params.department })
      .populate('managerId', 'firstName lastName email jobTitle')
      .sort({ firstName: 1, lastName: 1 });
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch users by department' });
  }
});

// Get users by manager
app.get('/api/users/manager/:managerId', async (req, res) => {
  try {
    const users = await User.find({ managerId: req.params.managerId })
      .populate('managerId', 'firstName lastName email jobTitle')
      .sort({ firstName: 1, lastName: 1 });
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch users by manager' });
  }
});

// Search users (with reranking)
app.post('/api/users/search', async (req, res) => {
  try {
    const { query, branchId } = req.body;

    if (!branchId) {
      return res.status(400).json({ error: 'branchId is required' });
    }

    const users = await User.search(query, branchId);
    res.json(users);
  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({ error: 'Failed to search users' });
  }
});

// Branch endpoints
app.get('/api/branches', async (req, res) => {
  try {
    const branches = await Branch.find({});
    res.json(branches);
  } catch (error) {
    console.error('Error fetching branches:', error);
    res.status(500).json({ error: 'Failed to fetch branches' });
  }
});

app.get('/api/branches/:id', async (req, res) => {
  try {
    const branch = await Branch.findById(req.params.id);
    if (!branch) {
      return res.status(404).json({ error: 'Branch not found' });
    }
    res.json(branch);
  } catch (error) {
    console.error('Error fetching branch:', error);
    res.status(500).json({ error: 'Failed to fetch branch' });
  }
});

app.post('/api/branches', async (req, res) => {
  try {
    const branch = new Branch({
      ...req.body,
      updatedAt: new Date()
    });
    await branch.save();
    res.status(201).json(branch);
  } catch (error) {
    console.error('Error creating branch:', error);
    res.status(500).json({ error: 'Failed to create branch' });
  }
});

app.put('/api/branches/:id', async (req, res) => {
  try {
    const branch = await Branch.findByIdAndUpdate(
      req.params.id,
      { ...req.body, updatedAt: new Date() },
      { new: true }
    );
    if (!branch) {
      return res.status(404).json({ error: 'Branch not found' });
    }
    res.json(branch);
  } catch (error) {
    console.error('Error updating branch:', error);
    res.status(500).json({ error: 'Failed to update branch' });
  }
});

app.delete('/api/branches/:id', async (req, res) => {
  try {
    const branch = await Branch.findByIdAndDelete(req.params.id);
    if (!branch) {
      return res.status(404).json({ error: 'Branch not found' });
    }
    res.json({ message: 'Branch deleted successfully' });
  } catch (error) {
    console.error('Error deleting branch:', error);
    res.status(500).json({ error: 'Failed to delete branch' });
  }
});

// Search branches (with reranking)
app.post('/api/branches/search', async (req, res) => {
  try {
    const { query, branchId } = req.body;
    const branches = await Branch.search(query, branchId);
    res.json(branches);
  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({ error: 'Failed to search branches' });
  }
});

// Central branch-specific search endpoint (with reranking)
app.post('/api/search', async (req, res) => {
  try {
    const { query, branchId } = req.body;

    if (!branchId) {
      return res.status(400).json({ error: 'branchId is required' });
    }

    const searchResults = await Branch.centralSearch(query, branchId);
    res.json(searchResults);

  } catch (error) {
    console.error('Central search error:', error);
    res.status(500).json({ error: 'Failed to perform search' });
  }
});

const PORT = 4000;
app.listen(PORT, async () => {
  console.log(`Server running on port ${PORT}`);

  try {
    await connectMongoDB();

    const [sentenceTransformerModelId, rerankerModelId] = await Promise.all([
      deployModel('sentence-transformer.json'),
      deployModel('cross-encoder.json')
    ])

    await Promise.all([
      createPostsIndex(sentenceTransformerModelId, rerankerModelId),
      createPagesIndex(sentenceTransformerModelId, rerankerModelId),
      createUsersIndex(sentenceTransformerModelId, rerankerModelId),
      createBranchIndexes(sentenceTransformerModelId, rerankerModelId),
      initializeDefaultPosts(),
      initializeDefaultPages(),
      initializeDefaultUsers(),
    ])

    isInitialized = true;
    console.log('--------------------------------------------');
    console.log('Server initialization completed successfully');
    console.log('--------------------------------------------');
  } catch (error) {
    console.error('Error during initialization:', error);
    // Don't set isInitialized to true if there's an error
  }
});
