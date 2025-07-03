import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import axios from 'axios';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PageSchema = new mongoose.Schema({
  title: String,
  description: String,
  content: String,
  category: { type: String, default: 'General' },
  tags: [String],
  isPublished: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

const Page = mongoose.model('Page', PageSchema);

// Static method to search pages using OpenSearch
Page.search = async function(query, useReranking = false) {
  try {
    const searchPipeline = useReranking ? 'pages-search-pipeline-reranked' : 'pages-search-pipeline';
    const searchBody = {
      query: {
        hybrid: {
          queries: [
            {
              multi_match: { // keyword search
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
                  neural: { // neural search using sentence transformer
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

    const searchResponse = await axios.post(`http://opensearch:9200/pages/_search?search_pipeline=${searchPipeline}`, searchBody);

    const hits = searchResponse.data.hits.hits;
    const pageIds = hits.map(hit => hit._id);

    // Fetch full documents from MongoDB using the IDs
    const plainPages = await this.find({
      _id: { $in: pageIds }
    });

    return plainPages.map((page) => {
      const score = hits.find(x => x._id === page.id)._score;
      return {...page._doc, score};
    })
    .sort((a, b) => b.score - a.score);
  } catch (error) {
    console.error('Search error:', error.response?.data || error);
    throw new Error('Failed to search pages');
  }
};

async function initializeDefaultPages() {
  try {
    console.log('Creating pages collection');
    await Page.createCollection();

    // Check if we already have pages
    const count = await Page.countDocuments();
    if (count === 0) {
      console.log('No pages found, inserting default pages...');

      // Read and parse the default pages
      const defaultPagesPath = path.join(__dirname, 'default-pages.json');
      const defaultPages = JSON.parse(fs.readFileSync(defaultPagesPath, 'utf8'));

      // Insert the pages
      await Page.insertMany(defaultPages);
      console.log('Default pages inserted successfully');
    } else {
      console.log('Database already contains pages, skipping default pages insertion');
    }
  } catch (error) {
    console.error('Error inserting default pages:', error);
    throw error;
  }
}

export { Page, initializeDefaultPages };
