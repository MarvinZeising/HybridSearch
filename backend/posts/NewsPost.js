import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const NewsPostSchema = new mongoose.Schema({
  title: String,
  description: String,
  createdAt: { type: Date, default: Date.now }
});

const NewsPost = mongoose.model('Post', NewsPostSchema);

async function initializeDefaultPosts() {
  try {
    console.log('Creating news posts collection');
    await NewsPost.createCollection();

    // Check if we already have posts
    const count = await NewsPost.countDocuments();
    if (count === 0) {
      console.log('No posts found, inserting default posts...');

      // Read and parse the default posts
      const defaultPostsPath = path.join(__dirname, 'default-posts.json');
      const defaultPosts = JSON.parse(fs.readFileSync(defaultPostsPath, 'utf8'));

      // Insert the posts
      await NewsPost.insertMany(defaultPosts);
      console.log('Default posts inserted successfully');
    } else {
      console.log('Database already contains posts, skipping default posts insertion');
    }
  } catch (error) {
    console.error('Error inserting default posts:', error);
    throw error;
  }
}

export { NewsPost, initializeDefaultPosts };
