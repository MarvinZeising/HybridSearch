import express from 'express';
import {User} from './User.js';
import {asyncHandler} from '../middleware/errorHandler.js';
import {validateBranchId} from '../middleware/validation.js';

const router = express.Router();

// Controller functions
const createUser = asyncHandler(async (req, res) => {
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
});

const getAllUsers = asyncHandler(async (req, res) => {
  const users = await User.find().populate('managerId', 'firstName lastName email jobTitle').sort({ createdAt: -1 });
  res.status(200).json(users);
});

const getUserById = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id).populate('managerId', 'firstName lastName email jobTitle');
  if (!user) {
    return res.status(404).json({error: `${'User'} not found`});
  }
  res.status(200).json(user);
});

const updateUser = asyncHandler(async (req, res) => {
  const { firstName, lastName, email, jobTitle, department, managerId, employeeId, phone, location, profilePhoto, isActive } = req.body;
  const user = await User.findByIdAndUpdate(
    req.params.id,
    { firstName, lastName, email, jobTitle, department, managerId, employeeId, phone, location, profilePhoto, isActive, updatedAt: new Date() },
    { new: true, runValidators: true }
  );
  if (!user) {
    return res.status(404).json({error: `${'User'} not found`});
  }
  res.status(200).json(user);
});

const deleteUser = asyncHandler(async (req, res) => {
  const user = await User.findByIdAndDelete(req.params.id);
  if (!user) {
    return res.status(404).json({error: `${'User'} not found`});
  }
  res.status(204).send();
});

const getUsersByDepartment = asyncHandler(async (req, res) => {
  const users = await User.find({ department: req.params.department })
    .populate('managerId', 'firstName lastName email jobTitle')
    .sort({ firstName: 1, lastName: 1 });
  res.status(200).json(users);
});

const getUsersByManager = asyncHandler(async (req, res) => {
  const users = await User.find({ managerId: req.params.managerId })
    .populate('managerId', 'firstName lastName email jobTitle')
    .sort({ firstName: 1, lastName: 1 });
  res.status(200).json(users);
});

const searchUsers = asyncHandler(async (req, res) => {
  const { query, branchId } = req.body;
  const users = await User.search(query, branchId);
  res.status(200).json(users);
});

// CRUD operations
router.post('/', createUser);
router.get('/', getAllUsers);
router.get('/:id', getUserById);
router.put('/:id', updateUser);
router.delete('/:id', deleteUser);

// Department and manager queries
router.get('/department/:department', getUsersByDepartment);
router.get('/manager/:managerId', getUsersByManager);

// Search
router.post('/search', validateBranchId, searchUsers);

export default router;
