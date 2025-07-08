import mongoose, { Document, Model } from 'mongoose';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import axios from 'axios';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface IUser extends Document {
  firstName: string;
  lastName: string;
  email: string;
  jobTitle: string;
  department: string;
  managerId: mongoose.Types.ObjectId | null;
  employeeId: string;
  hireDate: Date;
  isActive: boolean;
  phone?: string;
  location?: string;
  profilePhoto?: string | null;
  branchId: string;
  createdAt: Date;
  updatedAt: Date;
  fullName?: string;
}

const UserSchema = new mongoose.Schema<IUser>({
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
  profilePhoto: { type: String, default: null },
  branchId: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

UserSchema.virtual('fullName').get(function (this: IUser) {
  return `${this.firstName} ${this.lastName}`;
});
UserSchema.set('toJSON', { virtuals: true });

UserSchema.pre('save', function (next) {
  if (!this.profilePhoto && this.firstName && this.lastName && this.department) {
    this.profilePhoto = generateProfilePhoto(this.firstName, this.lastName, this.department);
  }
  next();
});

function generateProfilePhoto(firstName: string, lastName: string, department: string): string {
  // Placeholder: implement your logic or return a default URL
  return `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(firstName + ' ' + lastName)}&backgroundType=gradientLinear&backgroundColor=ffdfbf,ffd6e0,c0aede,b6e3f4`;
}

interface UserModel extends Model<IUser> {
  search(query: string, branchId: string): Promise<any[]>;
}

const User = mongoose.model<IUser, UserModel>('User', UserSchema);

UserSchema.statics.search = async function (query: string, branchId: string) {
  try {
    const searchBody = {
      query: {
        hybrid: {
          filter: {
            term: {
              branchId: branchId
            }
          },
          queries: [
            {
              multi_match: {
                query: query,
                fields: ['firstName^3', 'lastName^3', 'jobTitle^2', 'department^2', 'fullName^4'],
                type: 'best_fields',
                fuzziness: 'AUTO'
              }
            },
            {
              neural: {
                embedding: {
                  query_text: query,
                  k: 5
                }
              }
            }
          ]
        }
      },
      ext: {
        rerank: {
          query_context: {
            query_text: query
          }
        }
      }
    };
    const searchResponse = await axios.post(`http://opensearch:9200/users/_search?search_pipeline=users-search-pipeline`, searchBody);
    const hits = searchResponse.data.hits.hits;
    const userIds = hits.map((hit: any) => hit._id);
    const plainUsers = await this.find({
      _id: { $in: userIds }
    }).populate('managerId', 'firstName lastName email jobTitle');
    return plainUsers.map((user: any) => {
      const score = hits.find((x: any) => x._id === user.id)._score;
      return { ...user._doc, score };
    }).sort((a: any, b: any) => b.score - a.score);
  } catch (error: any) {
    console.error('Search error:', error.response?.data || error);
    throw new Error('Failed to search users');
  }
};

export async function initializeDefaultUsers(): Promise<void> {
  try {
    console.log('Creating users collection');
    await User.createCollection();

    const count = await User.countDocuments();
    if (count === 0) {
      console.log('No users found, inserting default users...');

      const defaultUsersPath = path.join(__dirname, 'assets', 'default-users.json');
      const defaultUsers = JSON.parse(fs.readFileSync(defaultUsersPath, 'utf8'));

      const usersWithoutManager = defaultUsers.map((user: any) => ({
        ...user,
        managerId: null
      }));

      const insertedUsers = await User.insertMany(usersWithoutManager);

      console.log('Default users inserted successfully');

      const userIdMap: Record<string, mongoose.Types.ObjectId> = {};

      insertedUsers.forEach((user: any) => {
        userIdMap[user.employeeId] = user._id;
      });

      for (const user of insertedUsers) {
        const originalUser = defaultUsers.find((u: any) => u.employeeId === user.employeeId);
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

export { User };
