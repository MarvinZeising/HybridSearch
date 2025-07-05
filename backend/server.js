import express from 'express';
import cors from 'cors';
import connectMongoDB from './mongodb.js';
import { NewsPost, initializeDefaultPosts } from './posts/NewsPost.js';
import { createIndex, createPagesIndex, createUsersIndex } from './posts/createIndex.js';
import deployModel from "./models/deployModel.js";
import { Page, initializeDefaultPages } from './pages/Page.js';
import { User, initializeDefaultUsers } from './users/User.js';
import { Branch, initializeDefaultBranches } from './branches/Branch.js';
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

// Search posts
app.post('/api/news/search', async (req, res) => {
  try {
    const { query, branchId } = req.body;

    if (!branchId) {
      return res.status(400).json({ error: 'branchId is required' });
    }

    const posts = await NewsPost.search(query, branchId, false);
    res.json(posts);
  } catch (error) {
    console.error('Search error:', error.error ? error.error.root_cause : error);
    res.status(500).json({ error: 'Failed to search posts' });
  }
});

app.post('/api/news/search-reranked', async (req, res) => {
  try {
    const { query, branchId } = req.body;

    if (!branchId) {
      return res.status(400).json({ error: 'branchId is required' });
    }

    const posts = await NewsPost.search(query, branchId, true);
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
    const { query, branchId } = req.body;

    if (!branchId) {
      return res.status(400).json({ error: 'branchId is required' });
    }

    const pages = await Page.search(query, branchId, false);
    res.json(pages);
  } catch (error) {
    console.error('Search error:', error.error ? error.error.root_cause : error);
    res.status(500).json({ error: 'Failed to search pages' });
  }
});

// Search pages with reranking
app.post('/api/pages/search-reranked', async (req, res) => {
  try {
    const { query, branchId } = req.body;

    if (!branchId) {
      return res.status(400).json({ error: 'branchId is required' });
    }

    const pages = await Page.search(query, branchId, true);
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
    const { query, branchId } = req.body;

    if (!branchId) {
      return res.status(400).json({ error: 'branchId is required' });
    }

    const users = await User.search(query, branchId, false);
    res.json(users);
  } catch (error) {
    console.error('Search error:', error.error ? error.error.root_cause : error);
    res.status(500).json({ error: 'Failed to search users' });
  }
});

// Search users with reranking
app.post('/api/users/search-reranked', async (req, res) => {
  try {
    const { query, branchId } = req.body;

    if (!branchId) {
      return res.status(400).json({ error: 'branchId is required' });
    }

    const users = await User.search(query, branchId, true);
    res.json(users);
  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({ error: 'Failed to search users' });
  }
});

// Branch endpoints
app.get('/api/branches', async (req, res) => {
  try {
    const branches = await Branch.find({});
    res.json(branches);
  } catch (error) {
    console.error('Error fetching branches:', error);
    res.status(500).json({ error: 'Failed to fetch branches' });
  }
});

app.get('/api/branches/:id', async (req, res) => {
  try {
    const branch = await Branch.findById(req.params.id);
    if (!branch) {
      return res.status(404).json({ error: 'Branch not found' });
    }
    res.json(branch);
  } catch (error) {
    console.error('Error fetching branch:', error);
    res.status(500).json({ error: 'Failed to fetch branch' });
  }
});

app.post('/api/branches', async (req, res) => {
  try {
    const branch = new Branch({
      ...req.body,
      updatedAt: new Date()
    });
    await branch.save();
    res.status(201).json(branch);
  } catch (error) {
    console.error('Error creating branch:', error);
    res.status(500).json({ error: 'Failed to create branch' });
  }
});

app.put('/api/branches/:id', async (req, res) => {
  try {
    const branch = await Branch.findByIdAndUpdate(
      req.params.id,
      { ...req.body, updatedAt: new Date() },
      { new: true }
    );
    if (!branch) {
      return res.status(404).json({ error: 'Branch not found' });
    }
    res.json(branch);
  } catch (error) {
    console.error('Error updating branch:', error);
    res.status(500).json({ error: 'Failed to update branch' });
  }
});

app.delete('/api/branches/:id', async (req, res) => {
  try {
    const branch = await Branch.findByIdAndDelete(req.params.id);
    if (!branch) {
      return res.status(404).json({ error: 'Branch not found' });
    }
    res.json({ message: 'Branch deleted successfully' });
  } catch (error) {
    console.error('Error deleting branch:', error);
    res.status(500).json({ error: 'Failed to delete branch' });
  }
});

// Search branches
app.post('/api/branches/search', async (req, res) => {
  try {
    const { query, branchId } = req.body;
    const branches = await Branch.search(query, branchId, false);
    res.json(branches);
  } catch (error) {
    console.error('Search error:', error.error ? error.error.root_cause : error);
    res.status(500).json({ error: 'Failed to search branches' });
  }
});

// Search branches with reranking
app.post('/api/branches/search-reranked', async (req, res) => {
  try {
    const { query, branchId } = req.body;
    const branches = await Branch.search(query, branchId, true);
    res.json(branches);
  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({ error: 'Failed to search branches' });
  }
});

// Central branch-specific search endpoint
app.post('/api/search', async (req, res) => {
  try {
    const { query, useReranking = false, branchId } = req.body;

    if (!branchId) {
      return res.status(400).json({ error: 'branchId is required' });
    }

    // Build search requests for all data types within the specified branch
    const postsSearchPipeline = useReranking ? 'posts-search-pipeline-reranked' : 'posts-search-pipeline';
    const pagesSearchPipeline = useReranking ? 'pages-search-pipeline-reranked' : 'pages-search-pipeline';
    const usersSearchPipeline = useReranking ? 'users-search-pipeline-reranked' : 'users-search-pipeline';
    const branchesSearchPipeline = useReranking ? 'branches-search-pipeline-reranked' : 'branches-search-pipeline';

    // Filter MongoDB queries by branchId
    const [posts, pages, users, branches] = await Promise.all([
      NewsPost.find({ branchId: branchId }),
      Page.find({ branchId: branchId }),
      User.find({ branchId: branchId }).populate('managerId', 'firstName lastName email jobTitle'),
      Branch.find({ branchId: branchId })
    ]);

    // Get IDs for OpenSearch queries
    const postIds = posts.map(post => post._id.toString());
    const pageIds = pages.map(page => page._id.toString());
    const userIds = users.map(user => user._id.toString());
    const branchIds = branches.map(branch => branch._id.toString());

    // If no data found for this branch, return empty results
    if (postIds.length === 0 && pageIds.length === 0 && userIds.length === 0 && branchIds.length === 0) {
      return res.json({
        results: [],
        totalHits: {
          posts: 0,
          pages: 0,
          users: 0,
          branches: 0
        }
      });
    }

    // Build search queries with ID filters
    const baseQueries = {
      posts: postIds.length > 0 ? {
        query: {
          bool: {
            must: [
              {
                terms: {
                  _id: postIds
                }
              },
              {
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
              }
            ]
          }
        },
        search_pipeline: postsSearchPipeline
      } : null,

      pages: pageIds.length > 0 ? {
        query: {
          bool: {
            must: [
              {
                terms: {
                  _id: pageIds
                }
              },
              {
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
              }
            ]
          }
        },
        search_pipeline: pagesSearchPipeline
      } : null,

      users: userIds.length > 0 ? {
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
              }
            ]
          }
        },
        search_pipeline: usersSearchPipeline
      } : null,

      branches: branchIds.length > 0 ? {
        query: {
          bool: {
            must: [
              {
                terms: {
                  _id: branchIds
                }
              },
              {
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
              }
            ]
          }
        },
        search_pipeline: branchesSearchPipeline
      } : null
    };

    // Add reranking context if using reranking
    if (useReranking) {
      Object.values(baseQueries).forEach(queryObj => {
        if (queryObj) {
          queryObj.ext = {
            rerank: {
              query_context: {
                query_text: query
              }
            }
          };
        }
      });
    }

    // Execute searches in parallel
    const searchPromises = [];
    const indices = [];

    if (baseQueries.posts) {
      searchPromises.push(axios.post('http://opensearch:9200/posts/_search', baseQueries.posts));
      indices.push('posts');
    }
    if (baseQueries.pages) {
      searchPromises.push(axios.post('http://opensearch:9200/pages/_search', baseQueries.pages));
      indices.push('pages');
    }
    if (baseQueries.users) {
      searchPromises.push(axios.post('http://opensearch:9200/users/_search', baseQueries.users));
      indices.push('users');
    }
    if (baseQueries.branches) {
      searchPromises.push(axios.post(`http://opensearch:9200/branch-${branchId}/_search`, baseQueries.branches));
      indices.push('branches');
    }

    const searchResponses = await Promise.all(searchPromises);

    // Initialize results
    let postsHits = [], pagesHits = [], usersHits = [], branchesHits = [];
    let postsTotal = 0, pagesTotal = 0, usersTotal = 0, branchesTotal = 0;

    // Map results back to their respective types
    searchResponses.forEach((response, index) => {
      const type = indices[index];
      const hits = response.data.hits.hits;
      const total = response.data.hits.total.value;

      switch (type) {
        case 'posts':
          postsHits = hits;
          postsTotal = total;
          break;
        case 'pages':
          pagesHits = hits;
          pagesTotal = total;
          break;
        case 'users':
          usersHits = hits;
          usersTotal = total;
          break;
        case 'branches':
          branchesHits = hits;
          branchesTotal = total;
          break;
      }
    });

    // Add scores and type information to results
    const postsWithScores = posts.filter(post =>
      postsHits.some(hit => hit._id === post.id)
    ).map(post => {
      const score = postsHits.find(hit => hit._id === post.id)?._score || 0;
      return { ...post._doc, score, type: 'post' };
    });

    const pagesWithScores = pages.filter(page =>
      pagesHits.some(hit => hit._id === page.id)
    ).map(page => {
      const score = pagesHits.find(hit => hit._id === page.id)?._score || 0;
      return { ...page._doc, score, type: 'page' };
    });

    const usersWithScores = users.filter(user =>
      usersHits.some(hit => hit._id === user.id)
    ).map(user => {
      const score = usersHits.find(hit => hit._id === user.id)?._score || 0;
      return { ...user._doc, score, type: 'user' };
    });

    const branchesWithScores = branches.filter(branch =>
      branchesHits.some(hit => hit._id === branch.id)
    ).map(branch => {
      const score = branchesHits.find(hit => hit._id === branch.id)?._score || 0;
      return { ...branch._doc, score, type: 'branch' };
    });

    // Combine all results and sort by score
    const allResults = [...postsWithScores, ...pagesWithScores, ...usersWithScores, ...branchesWithScores]
      .sort((a, b) => b.score - a.score);

    res.json({
      results: allResults,
      totalHits: {
        posts: postsTotal,
        pages: pagesTotal,
        users: usersTotal,
        branches: branchesTotal
      }
    });

  } catch (error) {
    console.error('Branch search error:', error.response?.data || error);
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
      initializeDefaultUsers(),
      initializeDefaultBranches()
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
