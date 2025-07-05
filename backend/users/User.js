import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import axios from 'axios';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const UserSchema = new mongoose.Schema({
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  jobTitle: { type: String, required: true },
  department: { type: String, required: true },
  managerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  employeeId: { type: String, required: true, unique: true },
  hireDate: { type: Date, default: Date.now },
  isActive: { type: Boolean, default: true },
  phone: String,
  location: String,
  profilePhoto: { type: String, default: null }, // URL or path to profile photo
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Virtual for full name
UserSchema.virtual('fullName').get(function() {
  return `${this.firstName} ${this.lastName}`;
});

// Ensure virtual fields are serialized
UserSchema.set('toJSON', { virtuals: true });

// Pre-save middleware to generate profile photo if not provided
UserSchema.pre('save', function(next) {
  if (!this.profilePhoto && this.firstName && this.lastName && this.department) {
    this.profilePhoto = generateProfilePhoto(this.firstName, this.lastName, this.department);
  }
  next();
});

const User = mongoose.model('User', UserSchema);

// Static method to search users using OpenSearch
User.search = async function(query, branchId, useReranking = false) {
  try {
    // First filter by branchId in MongoDB
    const allUsers = await this.find({ branchId: branchId }).populate('managerId', 'firstName lastName email jobTitle');

    if (allUsers.length === 0) {
      return [];
    }

    const userIds = allUsers.map(user => user._id.toString());

    const searchPipeline = useReranking ? 'users-search-pipeline-reranked' : 'users-search-pipeline';
    const searchBody = {
      query: {
        bool: {
          must: [
            {
              terms: {
                _id: userIds
              }
            },
            {
              hybrid: {
                queries: [
                  {
                    multi_match: { // keyword search
                      query: query,
                      fields: ['firstName^3', 'lastName^3', 'jobTitle^2', 'department^2', 'fullName^4'],
                      type: 'best_fields',
                      fuzziness: 'AUTO'
                    }
                  },
                  {
                    neural: { // neural search using sentence transformer
                      embedding: {
                        query_text: query,
                        k: 5
                      }
                    }
                  }
                ]
              }
            }
          ]
        }
      }
    };

    // Add reranking context if using reranking
    if (useReranking) {
      searchBody.ext = {
        rerank: { // rerank results using cross-encoder
          query_context: {
            query_text: query
          }
        }
      };
    }

    const searchResponse = await axios.post(`http://opensearch:9200/users/_search?search_pipeline=${searchPipeline}`, searchBody);

    const hits = searchResponse.data.hits.hits;
    const hitIds = hits.map(hit => hit._id);

    // Filter users that actually matched the search
    const matchedUsers = allUsers.filter(user => hitIds.includes(user._id.toString()));

    return matchedUsers.map((user) => {
      const score = hits.find(x => x._id === user.id)._score;
      return {...user._doc, score};
    })
    .sort((a, b) => b.score - a.score);
  } catch (error) {
    console.error('Search error:', error.response?.data || error);
    throw new Error('Failed to search users');
  }
};

async function initializeDefaultUsers() {
  try {
    console.log('Creating users collection');
    await User.createCollection();

    // Check if we already have users
    const count = await User.countDocuments();
    if (count === 0) {
      console.log('No users found, inserting default users...');

      // Read and parse the default users
      const defaultUsersPath = path.join(__dirname, 'default-users.json');
      const defaultUsers = JSON.parse(fs.readFileSync(defaultUsersPath, 'utf8'));

      // First, insert all users without managerId to get their ObjectIds
      const usersWithoutManager = defaultUsers.map(user => ({
        ...user,
        managerId: null // Temporarily set to null
      }));

      const insertedUsers = await User.insertMany(usersWithoutManager);
      console.log('Default users inserted successfully');

      // Create a map of employeeId to ObjectId
      const userIdMap = {};
      insertedUsers.forEach(user => {
        userIdMap[user.employeeId] = user._id;
      });

      // Update managerId references
      for (const user of insertedUsers) {
        const originalUser = defaultUsers.find(u => u.employeeId === user.employeeId);
        if (originalUser && originalUser.managerId) {
          const managerObjectId = userIdMap[originalUser.managerId];
          if (managerObjectId) {
            await User.findByIdAndUpdate(user._id, { managerId: managerObjectId });
          }
        }
      }

      console.log('Manager relationships updated successfully');
    } else {
      console.log('Database already contains users, skipping default users insertion');
    }
  } catch (error) {
    console.error('Error inserting default users:', error);
    throw error;
  }
}

// Color schemes for different departments
const departmentColors = {
  'Executive': 'b6e3f4',
  'Engineering': 'ffdfbf',
  'Finance': 'd1d4f9',
  'Marketing': 'ffd5dc',
  'HR': 'd4edda',
  'Sales': 'ffeaa7',
  'Operations': 'e8d5c4'
};

// Generate profile photo URL for a user
export function generateProfilePhoto(firstName, lastName, department) {
  const seed = `${firstName}${lastName}`;
  const backgroundColor = departmentColors[department] || 'b6e3f4';
  return `https://api.dicebear.com/7.x/avataaars/svg?seed=${seed}&backgroundColor=${backgroundColor}`;
}

export { User, initializeDefaultUsers };
