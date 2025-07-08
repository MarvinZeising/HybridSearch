import express from 'express';
import {NewsPost} from './NewsPost.js';
import {asyncHandler} from '../middleware/errorHandler.js';
import {validateBranchId} from '../middleware/validation.js';

const router = express.Router();

// Controller functions
const createPost = asyncHandler(async (req, res) => {
  const { title, description, content } = req.body;
  const post = new NewsPost({ title, description, content });
  await post.save();
  res.status(201).json(post);
});

const getAllPosts = asyncHandler(async (req, res) => {
  const posts = await NewsPost.find().sort({ createdAt: -1 });
  res.status(200).json(posts);
});

const getPostById = asyncHandler(async (req, res) => {
  const post = await NewsPost.findById(req.params.id);
  if (!post) {
    return res.status(404).json({error: `${'Post'} not found`});
  }
  res.status(200).json(post);
});

const updatePost = asyncHandler(async (req, res) => {
  const { title, description, content } = req.body;
  const post = await NewsPost.findByIdAndUpdate(
    req.params.id,
    { title, description, content },
    { new: true, runValidators: true }
  );
  if (!post) {
    return res.status(404).json({error: `${'Post'} not found`});
  }
  res.status(200).json(post);
});

const deletePost = asyncHandler(async (req, res) => {
  const post = await NewsPost.findByIdAndDelete(req.params.id);
  if (!post) {
    return res.status(404).json({error: `${'Post'} not found`});
  }
  res.status(204).send();
});

const searchPosts = asyncHandler(async (req, res) => {
  const { query, branchId } = req.body;
  const posts = await NewsPost.search(query, branchId);
  res.status(200).json(posts);
});

// CRUD operations
router.post('/', createPost);
router.get('/', getAllPosts);
router.get('/:id', getPostById);
router.put('/:id', updatePost);
router.delete('/:id', deletePost);

// Search
router.post('/search', validateBranchId, searchPosts);

export default router;
