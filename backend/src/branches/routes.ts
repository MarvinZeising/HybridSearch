import { Hono, type Context } from 'hono';
import { Branch } from './Branch.ts';
import { asyncHandler } from '../middleware/errorHandler.ts';

const router = new Hono();

const getAllBranches = asyncHandler(async (c: Context) => {
  const branches = await Branch.find({});
  return c.json(branches, 200);
});

const getBranchById = asyncHandler(async (c: Context) => {
  const branch = await Branch.findById(c.req.param('id'));
  if (!branch) {
    return c.json({ error: `Branch not found` }, 404);
  }
  return c.json(branch, 200);
});

const createBranch = asyncHandler(async (c: Context) => {
  const branch = new Branch({
    // @ts-ignore
    ...(await c.req.json()),
    updatedAt: new Date()
  });
  await branch.save();
  return c.json(branch, 201);
});

const updateBranch = asyncHandler(async (c: Context) => {
  const branch = await Branch.findByIdAndUpdate(
    c.req.param('id'),
    { ...(await c.req.json()), updatedAt: new Date() },
    { new: true }
  );
  if (!branch) {
    return c.json({ error: `Branch not found` }, 404);
  }
  return c.json(branch, 200);
});

const deleteBranch = asyncHandler(async (c: Context) => {
  const branch = await Branch.findByIdAndDelete(c.req.param('id'));
  if (!branch) {
    return c.json({ error: `Branch not found` }, 404);
  }
  return c.json({ message: 'Branch deleted successfully' }, 200);
});

const searchBranch = asyncHandler(async (c: Context) => {
  const { query } = await c.req.json();
  const branchId = c.req.param('id');
  const searchResults = await Branch.search(query, branchId);
  return c.json(searchResults, 200);
});

router.get('/', getAllBranches);
router.get('/:id', getBranchById);
router.post('/', createBranch);
router.put('/:id', updateBranch);
router.delete('/:id', deleteBranch);
router.post('/:id/search', searchBranch);

export default router;
