import { Hono, type Context } from 'hono';
import { User } from './User.ts';
import { asyncHandler } from '../middleware/errorHandler.ts';

const router = new Hono();

const createUser = asyncHandler(async (c: Context) => {
  const { firstName, lastName, email, jobTitle, department, managerId, employeeId, phone, location, profilePhoto } = await c.req.json();
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
  return c.json(user, 201);
});

const getAllUsers = asyncHandler(async (c: Context) => {
  const users = await User.find().populate('managerId', 'firstName lastName email jobTitle').sort({ createdAt: -1 });
  return c.json(users, 200);
});

const getUserById = asyncHandler(async (c: Context) => {
  const user = await User.findById(c.req.param('id')).populate('managerId', 'firstName lastName email jobTitle');
  if (!user) {
    return c.json({ error: `User not found` }, 404);
  }
  return c.json(user, 200);
});

const updateUser = asyncHandler(async (c: Context) => {
  const { firstName, lastName, email, jobTitle, department, managerId, employeeId, phone, location, profilePhoto, isActive } = await c.req.json();
  const user = await User.findByIdAndUpdate(
    c.req.param('id'),
    { firstName, lastName, email, jobTitle, department, managerId, employeeId, phone, location, profilePhoto, isActive, updatedAt: new Date() },
    { new: true, runValidators: true }
  );
  if (!user) {
    return c.json({ error: `User not found` }, 404);
  }
  return c.json(user, 200);
});

const deleteUser = asyncHandler(async (c: Context) => {
  const user = await User.findByIdAndDelete(c.req.param('id'));
  if (!user) {
    return c.json({ error: `User not found` }, 404);
  }
  return c.body(null, 204);
});

const getUsersByDepartment = asyncHandler(async (c: Context) => {
  const users = await User.find({ department: c.req.param('department') })
    .populate('managerId', 'firstName lastName email jobTitle')
    .sort({ firstName: 1, lastName: 1 });
  return c.json(users, 200);
});

const getUsersByManager = asyncHandler(async (c: Context) => {
  const users = await User.find({ managerId: c.req.param('managerId') })
    .populate('managerId', 'firstName lastName email jobTitle')
    .sort({ firstName: 1, lastName: 1 });
  return c.json(users, 200);
});

const searchUsers = asyncHandler(async (c: Context) => {
  const { query, branchId } = await c.req.json();
  const users = await User.search(query, branchId);
  return c.json(users, 200);
});

router.post('/', createUser);
router.get('/', getAllUsers);
router.get('/:id', getUserById);
router.put('/:id', updateUser);
router.delete('/:id', deleteUser);
router.get('/department/:department', getUsersByDepartment);
router.get('/manager/:managerId', getUsersByManager);
router.post('/search', searchUsers);

export default router;
