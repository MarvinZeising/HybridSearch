import { Hono, type Context } from 'hono';
import { NewsPost } from './NewsPost.ts';
import { asyncHandler } from '../middleware/errorHandler.ts';

const router = new Hono();

// Controller functions
const createPost = asyncHandler(async (c: Context) => {
  const { title, description, content } = await c.req.json();
  const post = new NewsPost({ title, description, content });
  await post.save();
  return c.json(post, 201);
});

const getAllPosts = asyncHandler(async (c: Context) => {
  const posts = await NewsPost.find().sort({ createdAt: -1 });
  return c.json(posts, 200);
});

const getPostById = asyncHandler(async (c: Context) => {
  const post = await NewsPost.findById(c.req.param('id'));
  if (!post) {
    return c.json({ error: `Post not found` }, 404);
  }
  return c.json(post, 200);
});

const updatePost = asyncHandler(async (c: Context) => {
  const { title, description, content } = await c.req.json();
  const post = await NewsPost.findByIdAndUpdate(
    c.req.param('id'),
    { title, description, content },
    { new: true, runValidators: true }
  );
  if (!post) {
    return c.json({ error: `Post not found` }, 404);
  }
  return c.json(post, 200);
});

const deletePost = asyncHandler(async (c: Context) => {
  const post = await NewsPost.findByIdAndDelete(c.req.param('id'));
  if (!post) {
    return c.json({ error: `Post not found` }, 404);
  }
  return c.body(null, 204);
});

const searchPosts = asyncHandler(async (c: Context) => {
  const { query, branchId } = await c.req.json();
  const posts = await NewsPost.search(query, branchId);
  return c.json(posts, 200);
});

// CRUD operations
router.post('/', createPost);
router.get('/', getAllPosts);
router.get('/:id', getPostById);
router.put('/:id', updatePost);
router.delete('/:id', deletePost);

// Search
router.post('/search', searchPosts);

export default router;
