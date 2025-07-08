import { Hono, type Context } from 'hono';
import { Page } from './Page.ts';
import { asyncHandler } from '../middleware/errorHandler.ts';

const router = new Hono();

const createPage = asyncHandler(async (c: Context) => {
  const { title, description, content, category, tags, isPublished } = await c.req.json();
  const page = new Page({ title, description, content, category, tags, isPublished });
  await page.save();
  return c.json(page, 201);
});

const getAllPages = asyncHandler(async (c: Context) => {
  const pages = await Page.find().sort({ createdAt: -1 });
  return c.json(pages, 200);
});

const getPageById = asyncHandler(async (c: Context) => {
  const page = await Page.findById(c.req.param('id'));
  if (!page) {
    return c.json({ error: `Page not found` }, 404);
  }
  return c.json(page, 200);
});

const updatePage = asyncHandler(async (c: Context) => {
  const { title, description, content, category, tags, isPublished } = await c.req.json();
  const page = await Page.findByIdAndUpdate(
    c.req.param('id'),
    { title, description, content, category, tags, isPublished, updatedAt: new Date() },
    { new: true, runValidators: true }
  );
  if (!page) {
    return c.json({ error: `Page not found` }, 404);
  }
  return c.json(page, 200);
});

const deletePage = asyncHandler(async (c: Context) => {
  const page = await Page.findByIdAndDelete(c.req.param('id'));
  if (!page) {
    return c.json({ error: `Page not found` }, 404);
  }
  return c.body(null, 204);
});

const searchPages = asyncHandler(async (c: Context) => {
  const { query, branchId } = await c.req.json();
  const pages = await Page.search(query, branchId);
  return c.json(pages, 200);
});

router.post('/', createPage);
router.get('/', getAllPages);
router.get('/:id', getPageById);
router.put('/:id', updatePage);
router.delete('/:id', deletePage);
router.post('/search', searchPages);

export default router;
