import express from 'express';
import {Branch} from './Branch.js';
import {asyncHandler} from '../middleware/errorHandler.js';

const router = express.Router();

// Controller functions
const getAllBranches = asyncHandler(async (req, res) => {
  const branches = await Branch.find({});
  res.status(200).json(branches);
});

const getBranchById = asyncHandler(async (req, res) => {
  const branch = await Branch.findById(req.params.id);
  if (!branch) {
    return res.status(404).json({error: `${'Branch'} not found`});
  }
  res.status(200).json(branch);
});

const createBranch = asyncHandler(async (req, res) => {
  const branch = new Branch({
    ...req.body,
    updatedAt: new Date()
  });
  await branch.save();
  res.status(201).json(branch);
});

const updateBranch = asyncHandler(async (req, res) => {
  const branch = await Branch.findByIdAndUpdate(
    req.params.id,
    { ...req.body, updatedAt: new Date() },
    { new: true }
  );
  if (!branch) {
    return res.status(404).json({error: `${'Branch'} not found`});
  }
  res.status(200).json(branch);
});

const deleteBranch = asyncHandler(async (req, res) => {
  const branch = await Branch.findByIdAndDelete(req.params.id);
  if (!branch) {
    return res.status(404).json({error: `${'Branch'} not found`});
  }
  res.status(200).json({message: 'Branch deleted successfully'});
});

const searchBranches = asyncHandler(async (req, res) => {
  const { query, branchId } = req.body;
  const branches = await Branch.search(query, branchId);
  res.status(200).json(branches);
});

const searchBranch = asyncHandler(async (req, res) => {
  const { query } = req.body;
  const branchId = req.params.id;
  const searchResults = await Branch.searchContent(query, branchId);
  res.status(200).json(searchResults);
});

// CRUD operations
router.get('/', getAllBranches);
router.get('/:id', getBranchById);
router.post('/', createBranch);
router.put('/:id', updateBranch);
router.delete('/:id', deleteBranch);

// Search
router.post('/search', searchBranches);
router.post('/:id/search', searchBranch);

export default router;
