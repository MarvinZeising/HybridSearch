import express from 'express';
import {Page} from './Page.js';
import {asyncHandler} from '../middleware/errorHandler.js';
import {validateBranchId} from '../middleware/validation.js';

const router = express.Router();

// Controller functions
const createPage = asyncHandler(async (req, res) => {
  const { title, description, content, category, tags, isPublished } = req.body;
  const page = new Page({ title, description, content, category, tags, isPublished });
  await page.save();
  res.status(201).json(page);
});

const getAllPages = asyncHandler(async (req, res) => {
  const pages = await Page.find().sort({ createdAt: -1 });
  res.status(200).json(pages);
});

const getPageById = asyncHandler(async (req, res) => {
  const page = await Page.findById(req.params.id);
  if (!page) {
    return res.status(404).json({error: `${'Page'} not found`});
  }
  res.status(200).json(page);
});

const updatePage = asyncHandler(async (req, res) => {
  const { title, description, content, category, tags, isPublished } = req.body;
  const page = await Page.findByIdAndUpdate(
    req.params.id,
    { title, description, content, category, tags, isPublished, updatedAt: new Date() },
    { new: true, runValidators: true }
  );
  if (!page) {
    return res.status(404).json({error: `${'Page'} not found`});
  }
  res.status(200).json(page);
});

const deletePage = asyncHandler(async (req, res) => {
  const page = await Page.findByIdAndDelete(req.params.id);
  if (!page) {
    return res.status(404).json({error: `${'Page'} not found`});
  }
  res.status(204).send();
});

const searchPages = asyncHandler(async (req, res) => {
  const { query, branchId } = req.body;
  const pages = await Page.search(query, branchId);
  res.status(200).json(pages);
});

// CRUD operations
router.post('/', createPage);
router.get('/', getAllPages);
router.get('/:id', getPageById);
router.put('/:id', updatePage);
router.delete('/:id', deletePage);

// Search
router.post('/search', validateBranchId, searchPages);

export default router;
