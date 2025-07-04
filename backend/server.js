import express from 'express';
import cors from 'cors';
import connectMongoDB from './mongodb.js';
import { NewsPost, initializeDefaultPosts } from './posts/NewsPost.js';
import { createIndex, createPagesIndex, createUsersIndex } from './posts/createIndex.js';
import deployModel from "./models/deployModel.js";
import { Page, initializeDefaultPages } from './pages/Page.js';
import { User, initializeDefaultUsers } from './users/User.js';
import axios from 'axios'; // Added for multisearch

const app = express();
app.use(cors());
app.use(express.json());

// Track initialization status
let isInitialized = false;

// Health check endpoint
app.get('/health', (req, res) => {
  if (!isInitialized) {
    return res.status(503).json({ status: 'initializing' });
  }
  res.status(200).json({ status: 'healthy' });
});

// API endpoint to create a news post
app.post('/api/news', async (req, res) => {
  try {
    const { title, description, content } = req.body;
    const post = new NewsPost({ title, description, content });
    await post.save();
    res.status(201).json(post);
  } catch (err) {
    res.status(500).json({ error: 'Failed to create post' });
  }
});

// Get all posts
app.get('/api/news', async (req, res) => {
  try {
    const posts = await NewsPost.find().sort({ createdAt: -1 });
    res.json(posts);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch posts' });
  }
});

// Get a single post
app.get('/api/news/:id', async (req, res) => {
  try {
    const post = await NewsPost.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }
    res.json(post);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch post' });
  }
});

// Update a post
app.put('/api/news/:id', async (req, res) => {
  try {
    const { title, description, content } = req.body;
    const post = await NewsPost.findByIdAndUpdate(
      req.params.id,
      { title, description, content },
      { new: true, runValidators: true }
    );
    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }
    res.json(post);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update post' });
  }
});

// Delete a post
app.delete('/api/news/:id', async (req, res) => {
  try {
    const post = await NewsPost.findByIdAndDelete(req.params.id);
    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }
    res.status(204).send();
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete post' });
  }
});

app.post('/api/news/search', async (req, res) => {
  try {
    const { query } = req.body;
    const posts = await NewsPost.search(query, false);
    res.json(posts);
  } catch (error) {
    console.error('Search error:', error.error ? error.error.root_cause : error);
    res.status(500).json({ error: 'Failed to search posts' });
  }
});

app.post('/api/news/search-reranked', async (req, res) => {
  try {
    const { query } = req.body;
    const posts = await NewsPost.search(query, true);
    res.json(posts);
  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({ error: 'Failed to search posts' });
  }
});

// API endpoint to create a page
app.post('/api/pages', async (req, res) => {
  try {
    const { title, description, content, category, tags, isPublished } = req.body;
    const page = new Page({ title, description, content, category, tags, isPublished });
    await page.save();
    res.status(201).json(page);
  } catch (err) {
    res.status(500).json({ error: 'Failed to create page' });
  }
});

// Get all pages
app.get('/api/pages', async (req, res) => {
  try {
    const pages = await Page.find().sort({ createdAt: -1 });
    res.json(pages);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch pages' });
  }
});

// Get a single page
app.get('/api/pages/:id', async (req, res) => {
  try {
    const page = await Page.findById(req.params.id);
    if (!page) {
      return res.status(404).json({ error: 'Page not found' });
    }
    res.json(page);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch page' });
  }
});

// Update a page
app.put('/api/pages/:id', async (req, res) => {
  try {
    const { title, description, content, category, tags, isPublished } = req.body;
    const page = await Page.findByIdAndUpdate(
      req.params.id,
      { title, description, content, category, tags, isPublished, updatedAt: new Date() },
      { new: true, runValidators: true }
    );
    if (!page) {
      return res.status(404).json({ error: 'Page not found' });
    }
    res.json(page);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update page' });
  }
});

// Delete a page
app.delete('/api/pages/:id', async (req, res) => {
  try {
    const page = await Page.findByIdAndDelete(req.params.id);
    if (!page) {
      return res.status(404).json({ error: 'Page not found' });
    }
    res.status(204).send();
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete page' });
  }
});

// Search pages
app.post('/api/pages/search', async (req, res) => {
  try {
    const { query } = req.body;
    const pages = await Page.search(query, false);
    res.json(pages);
  } catch (error) {
    console.error('Search error:', error.error ? error.error.root_cause : error);
    res.status(500).json({ error: 'Failed to search pages' });
  }
});

// Search pages with reranking
app.post('/api/pages/search-reranked', async (req, res) => {
  try {
    const { query } = req.body;
    const pages = await Page.search(query, true);
    res.json(pages);
  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({ error: 'Failed to search pages' });
  }
});

// API endpoint to create a user
app.post('/api/users', async (req, res) => {
  try {
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
  } catch (err) {
    res.status(500).json({ error: 'Failed to create user' });
  }
});

// Get all users
app.get('/api/users', async (req, res) => {
  try {
    const users = await User.find().populate('managerId', 'firstName lastName email jobTitle').sort({ createdAt: -1 });
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// Get a single user
app.get('/api/users/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id).populate('managerId', 'firstName lastName email jobTitle');
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch user' });
  }
});

// Update a user
app.put('/api/users/:id', async (req, res) => {
  try {
    const { firstName, lastName, email, jobTitle, department, managerId, employeeId, phone, location, profilePhoto, isActive } = req.body;
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { firstName, lastName, email, jobTitle, department, managerId, employeeId, phone, location, profilePhoto, isActive, updatedAt: new Date() },
      { new: true, runValidators: true }
    );
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update user' });
  }
});

// Delete a user
app.delete('/api/users/:id', async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.status(204).send();
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete user' });
  }
});

// Get users by department
app.get('/api/users/department/:department', async (req, res) => {
  try {
    const users = await User.find({ department: req.params.department })
      .populate('managerId', 'firstName lastName email jobTitle')
      .sort({ firstName: 1, lastName: 1 });
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch users by department' });
  }
});

// Get users by manager
app.get('/api/users/manager/:managerId', async (req, res) => {
  try {
    const users = await User.find({ managerId: req.params.managerId })
      .populate('managerId', 'firstName lastName email jobTitle')
      .sort({ firstName: 1, lastName: 1 });
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch users by manager' });
  }
});

// Search users
app.post('/api/users/search', async (req, res) => {
  try {
    const { query } = req.body;
    const users = await User.search(query, false);
    res.json(users);
  } catch (error) {
    console.error('Search error:', error.error ? error.error.root_cause : error);
    res.status(500).json({ error: 'Failed to search users' });
  }
});

// Search users with reranking
app.post('/api/users/search-reranked', async (req, res) => {
  try {
    const { query } = req.body;
    const users = await User.search(query, true);
    res.json(users);
  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({ error: 'Failed to search users' });
  }
});

// Central multisearch endpoint
app.post('/api/search', async (req, res) => {
  try {
    const { query, useReranking = false } = req.body;

    // Build search requests for all three indices
    const postsSearchPipeline = useReranking ? 'posts-search-pipeline-reranked' : 'posts-search-pipeline';
    const pagesSearchPipeline = useReranking ? 'pages-search-pipeline-reranked' : 'pages-search-pipeline';
    const usersSearchPipeline = useReranking ? 'users-search-pipeline-reranked' : 'users-search-pipeline';

    const postsQuery = {
      query: {
        hybrid: {
          queries: [
            {
              multi_match: {
                query: query,
                fields: ['title^4', 'description'],
                type: 'best_fields',
                fuzziness: 'AUTO'
              }
            },
            {
              nested: {
                score_mode: 'max',
                path: 'embeddings',
                query: {
                  neural: {
                    'embeddings.knn': {
                      query_text: query,
                      k: 5
                    }
                  }
                }
              }
            }
          ]
        }
      },
      search_pipeline: postsSearchPipeline
    };

    const pagesQuery = {
      query: {
        hybrid: {
          queries: [
            {
              multi_match: {
                query: query,
                fields: ['title^4', 'description^2', 'content'],
                type: 'best_fields',
                fuzziness: 'AUTO'
              }
            },
            {
              nested: {
                score_mode: 'max',
                path: 'embeddings',
                query: {
                  neural: {
                    'embeddings.knn': {
                      query_text: query,
                      k: 5
                    }
                  }
                }
              }
            }
          ]
        }
      },
      search_pipeline: pagesSearchPipeline
    };

    const usersQuery = {
      query: {
        hybrid: {
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
      search_pipeline: usersSearchPipeline
    };

    // Add reranking context if using reranking
    if (useReranking) {
      postsQuery.ext = {
        rerank: {
          query_context: {
            query_text: query
          }
        }
      };

      pagesQuery.ext = {
        rerank: {
          query_context: {
            query_text: query
          }
        }
      };

      usersQuery.ext = {
        rerank: {
          query_context: {
            query_text: query
          }
        }
      };
    }

    // Build multisearch request body
    const msearchBody = [
      { index: 'posts' },
      postsQuery,
      { index: 'pages' },
      pagesQuery,
      { index: 'users' },
      usersQuery
    ];

    // Execute multisearch
    const searchResponse = await axios.post(
      'http://opensearch:9200/_msearch',
      msearchBody.map(item => JSON.stringify(item)).join('\n') + '\n',
      {
        headers: {
          'Content-Type': 'application/x-ndjson'
        }
      }
    );

    const responses = searchResponse.data.responses;

    // Extract IDs from each response
    const postsHits = responses[0].hits?.hits || [];
    const pagesHits = responses[1].hits?.hits || [];
    const usersHits = responses[2].hits?.hits || [];

    const postIds = postsHits.map(hit => hit._id);
    const pageIds = pagesHits.map(hit => hit._id);
    const userIds = usersHits.map(hit => hit._id);

    // Fetch full documents from MongoDB
    const [posts, pages, users] = await Promise.all([
      postIds.length > 0 ? NewsPost.find({ _id: { $in: postIds } }) : [],
      pageIds.length > 0 ? Page.find({ _id: { $in: pageIds } }) : [],
      userIds.length > 0 ? User.find({ _id: { $in: userIds } }).populate('managerId', 'firstName lastName email jobTitle') : []
    ]);

    // Add scores and type information to results
    const postsWithScores = posts.map(post => {
      const score = postsHits.find(hit => hit._id === post.id)?._score || 0;
      return { ...post._doc, score, type: 'post' };
    });

    const pagesWithScores = pages.map(page => {
      const score = pagesHits.find(hit => hit._id === page.id)?._score || 0;
      return { ...page._doc, score, type: 'page' };
    });

    const usersWithScores = users.map(user => {
      const score = usersHits.find(hit => hit._id === user.id)?._score || 0;
      return { ...user._doc, score, type: 'user' };
    });

    // Combine all results and sort by score
    const allResults = [...postsWithScores, ...pagesWithScores, ...usersWithScores]
      .sort((a, b) => b.score - a.score);

    res.json({
      results: allResults,
      totalHits: {
        posts: responses[0].hits?.total?.value || 0,
        pages: responses[1].hits?.total?.value || 0,
        users: responses[2].hits?.total?.value || 0
      }
    });

  } catch (error) {
    console.error('Multisearch error:', error.response?.data || error);
    res.status(500).json({ error: 'Failed to perform search' });
  }
});

const PORT = 4000;
app.listen(PORT, async () => {
  console.log(`Server running on port ${PORT}`);

  await connectMongoDB();

  try {
    const [sentenceTransformerModelId, rerankerModelId] = await Promise.all([
      deployModel('sentence-transformer.json'),
      deployModel('cross-encoder.json')
    ])

    await Promise.all([
      createIndex(sentenceTransformerModelId, rerankerModelId),
      createPagesIndex(sentenceTransformerModelId, rerankerModelId),
      createUsersIndex(sentenceTransformerModelId, rerankerModelId),
      initializeDefaultPosts(),
      initializeDefaultPages(),
      initializeDefaultUsers()
    ])

    isInitialized = true;
    console.log('--------------------------------------------');
    console.log('Server initialization completed successfully');
    console.log('--------------------------------------------');
  } catch (error) {
    console.error('Error during initialization:', error);
    // Don't set isInitialized to true if there's an error
  }
});
